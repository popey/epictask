import { ActionMessage } from "typedux"


import { AppStoreServerName } from "epic-entry-shared/ProcessType"
import { Transport, getDefaultTransport } from "epic-net"
import { ActionMessageFilter, IActionMessageHandler } from "epic-typedux/filter"
import {uuid} from 'epic-util'
import { cloneObjectShallow ,getHot, setDataOnHotDispose, REQUEST_TIMEOUT, getValue, AppStoreServerEventNames } from "epic-global"
import { fromPlainObject, toPlainObject } from "typetransform"


import TWorkerProcessMessageHandler = ProcessClient.TMessageHandler


const
	log = getLogger(__filename),
	id = `${ProcessConfig.getTypeName()}-${process.pid}`

//log.setOverrideLevel(LogLevel.DEBUG)

let
	storeReady = false,
	pendingActions = []

/**
 * Push actions to the store
 *
 * @param actions
 */
function pushStoreAction(...actions) {
	const
		store = getValue(() => storeReady && getReduxStore())
	
	if (!store) {
		const
			newActions = actions
				.filter(action => !pendingActions.includes(action))
		
		pendingActions.push(...newActions)
		return false
	} else {
		actions.forEach(action => store.dispatch(action))
		return true
	}
}

/**
 * Mark store as ready and push pending actions
 *
 * @param ready
 */
export function setStoreReady(ready:boolean) {
	storeReady = ready
	
	if (ready && pendingActions.length) {
		pushStoreAction(...pendingActions) &&
		(pendingActions = [])
	}
}

/**
 * Wrapper for observer
 */
interface ObserveWrapper {
	id:string,
	keyPath:string|string[]
	resolver:Promise.Resolver<Function>
	handler:TClientStateHandler
	remover?:Function
}


const
	actionProxies = getHot(module, 'actionProxies', {}),
	observers:{[id:string]:ObserveWrapper} = getHot(module, 'observers', {}),
	stateRequests = getHot(module, 'stateRequests', {})

let
	transport = getHot(module, 'transport', null) as Transport

setDataOnHotDispose(module, () => ({
	actionProxies,
	observers,
	stateRequests,
	transport
}))


/**
 * Homogenized sendMessage to work in all processes
 */
const sendMessage = (type:string, body:any = {}) => {
	return connect().then(() => {
		transport.emit(type, body)
	})
}


/**
 * Create a new action client
 *
 * @param leaf
 * @param type
 */
function newActionClient(leaf, type) {
	return function (...args) {
		return sendMessage(AppStoreServerEventNames.ActionRequest, {
			leaf,
			type,
			args
		})
	}
}

/**
 * get an action client
 *
 * @param leaf
 * @returns {any}
 */
export function getActionClient(leaf:string):any {
	return new Proxy({}, {
		get(target, type) {
			const fullName = `${leaf}.${type}`
			
			return actionProxies[ fullName ] ||
				(actionProxies[ fullName ] = newActionClient(leaf, type))
		}
	})
}


export type TClientStateHandler = (newValue, oldValue) => any

/**
 * Push a message to the server,
 * if it passes the filter
 *
 * @param action
 */
export const sendStoreAction:((handler:IActionMessageHandler<any,any>) => IActionMessageHandler<any,any>) = ActionMessageFilter((action:ActionMessage<any>) => {
	action = toPlainObject(cloneObjectShallow(action, {
		windowId: getWindowId(),
		fromChildId: id
	}))
	sendMessage(AppStoreServerEventNames.ChildStoreAction, { id, action })
})

/**
 * Observer a state value @ at given keypath
 *
 * @param keyPath
 * @param handler
 * @returns {Promise<Function>}
 */
