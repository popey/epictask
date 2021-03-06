
import { DatabaseAdapter } from "epic-database-adapters/DatabaseAdapter"
import { Stores } from "epic-database-client/Stores"
import { Repo as TSRepo, IModel as TSIModel} from "typestore"
import { Transport } from "epic-net/Transport"
import { getDefaultTransport } from "epic-net/index"
import { DatabaseServerName } from "epic-entry-shared/ProcessType"
import { DatabaseEvents } from "epic-database-client/DatabaseEvents"
import { guard } from "epic-global"
import {canProxyProperty,uuid} from 'epic-util'
import { isString } from "typeguard"
import { cleanupStoreName } from "epic-database-adapters/DatabaseAdapterUtil"
const
	log = getLogger(__filename),
	TIMEOUT = 180000

//DEBUG
log.setOverrideLevel(LogLevel.DEBUG)

/**
 * Pending database request - internal
 */
interface IDatabasePendingRequest {
	id:string
	request:IDatabaseRequest
	deferred:Promise.Resolver<any>
}



/**
 * Database proxy function shape
 */
export type TDatabaseProxyFunction = (...args:any[]) => Promise<any>

/**
 * Database Client proxy - maps to a single store or no store
 */

class DatabaseProxy {
	
	private fnMap = {}
	
	constructor(private adapter:DatabaseAdapter,private store:string = null) {
		
	}
	
	
	/**
	 * Get proxy Function
	 *
	 * @param target
	 * @param fn
	 * @returns {TDatabaseProxyFunction}
	 */
	get(target,fn):TDatabaseProxyFunction {
		if (canProxyProperty(fn))
			return null
		
		log.debug(`Getting proxy for ${fn}`)
		
		const
			{store} = this
		
		return this.fnMap[fn] || (
				this.fnMap[fn] = (...args) => {
					log.debug(`Proxy request for ${fn}`)
					
					return this.adapter.execute({
						id: `${store || 'db'}-${fn}-${uuid()}`,
						store,
						fn,
						args
					})
				}
			)
		
	}
	
}



/**
 * A database error occurred
 */
export class DatabaseError extends Error {
	
	constructor(
		public code,
		public description,
		public url
	) {
		super(description)
	}
}



export class DatabaseRemoteAdapter extends DatabaseAdapter {
	
	
	dbProxy:any
	
	
	private stores:Stores
	
	/**
	 * Pending Request Map
	 *
	 * @type {{}}
	 */
	private pendingRequests:{[id:string]:IDatabasePendingRequest} = {}
	
	/**
	 * Underlying transport - probably IPC
	 */
	public transport: Transport
	
	
	constructor() {
		super()
		this.transport = getDefaultTransport({
			hostname: DatabaseServerName,
			raw:true
		} as any)
	}
	
	isRunning():boolean {
		return true
	}
	
	
	
	/**
	 * Close a plugin context - on remote - do nothing
	 * @param context
	 */
	closePluginDataContext(context:IPluginStoreContext):Promise<void> {
		return
	}
	
	/**
	 * Creates a plugin data store context
	 *
	 * @param name
	 * @param modelConfigs
	 * @returns {Promise<null>}
	 */
	async createPluginDataContext(name:string, ...modelConfigs):Promise<IPluginStoreContext> {
		const
			storeClazzes = modelConfigs.map(config => config.store),
			dataStores = {} as any,
			pluginContext = {
				name,
				internal: {
					coordinator:null,
					storePlugin:null
				},
				stores: dataStores
			} as IPluginStoreContext
		
		log.debug(`Remote adapter, so no init or start for ${name}`)
		
		try {
			storeClazzes.forEach((storeClazz:{new():TSRepo<any>}) => {
				const
					storeName = storeClazz.$$clazz || storeClazz.name
				
				const
					cleanStoreName = cleanupStoreName(storeName)
				
				log.debug(`Creating REMOTE proxy store (${cleanStoreName}) from ${storeName}`)
				dataStores[cleanStoreName] = this.getStore(cleanStoreName)
			})
		}	catch (err) {
			log.error(`Failed to start REMOTE plugin data context`,err)
			throw new err
		}
		return pluginContext
	}
	
