
import {ServiceManager} from "./internal/ServiceManager"

export * from './internal/Types'
export * from './internal/ServiceDecorations'
export * from './internal/ServiceManager'
export * from './internal/BaseService'

export * from './DatabaseClientService'
export * from './UIStateService'
export * from './AppStateService'

const
	log = getLogger(__filename),
	serviceManager = ServiceManager.getInstance()
	
 

if (module.hot) {
	
	const oldServiceManager = _.get(module.hot,'data.serviceManager') as ServiceManager
	
	/**
	 * Reload the service manager on HMR
	 */
	async function reload() {
		log.info(`Stopping old service manager first`)
		await oldServiceManager.stop()
		
		log.info('Starting new service manager')
		
		await serviceManager.start()
	}

	// Reload the manager if it was running before and it's no identical to the new one
	if (oldServiceManager && oldServiceManager !== serviceManager && oldServiceManager.running) {
		reload()
	}
	
	module.hot.dispose((data:any) => {
		data.serviceManager = serviceManager
	})
	module.hot.accept()
}