export function clientObserveState(keyPath:string|string[],
                                   handler:TClientStateHandler):Promise<Function> {
	
	const
		id = uuid(),
		wrapper:ObserveWrapper = observers[ id ] = {
			id,
			keyPath,
			resolver: Promise.defer(),
			handler
		},
		{ reject } = wrapper.resolver
	
	sendMessage(AppStoreServerEventNames.ObserveStateRequest, { id, keyPath }).catch(err => reject(err))
	
	return wrapper
		.resolver
		.promise
		.timeout(REQUEST_TIMEOUT)
		.catch((err) => {
			log.error(`Failed to set state observer`, wrapper, err)
			delete observers[ id ]
			reject(err)
		}) as Promise<Function>
	
}

/**
 * Retrieve a state value
 *
 * @param keyPath
 */
export async function getStateValue(...keyPath:string[]):Promise<any> {
	
	const
		id = uuid(),
		request = stateRequests[ id ] = {
			id,
			keyPath,
			resolver: Promise.defer()
		},
		{ reject } = request.resolver
	
	try {
		await sendMessage(AppStoreServerEventNames.StateRequest, { id, keyPath })
	} catch (err) {
		reject(err)
	}
	
	return request
		.resolver
		.promise
		.timeout(REQUEST_TIMEOUT)
		.catch((err) => {
			log.error(`Failed to get state value`, err)
			reject(err)
		})
}


/**
 * Connect function - runs serially
 */
function connect():Promise<any> {
	
	if (!transport) {
		transport = getDefaultTransport({
			hostname: AppStoreServerName,
			raw: true
		} as any)
		
		log.info(`Connecting to store server`)
		
		return transport
			.connect()
			.then(() => {
				log.info(`Store server CONNECTED`)
				attachEvents(transport)
			})
			
			.catch(err => {
				log.error(`Failed to connect to store server`, err)
				transport = null
				
				throw err
			})
	}
	
	return transport
		.waitForConnection()
	
}


/**
 * Attach event handlers to app store transport
 *
 * @param transport
 */
function attachEvents(transport) {
	
	
	transport.on(AppStoreServerEventNames.ChildStoreActionReducer, ({ action }) => {
		action = fromPlainObject(action)
		log.debug(`Received reducer action from server`, action)
		// if (!childStoreWrapper)
		// 	return log.error(`Unknown child store ${id}`)
		//
		const
			{ fromChildId, fromWindowId, windowId } = action,
			ids = [ fromChildId, fromWindowId, windowId ],
			isNewAction = !ids.includes(id) && !ids.includes(getWindowId())
		
		if (!isNewAction) {
			log.debug(`I sent this so no need to dispatch again`)
			return
		}
		
		pushStoreAction(action)
	})
	
	/**
	 * Handle observe state change
	 */
	transport.on(AppStoreServerEventNames.ObserveStateChange, ({ id, newValue, oldValue }) => {
		const
			observer = observers[ id ]
		
		if (!observer) {
			log.error(`Received a message for id ${id} - but no observer found`)
		}
		
		observer.handler(newValue, oldValue)
	})
	
	/**
	 * Handle observe responses
	 */
	transport.on(AppStoreServerEventNames.ObserveStateResponse, ({ id, err }) => {
		const
			observer = observers[ id ]
		
		if (!observer) {
			return log.error(`Got response for unknown observer ${id}`, id, err)
		}
		
		if (err) {
			return observer.resolver.reject(err)
		}
		
		observer.remover = () => {
			sendMessage(AppStoreServerEventNames.ObserveStateRemove, { id })
			delete observers[ id ]
		}
		
		observer.resolver.resolve(observer.remover)
		
	})
	
	
	transport.on(AppStoreServerEventNames.StateResponse, ({ id, value, err }) => {
		const
			request = stateRequests[ id ]
		
		if (!request) {
			return log.error(`Got response for unknown state request ${id}`, id, value, err)
		}
		
		if (err) {
			return request.resolver.reject(err)
		}
		
		value = fromPlainObject(value)
		
		request.resolver.resolve(value)
	})
	
}
