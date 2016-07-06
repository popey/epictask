import {getAction} from 'typedux'

import {Container} from 'typescript-ioc'
const diff = require('immutablediff')
import {Events} from '../Constants'
import {transformValues} from '../util/ObjectUtil'


const log = getLogger(__filename)

const clients = {}
const windowMap = {}
const ipcListeners = []

const addIpcListener = (channel:string,listener) => {
	ipcMain.on(channel,listener)
	ipcListeners.push([channel,listener])
}

const electron = require('electron')

const {ipcMain,BrowserWindow} = electron


function unregisterRenderer(webContentsId) {
	if (!Env.isDev)
		clients[webContentsId].active = false
}

function attachEvents(store) {


	/**
	 * Retrieves the current state from the main
	 * process and returns sync via ipc
	 *
	 * @param event
	 */
	function getMainState(event) {
		log.info('Getting state for renderer')

		const mainState = store.getState()
		const mainStateJS = mainState.toJS()

		const finalMainStateJS = transformValues(mainStateJS,
			(key,val) => (val.toJS) ? val.toJS() : val)
		event.returnValue = finalMainStateJS
	}


	/**
	 * Renderer dispatch
	 *
	 * @param event
	 * @param leaf
	 * @param name
	 * @param args
	 */
	function rendererDispatch(event,leaf,name,args) {
		const action = getAction(leaf,name)
		if (!action)
			throw new Error(`Could not find action ${leaf}:${name} on main process`)

		log.info(`Executing action on main: ${leaf}:${name}`)
		action((factory) => {
			return Container.get(factory)
		},...args)
	}

	addIpcListener(Events.StoreGetMainState,getMainState)

	addIpcListener(Events.StoreRendererDispatch,rendererDispatch)

	addIpcListener(Events.StoreRendererRegister, (event, { filter, clientId }) => {
		const { sender } = event

		const
			webContentsId = sender.id,
			browserWindow = BrowserWindow.fromWebContents(sender)

		clients[webContentsId] = {
			webContents: sender,
			filter,
			clientId,
			windowId: browserWindow.id,
			active: true
		}

		if (windowMap[browserWindow.id] !== undefined) {
			unregisterRenderer(windowMap[browserWindow.id])
		}
		windowMap[browserWindow.id] = webContentsId

		// WebContents aren't automatically destroyed on window close
		// browserWindow.on('closed', () => unregisterRenderer(webContentsId))

		event.returnValue = true
	});
}


/**
 * Broadcasts action and resulting state to
 * clients / browserWindows'
 *
 * @param action
 * @param newState
 */
let lastSentState = null
let patchNumber = 0

function broadcastActionAndStateToClients(action,newState) {
	if (!newState || !action)
		return

	if (newState === lastSentState)
		return

	function getStatePatch() {
		// First check the last state we sent
		lastSentState = lastSentState || Immutable.Map()

		// Create a patch
		statePatch = _.cloneDeep(diff(lastSentState,newState).toJS())
		lastSentState = newState

		return statePatch

	}

	let statePatch = getStatePatch()
	patchNumber++
	Object.keys(clients)
		.map(key => ({
			webContentsId:key,
			client:clients[key]
		}))
		.filter(({client}) => client.active)
		.forEach(({webContentsId,client}) => {
			const {webContents} = client
			try {
				if (webContents.isDestroyed() || webContents.isCrashed()) {
					unregisterRenderer(webContentsId)
					return
				}

				webContents.send(Events.StoreMainStateChanged, {action, patchNumber, patch: statePatch})
			} catch (err) {
				log.error('Failed to send message to renderer, probably destroyed, removing',err)
				unregisterRenderer(webContentsId)
			}
		})
}

/**
 * Main enhancer => post dispatch simply forwards action
 * + new state to renderers/clients
 *
 * @param storeCreator
 * @returns {(reducer:any, initialState:any)=>undefined}
 */
function mainStoreEnhancer(storeCreator) {

		return (reducer, initialState) => {
			let store = storeCreator(reducer, initialState)

			attachEvents(store)

			const storeDotDispatch = store.dispatch

			store.dispatch = (action) => {
				const state = store.getState()
				storeDotDispatch(action)
				const newState = store.getState()

				if (state === newState)
					return


					broadcastActionAndStateToClients(action,newState)

			}

			return store
		}

}


if (module.hot) {
	module.hot.dispose(() => {
		log.info('disposing')
		ipcListeners.forEach(([channel,listener]) => {
			ipcMain.removeListener(channel,listener)
		})
	})
}

export default mainStoreEnhancer