/**
 * App Config Interface
 */
export interface AppConfig {
	paths: {
		userDataPath: string
		cachePath: string
		tempPath: string,
		pluginDefaultPath: string
	}
}

// Singleton Ref - app config only created once
let appConfig:AppConfig

/**
 * Get the current app config
 *
 * @returns {AppConfig}
 */
export function getAppConfig() {
	//const log = getLogger(__filename)
	
	if (ProcessConfig.isStorybook() || ProcessConfig.isType(ProcessType.Test)) {
		return {
			paths: {
				userDataPath: "/tmp",
				cachePath: "/tmp",
				tempPath: "/tmp",
				pluginDefaultPath: "/tmp/epic-plugins"
			}
		}
	}
	
	if (!appConfig) {
		try {
			require('electron')
		} catch (err) {
			console.error(`Failed to resolve electron`, err)
			throw err
		}
		
		
		const
			electron = require('electron'),
			app = electron.app || electron.remote.app,
			userDataPath = app.getPath('userData')
		
		appConfig = {
			paths: {
				userDataPath,
				cachePath: `${userDataPath}/Cache`,
				tempPath: app.getPath('temp'),
				pluginDefaultPath: `${userDataPath}/epictask-plugins/default`
			}
		}
		
	}
	return appConfig
}

// getAppConfig
export default getAppConfig