import * as Path from 'path'
import { Stores } from "epic-database-client/Stores"

import { Coordinator as TSCoordinator, Repo as TSRepo, IModel as TSIModel, FinderRequest } from "typestore"
import {
	tempFilename, getUserDataFilename, acceptHot, addHotDisposeHandler, getHot,
	setDataOnHotDispose, getValue
} from "epic-global"
import {uuid} from 'epic-util'
import { watchChanges } from "./DatabaseChangeMonitor"
import { isPromise, isFunction } from "typeguard"
import { PouchDBRepo,IPouchDBOptions, PouchDBPlugin } from "typestore-plugin-pouchdb"


import { UserStoreImpl } from "./stores/UserStoreImpl"
import { IssueStoreImpl } from "./stores/IssueStoreImpl"
import { RepoStoreImpl } from "./stores/RepoStoreImpl"
import { AvailableRepoStoreImpl } from "./stores/AvailableRepoStoreImpl"
import { MilestoneStoreImpl } from "./stores/MilestoneStoreImpl"
import { CommentStoreImpl } from "./stores/CommentStoreImpl"
import { LabelStoreImpl } from "./stores/LabelStoreImpl"
import { IssuesEventStoreImpl } from "./stores/IssuesEventStoreImpl"
import { RepoEventStoreImpl } from "./stores/RepoEventStoreImpl"
import { GithubNotificationStoreImpl } from "./stores/GithubNotificationStoreImpl"
import { DatabaseAdapter } from "epic-database-adapters/DatabaseAdapter"

const
	log = getLogger(__filename)

//DEBUG
//log.setOverrideLevel(LogLevel.DEBUG)




export class DatabaseLocalAdapter extends DatabaseAdapter {
	
	constructor() {
		super()
		
		// IN HMR RELOAD
		if (module.hot)
			DatabaseLocalAdapter.checkReloaded()
			
	}
	
	async start() {
		await DatabaseLocalAdapter.startAdapter()
	}
	
	async stop() {
		// Stop TypeStore Coordinator
		await DatabaseLocalAdapter.stopAdapter()
		 
	}
	
	
	async addStore<T extends TSIModel,TC extends IModelConstructor<T>,TR extends TSRepo<T>>(clazz:TC,storeClazz:{new ():TR}):Promise<TR> {
		return null
	}
	
	/**
	 * Get the underlying pouch db
	 *
	 * @param store
	 * @returns {any}
	 */
	getPouchDB(store:TSRepo<any>) {
		return (store as any).getPouchDB()
	}
	
	
	/**
	 * Execute a direct db call
	 *
	 * @param store
	 * @param name
	 * @param args
	 * @returns {any}
	 */
	direct(store:TSRepo<any>,name:string,...args) {
		return this.getPouchDB(store)[name](...args)
	}
	
	/**
	 * Get the current stores
	 *
	 * @returns {Stores}
	 */
	getStores():Stores {
		return DatabaseLocalAdapter.stores
	}
	
	/**
	 * Execute a request
	 *
	 * @param request
	 * @returns {IDatabaseResponse}
	 */
	async execute(request:IDatabaseRequest):Promise<IDatabaseResponse> {
		// Final Result
		let
			result,
			error
		
		const
			{ id:requestId, store:storeName, fn:fnName, args } = request,
			{stores,storePlugin} = DatabaseLocalAdapter
		
		try {
			
			
			if (storeName) {
				
				// Cleanup the store name
				const storeName2 = _.camelCase(storeName.replace(/Store$/i, ''))
				
				// Find the store
				let
					store = stores[ storeName ] || stores[ storeName2 ]
				
				assert(store, `Unable to find store for ${storeName} (requestId: ${requestId})`)
				
				if (fnName === 'db') {
					const
						dbFnName = args.shift()
					
					result = store.getPouchDB()[ dbFnName ](...args)
					
				} else {
					
					// Check finder options for limit
					if (args[ 0 ] && _.isNumber(args[ 0 ].limit))
						args[ 0 ] = new FinderRequest(args[ 0 ])
					
					// Get the results
					result = store[ fnName ](...args)
				}
				
			} else {
				result = await storePlugin.getDB(null)[ fnName ](...args)
				
			}
			
			// Ensure someone set a result
			assert(result, `Result can never be nil ${requestId}`)
			
			// If the result is a promise then wait
			if (isPromise(result) || isFunction(result.then))
				result = await result
			
			
		} catch (err) {
			log.error(`Failed to execute request`,request,err)
			error = err
		}
		
		return {
			requestId,
			result,
			error
		}
	}
	
}


