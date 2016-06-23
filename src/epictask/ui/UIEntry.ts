// require('shared/SourceMapSupport')
import 'reflect-metadata'

// Load all global/env stuff first
// LOGGING CONFIG FIRST
require('shared/LogConfig')

require('./UILogging')
require('./UIGlobals')




async function boot() {

	const {createStore} = require('shared/store')

	await createStore()

	// Load logger
	const log = getLogger(__filename)

	// Load Styles
	require('shared/themes/styles')

	// Now the theme manager
	require("shared/themes/ThemeManager")

	log.info('Loading app root')
	const loadAppRoot = () => require('ui/components/root/AppRoot.tsx')
	loadAppRoot()

	if (module.hot) {
		module.hot.accept(['ui/components/root/AppRoot.tsx'], (updates) => {
			log.info('HMR Updates, reloading app content',updates)
			loadAppRoot()
		})

		module.hot.accept()
		module.hot.dispose(() => {
			log.info('HMR AppEntry Update')
		})
	}
}


boot().then(() => console.log('Booted App'))