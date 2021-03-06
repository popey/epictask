

import {uuid} from "epic-util"
import { Map } from 'immutable'
import {VariableProxy} from 'epic-util'
import {
	getHot,
	setDataOnHotDispose,
	acceptHot,
	isString, addHotDisposeHandler,AppEventType,SimpleEventEmitter
} from "epic-global"
import { ProcessType } from "epic-entry-shared/ProcessType"
import { benchmark } from "epic-util"
import { DatabaseAdapter, getDatabaseAdapter } from "epic-database-adapters"
//import { Stores } from "./Stores"

	

const
	log = getLogger(__filename)

// DEBUG LOGGING
//log.setOverrideLevel(LogLevel.DEBUG)


const
	pendingUnGroupedChanges:IDatabaseChange[] = []


const emitChanges = _.debounce(() => {
	
	const
		changeCount = Math.min(300,pendingUnGroupedChanges.length),
		ungroupedChanges = pendingUnGroupedChanges.slice(0,changeCount),
		changesByType = _.groupBy(ungroupedChanges,it => it.type)
	
	// CLEAR PENDING LIST
	pendingUnGroupedChanges.splice(0,changeCount)
	
	// EMIT
	Object
		.keys(changesByType)
		.forEach(type => {
			const
				changes = changesByType[type]
			
			log.debug(`Broadcast changes for "${type}, count=${changes.length}"`)
			getChangeEmitter(type).emit(changes)
		})
	
	if (pendingUnGroupedChanges.length)
		emitChanges()
	
},500)

/**
 * On database changes received, emit them
 *
 * @param eventType
 * @param ungroupedChanges
 */
function onDatabaseChange(eventType:AppEventType, ungroupedChanges:IDatabaseChange[]) {
	//log.debug(`Change received`,ungroupedChanges)
	log.debug(`Received ${ungroupedChanges.length} changes`,_.uniq(ungroupedChanges.map(it => it.from)).join(', '))
	
	// QUEUE AND EMIT DEBOUNCED
	pendingUnGroupedChanges.push(...ungroupedChanges)
	emitChanges()
}


/**
 * Subscribe for database updates
 */
EventHub.on(AppEventType.DatabaseChanges,onDatabaseChange)

// HMR dispose handler
addHotDisposeHandler(module,() => {
	EventHub.removeListener(AppEventType.DatabaseChanges,onDatabaseChange)
})

/**
 * Database entry template
 *
 * @type {string}
 */

const
	changeEmitters = getHot(module,'changeEmitters', Map<string,SimpleEventEmitter<TDatabaseChangeListener>>().asMutable())


setDataOnHotDispose(module,() => ({changeEmitters}))

/**
 * Get the change emitter for a model type
 *
 * @param clazz
 */
function getChangeEmitter(clazz:IModelConstructor<any>|string):SimpleEventEmitter<TDatabaseChangeListener> {
	
	let
		type = isString(clazz) ? clazz : clazz.$$clazz
	
	if (!changeEmitters.has(type))
		changeEmitters.set(type,new SimpleEventEmitter<TDatabaseChangeListener>())
	
	
	return changeEmitters.get(type)
}

/**
 * Add a change listener
 *
 * @param clazz
 * @param listener
 */
export function addDatabaseChangeListener(clazz:IModelConstructor<any>,listener:TDatabaseChangeListener) {
	getChangeEmitter(clazz).addListener(listener)
}


/**
 * Remove a change listener
 *
 * @param clazz
 * @param listener
 */
export function removeDatabaseChangeListener(clazz:IModelConstructor<any>,listener:TDatabaseChangeListener) {
	getChangeEmitter(clazz).removeListener(listener)
}




/**
 * Create a singleton instance
 *
 * @type {DatabaseClient}
 */
let databaseClient:DatabaseClient = null


/**
 * Perm proxy to database client
 *
 * @type {VariableProxy<DatabaseClient>}
 */
let databaseClientProxy:VariableProxy<DatabaseClient> = getHot(module,'databaseClientProxy',null)



let readyDeferred:Promise.Resolver<any>

/**
 * DatabaseWindow wraps the background
 * renderer process that is used to manage
 * database requests
 *
 */

export class DatabaseClient {
	
	
	/**
	 * Get Singleton
	 *
	 * @returns {DatabaseClient}
	 */
	static getInstance():DatabaseClient {
		assert(!ProcessConfig.isType(ProcessType.DatabaseServer),'DatabaseClient can NOT be started on the DatabaseServer')
			
		if (!databaseClient)
			databaseClient = new DatabaseClient()
		
		if (!databaseClientProxy)
			databaseClientProxy = new VariableProxy(DatabaseClient as any,databaseClient)
		else
			databaseClientProxy.setTargets(DatabaseClient,databaseClient)
		
		return databaseClientProxy.handler
	}
	
	
	/**
	 * Internal adapter to use
	 */
	private adapter:DatabaseAdapter = getDatabaseAdapter()
	
	
	
	
	/**
	 * Create the client and IPC in raw mode
	 */
	private constructor() {
		
	}
	
	
	/**
	 * Direct database request
	 *
	 * @param fn
	 * @param args
	 */
	request(fn:string,args:any[])
	/**
	 * Request data from a store (ie user = UserStore, etc)
	 * NOTE: Mapped props on Stores class
	 * @param store
	 * @param fn
	 * @param args
	 */
	request(store:string,fn:string,args:any[])
	request(storeOrFn:string,fnOrArgs:string|any[],finalArgs:any[] = null) {
		
		
		const
			[store,fn,args] = ((isString(fnOrArgs)) ?
				[storeOrFn,fnOrArgs,finalArgs] :
				[null,storeOrFn,fnOrArgs]),
				
			request = {
				id: `${store || 'db'}-${fn}-${uuid()}`,
				store,
				fn,
				args
			}
		
		return benchmark(`Client Querying ${store}.${fn}`,() => this.adapter.execute(request))()
		
	}

	ready() {
		if (readyDeferred)
			return readyDeferred.promise
		
		readyDeferred = Promise.defer()
		
		this.adapter.start()
			.then(() => readyDeferred.resolve())
			.catch(err => readyDeferred.reject(err))
		
		return readyDeferred.promise
	}
	
	getStores():IStores {
		return this.adapter.getStores()
	}
	
	getAdapter() {
		return this.adapter
	}
	
	/**
	 * Create data context for plugin
	 *
	 * @returns {Promise<void>}
	 */
	createPluginDataContext(name:string,...modelConfigs:IPluginModelStoreConfig[]) {
		return this.getAdapter().createPluginDataContext(name,...modelConfigs)
	}
	
	
	/**
	 * Stop the database
	 *
	 * @returns {any}
	 */
	kill():Promise<any> {
		return this.adapter.stop()
		

	}

}


/**
 * Helper to get singleton
 * @returns {DatabaseClient}
 */
export function getDatabaseClient():DatabaseClient {
	return DatabaseClient.getInstance()
}


// Set container provider
Container.bind(DatabaseClient).provider({get: getDatabaseClient})


/**
 * Export the singleton by default
 */
export default new Proxy({}, {
	get: (target,prop) => getDatabaseClient()[prop]
}) as DatabaseClient


setDataOnHotDispose(module,() => ({
	databaseClientProxy
}))

acceptHot(module,log)

declare global {
	interface IDatabaseClient extends DatabaseClient {}
}