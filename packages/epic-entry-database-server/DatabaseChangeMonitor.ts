
import { Stores } from "epic-database-client"
import { PouchDBRepo } from "typestore-plugin-pouchdb"
import { setDataOnHotDispose, getHot } from "epic-global/HotUtils"
import { getValue } from "epic-global/ObjectUtil"
import { DatabaseEvents } from "epic-database-client/DatabaseEvents"

const
	log = getLogger(__filename),
	changeSubscriptions = getHot(module,'changeSubscriptions',M<string,any>()),
	pendingChanges = []


let
	getIPCServer:() => IIPCServer,
	getPouchDB

setDataOnHotDispose(module,() => ({
	changeSubscriptions
}))

/**
 * Cancel any existing subscriptions for a model type
 *
 * @param modelType
 */
function cancelCurrentSubscription(modelType:string) {
	if (changeSubscriptions[modelType]) {
		log.debug(`Unsubscribing: ${modelType}`)
		try {
			changeSubscriptions[modelType].cancel()
		} catch (err) {
			log.error(`Failed to unsubscribe: ${modelType}`,err)
		}
		changeSubscriptions[modelType] = null
	}
}

/**
 * Broadcast pending changes to all clients
 */
const broadcast = _.throttle(() => {
	try {
		const
			ipcServer = getIPCServer()
		
		if (!ipcServer) {
			return log.warn(`IPC server is not available yet`)
		}
		ipcServer.broadcast(DatabaseEvents.Change, [...pendingChanges])
		
		// CLEAR THE LIST IF IT SUCCEEDED
		pendingChanges.length = 0
	} catch (err) {
		log.error(`Failed to broadcast db changes`,err)
	}
},2000)

/**
 * Add a pending change to the queue and trigger
 * the throttled distribution
 *
 * @param change
 */
function pushChange(change:IDatabaseChange) {
	pendingChanges.push(change)
	broadcast()
}

/**
 * Subscribe to the changes feed in pouchdb
 */
export function watchChanges(
	ipcServerProvider: () => IIPCServer,
	stores:Stores,
	inGetPouchDB:Function
) {
	
	getIPCServer = ipcServerProvider
	getPouchDB = inGetPouchDB
	Object
		.values(stores)
		.filter(store => store instanceof PouchDBRepo && getPouchDB(store))
		.forEach((store:PouchDBRepo<any>) => {
			
			const
				modelType = store.modelType.name
			
			cancelCurrentSubscription(modelType)
			
			log.debug(`Subscribing ${modelType}`)
			
			const
				db = store.getPouchDB(),
				changes = changeSubscriptions[modelType] = db.changes({
					live: true,
					since: 'now',
					include_docs: true
				})
			
			/**
			 * On change queue batch updates for broadcast
			 */
			changes.on('change',(info) => {
				log.debug(`Change received for type: ${modelType}`,info)
				try {
					const
						doc = info.doc || {},
						model = doc && doc.type === modelType && store.getModelFromObject(doc),
						change:IDatabaseChange = doc && {
								id: info.id,
								rev: getValue(() => info.doc._rev),
								deleted: getValue(() => info.doc._deleted,false),
								doc,
								clazz: store.modelClazz as any,
								type: modelType,
								model
							}
					
					if (!model) {
						log.debug(`No model on update`,info)
						return
					}
					
					log.debug(`Broadcasting change`,change)
					
					pushChange(change)
					
				} catch (err) {
					log.error(`Failed to broadcast changes`,info,err)
				}
			})
			
			changes.on('error',err => {
				log.error(`An error occurred while listening for changes to ${modelType}`,err)
			})
			
		})
}
