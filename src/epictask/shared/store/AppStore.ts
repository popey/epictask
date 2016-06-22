import {requireContext} from '../util/ContextUtils'
const log = getLogger(__filename)

import thunkMiddleware from 'redux-thunk'
import * as createLogger from 'redux-logger'
import { StoreEnhancer,compose, applyMiddleware } from 'redux'
import {Events} from 'shared/Constants'
import {AppActionFactory as AppActionFactoryType} from 'shared/actions/AppActionFactory'

const { electronEnhancer } = require('redux-electron-store')
const electron = require('electron')
const ipc = (Env.isRenderer) ? electron.ipcRenderer : electron.ipcMain as any


import {
	setStoreProvider,
	ILeafReducer,
	ObservableStore
} from 'typedux'


//const reduxLogger = createLogger();


const electronStoreSyncOpts = {
	synchronous:false
}

function getMainProcessState() {

	const mainState = ipc.sendSync(Events.GetMainState)
	log.debug('Got main state',Object.keys(mainState))
	return mainState
}


/**
 * Null middleware that can be used
 * wherever a passthru is required
 *
 * @param f
 * @constructor
 */
const NullMiddleware = f => f

/**
 * DevToolsMiddleware is configured in DEBUG mode anyway
 *
 * @type {function(): *}
 */
const devToolsMiddleware =
	(!DEBUG || !Env.isRenderer) ? NullMiddleware :
	(window.devToolsExtension) ? window.devToolsExtension() :
	require('ui/components/debug/DevTools.tsx').DevTools.instrument()

/**
 * Middleware includes thunk and in
 * DEBUG only + redux-logger + devtools
 *
 * @type {*[]}
 */
const middleware = [
	thunkMiddleware
]

// if (!Env.isRenderer) {
// 	middleware.push(reduxLogger)
// }

let store:ObservableStore<any>
let ctx:any

let hmrReady = false

function getReducers():ILeafReducer<any,any>[] {
	// TODO - LOAD FROM SERVICE REGISTRY
	ctx = require.context('shared/actions',true,/Reducer\.ts$/)

	// If HMR enabled then prepare for it
	if (module.hot && !hmrReady) {
		hmrReady = true
		module.hot.accept([ctx.id],(updates) => {
			log.info(`${Env.isRenderer ? 'Renderer ' : 'Main '} Reducer Updates received, reloading reducers`,
				updates)

			getStore().replaceReducers(...getReducers())
			//NOTE: We dont need to below code fro electron-redux between both
			// MAIN and RENDERER - are webpack apps
			//
			// if (Env.isRenderer) {
			// 	require('electron').ipcRenderer.sendSync('renderer-reload')
			// }
		})
	}

	const mods = ctx.keys().map(ctx)

	const reducers = []
	mods.forEach(mod => {
		for (let key of Object.keys(mod)) {
			if (_.endsWith(key,'Reducer')) {
				const reducerClazz = mod[key]
				reducers.push(new reducerClazz())
			}
		}
	})

	log.debug('Returning reducers',reducers)
	return reducers
}


/**
 * onChange event of store
 */
function onChange() {
	log.debug(`Store state changed`)

}

/**
 * Debug session key
 *
 * @returns {string}
 */
function getDebugSessionKey() {
	// You can write custom logic here!
	// By default we try to read the key from ?debug_session=<key> in the address bar
	//const matches = window.location.href.match(/[?&]debug_session=([^&#]+)\b/);
	//return (matches && matches.length > 0)? matches[1] : null;
	return 'electron-debug-session'
}

/**
 * OnError handling for all reducers
 *
 * @param err
 * @param reducer
 */
function onError(err:Error,reducer?:ILeafReducer<any,any>) {
	const AppActionFactory:typeof AppActionFactoryType = require('shared/actions').AppActionFactory

	const actions = new AppActionFactory()
	actions.addErrorMessage(err)
}

/**
 * Initialize/Create the store
 */
function initStore(defaultState = null) {

	const devTools = [devToolsMiddleware]
	// if (Env.isDev && Env.is) {
	// 	const statePersistence = require('redux-devtools').persistState(getDebugSessionKey())
	// 	devTools.push(statePersistence)
	// }

	const newStore = ObservableStore.createObservableStore(
		getReducers(),
		compose(
			applyMiddleware(...middleware),
			electronEnhancer(electronStoreSyncOpts),
			devToolsMiddleware
		) as StoreEnhancer<any>,
		defaultState
	)

	newStore.rootReducer.onError = onError
	newStore.subscribe(onChange)

	store = newStore
	setStoreProvider(newStore)
	return store
}


export function createStore() {
	// if (createStorePromise)
	// 	return createStorePromise


	let defaultState = (Env.isRenderer) ?
		getMainProcessState() :
		null

	return initStore(defaultState)

	// createStorePromise = (!Env.isRenderer) ?
	// 	Promise.resolve(initStore) :
	// 	new Promise((resolve,reject) => {
	// 		const {ipcRenderer} = require('electron')
	// 		ipcRenderer.on(Events.GetMainState,(event,mainState) => {
	// 			defaultState = mainState
	// 		})
	// 		ipcRenderer.sendSync(Events.GetMainState)
	// 	})
	//
	// return createStorePromise
}

export function getStore() {
	if (!store) {
		if (Env.isRenderer) {
			throw new Error('Only main process can synchronously init store, use createStore ')
		}
		initStore()
	}
	return store
}

export function getReduxStore() {
	return getStore().getReduxStore()
}



// If on the main process then add a handler for
// retrieving main state
if (!Env.isRenderer) {

	ipc.on(Events.GetMainState,(event) => {
		log.info('Getting state for renderer')

		const store = getReduxStore()
		const mainState = store ? store.getState() : null

		event.returnValue = mainState ? mainState.toJS() : null
	})
}