	async start():Promise<any> {
		
		// Connect the transport if not the DB server
		//if (this.notRunningOnDatabaseServer) {
		await this.transport.connect()
		
		this.transport.on(DatabaseEvents.Response,this.onResponse)
		//}
		
		// Load all model classes
		log.info('Loading models and creating store')
		//loadModelClasses()
		
		this.stores = assign(new Stores(), {
			repo:          this.getStore('RepoStore'),
			issue:         this.getStore('IssueStore'),
			availableRepo: this.getStore('AvailableRepoStore'),
			milestone:     this.getStore('MilestoneStore'),
			comment:       this.getStore('CommentStore'),
			label:         this.getStore('LabelStore'),
			user:          this.getStore('UserStore'),
			issuesEvent:  this.getStore('IssuesEventStore'),
			repoEvent: this.getStore('RepoEventStore')
		})
		
		log.debug('Repos Loaded')
		
		// Direct proxy
		this.dbProxy = new Proxy({},new DatabaseProxy(this))
		
	}
	
	stop():Promise<any> {
		guard(() => this.removeListeners())
		guard(() => this.transport.disconnect())
		return Promise.resolve(true)
	}
	
	getStores():Stores {
		return this.stores
	}
	
	/**
	 * Get a repo instance for the local database
	 *
	 * @param repoClazz
	 * @returns {T}Í
	 */Í
	
	private getStore(repoName:string) {
		const
			store = new DatabaseProxy(this,repoName)
		return new Proxy({},{
			get(target,fn) {
				return store.get(store,fn)
			}
		}) as any
	}
	
	async execute(request:IDatabaseRequest):Promise<IDatabaseResponse> {
		const
			deferred = Promise.defer(),
			{id,fn,store,args} = request
			
		this.transport.waitForConnection()
			.then(() => {
				this.checkConnected()
				
				assert(fn && args,'Both args and fn MUST be defined')
				
				// Map the pending request
				this.pendingRequests[request.id] = {
					id:request.id,
					request,
					deferred
				}
				
				// Send the request
				this.transport.emit(DatabaseEvents.Request,request)
				
			})
		
		// Configure the promise timeout
		deferred.promise
			
			.timeout(TIMEOUT)
			
			// Catch and remap timeout error
			.catch(Promise.TimeoutError,this.onTimeout(request,deferred))
			
			// Finally clean up the request
			.finally(this.onRequestFinished(request))
		
		
		// Return the promise
		return deferred.promise
		
	}
	
	
	/**
	 * Check if running on database server
	 *
	 * @returns {boolean}
	 */
	get notRunningOnDatabaseServer() {
		return !ProcessConfig.isType(ProcessType.DatabaseServer)
	}
	
	/**
	 * On request finished
	 *
	 * @param request
	 * @returns {()=>void}
	 */
	private onRequestFinished(request:IDatabaseRequest):() => void {
		return () => {
			delete this.pendingRequests[request.id]
			//this.pendingRequests.delete(request.id)
		}
	}
	
	/**
	 * onResponse received from window,
	 * map it back to request and resolve
	 *
	 * @param resp
	 */
	private onResponse = (resp:IDatabaseResponse) => {
		log.debug('Response Received',resp.requestId)
		
		const
			pendingRequest = this.pendingRequests[resp.requestId]
		
		//const pendingRequest = this.pendingRequests.get(resp.requestId)
		if (!pendingRequest) {
			log.error(`Response received, but no request found with provided id: ${resp.requestId}`,resp.error)
			return
		}
		
		if (resp.error) {
			log.error(`Database query failed`, pendingRequest.request,resp.error)
			pendingRequest.deferred.reject(_.isError(resp.error) ? resp.error : new Error(resp.error as any))
		} else
			pendingRequest.deferred.resolve(resp.result)
		//pendingRequest.deferred.resolve(cloneObjectShallow(resp.result))
		
	}
	
	
	
	
	/**
	 * onTimeout Handler
	 *
	 * @param request
	 * @param deferred
	 * @returns {Promise.Resolver<any>}
	 */
	private onTimeout(request:IDatabaseRequest,deferred:Promise.Resolver<any>) {
		return (err:Promise.TimeoutError) => {
			log.error(`Database request timed out (${request.id})`,err)
			deferred.reject(new DatabaseError('TIMEOUT',err.toString(),''))
		}
	}
	
	
	/**
	 * Check if the IPC client is connected
	 *
	 * @throws if not connected
	 */
	private checkConnected() {
		assert(this.transport.connected,`Database Client is not connected`)
	}
	
	/**
	 * Remove all IPC listeners
	 */
	private removeListeners() {
		this.transport.removeListener(DatabaseEvents.Response,this.onResponse)
	}
}