export namespace DatabaseLocalAdapter {
	
	
	
	
	export let
		pendingDBUpdate:Promise.Resolver<any>,
		
		// PouchDB Plugin
		storePlugin:PouchDBPlugin = getHot(module, 'storePlugin') as PouchDBPlugin,
		
		// TypeStore coordinator
		coordinator:TSCoordinator = getHot(module, 'coordinator') as TSCoordinator,
		
		// Stores Ref
		stores:Stores = getHot(module, 'storePlugin', new Stores())
	
	setDataOnHotDispose(module, () => ({
		storePlugin,
		coordinator,
		stores
	}))
	
	
	export function isStarting() {
		return pendingDBUpdate && !pendingDBUpdate.promise.isResolved()
	}
	
	export function isStarted() {
		return storePlugin && coordinator && getValue(() => pendingDBUpdate.promise.isFulfilled(),false)
	}
	
	async function waitForStarted() {
		try {
			if (pendingDBUpdate && !pendingDBUpdate.promise.isResolved()) {
				await pendingDBUpdate.promise
			}
		} catch (err) {
			log.error(`Failed to start DB`)
		}
	}
	
	/**
	 * Create PouchDB store options
	 *
	 * @returns {{filename: string}}
	 */
	function storeOptions() {
		
		const
			opts:IPouchDBOptions = require('epic-database-config')
	
		
		log.debug(`Created store opts`, opts)
		
		return opts
	}
	
	
	/**
	 * Retrieve store from coordinator
	 *
	 * @param repoClazz
	 * @returns {T}
	 */
	export function getStore<T extends TSRepo<M>,M extends TSIModel>(repoClazz:{new():T}):T {
		const
			store = coordinator.getRepo(repoClazz)
		
		assert(store instanceof TSRepo,`Store must be an instance of TSRepo`)
		return store
	}
	
	
	/**
	 * Get underlying pouch db instance
	 *
	 * @param store
	 * @returns {any}
	 */
	function getPouchDB(store:PouchDBRepo<any>):any {
		return getValue(() => store.getPouchDB(),null)
	}
	
	
	/**
	 * Check if the adapter was reloaded
	 */
	export function checkReloaded() {
		if (stores && coordinator) {
			watchChanges(stores,getPouchDB)
		}
	}
	
	
	export async function stopAdapter() {
		if (!isStarted()) {
			return log.debug(`Can not stop database, not started`)
		}
			
		await coordinator.stop()
		
		coordinator = null
		storePlugin = null
		stores = null
		pendingDBUpdate = null
	}
	
	export async function startAdapter() {
		
		if (isStarted())
			return
		
		
		storePlugin = new PouchDBPlugin(storeOptions())
		
		coordinator = new TSCoordinator()
		
		await coordinator.init({}, storePlugin)
		
		const
			allModelsAndRepos = require('epic-models'),
			names = Object.keys(allModelsAndRepos)
		
		const modelClazzes = names
			.filter(name => {
				const
					val = allModelsAndRepos[ name ]
				
				return !_.endsWith(name, 'Store') && _.isFunction(val) && val.$$clazz
			})
			.map(name => {
				log.info(`Loading model class: ${name}`)
				return allModelsAndRepos[ name ]
			})
		
		await coordinator.start(...modelClazzes)
		
		log.debug('Coordinator started, loading repos')
		
		Object.assign(stores, {
			repo: getStore(RepoStoreImpl),
			issue: getStore(IssueStoreImpl),
			availableRepo: getStore(AvailableRepoStoreImpl),
			milestone: getStore(MilestoneStoreImpl),
			comment: getStore(CommentStoreImpl),
			label: getStore(LabelStoreImpl),
			user: getStore(UserStoreImpl),
			issuesEvent: getStore(IssuesEventStoreImpl),
			repoEvent: getStore(RepoEventStoreImpl),
			notification: getStore(GithubNotificationStoreImpl)
		})
		
		
		log.debug('Repos Loaded, subscribing to changes')
		
		
		
		
		// In DEBUG mode expose repos on global
		if (DEBUG) {
			assignGlobal({ Stores: stores })
		}
		
		log.debug(`Finally listen for changes`)
		watchChanges(stores,getPouchDB)
		
		// Now bind repos to the IOC
		Container.bind(Stores)
			.provider({ get: () => stores })
		
	}
	
	
	
	
}
