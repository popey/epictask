require('source-map-support').install()
require('babel-polyfill')
require('reflect-metadata')

// CHECK UPDATES
if(require('electron-squirrel-startup')) {
	try {
		require('electron').app.quit()
	} catch (err) {
		console.error(`Failed to quit`,err)
	}
	return
}

process.env.POUCH_MODULE_NAME = 'pouchdb-browser'

const
	noWebpack = ['true','1','on'].includes(process.env.NO_WEBPACK || '')


require('babel-runtime/core-js/promise').default = global.Promise = require('bluebird').default

if (noWebpack) {
	require('./epictask-polyfill-webpack')
} else {
	Object.assign(global,{
		__NO_WEBPACK__: false
	})
}


/**
 * APP SEARCH PATHS FOR ASAR
 */
const
	{env} = process,
	APP_SEARCH_PATHS = [
		'../dist/app',
		'../dist/app-package',
		'../app',
		'..',
		'.',
		'../../../app'
	]


let
	outBuf = '',
	resolvedAppPath = null,
	fs = require('fs'),
	path = require('path')

const logOut = (...args) => {
	outBuf += args.join(' // ') + '\n'
	console.log(...args)
}

for (let appPath of APP_SEARCH_PATHS) {
	try {
		appPath = require.resolve(`${appPath}/epic-entry-main`)
		
		if (fs.existsSync(appPath)) {
			resolvedAppPath = appPath
			logOut(`Found at ${resolvedAppPath}`)
			break
		}
	} catch (err) {
		logOut(`Failed to find at path ${appPath} ${err.message} ${err}`)
	}
}

const
	errInfo = `Starting ${__dirname}/${__filename}/
		${require('electron').app.getPath('exe')}/${process.cwd()}/${env.NODE_ENV}:\n${JSON.stringify(process.env,null,4)}
	
		${outBuf}
	`

if (resolvedAppPath) {
	const
		dir = path.dirname(resolvedAppPath)
	
	
	logOut(`Loading main`)
	// const
	// 	commonOut = require(path.resolve(dir,"epic_libs")),
	// 	mainOut =
	
	// LOAD THE DLL
	const
		epicMain = require(resolvedAppPath)
	// if (global.__NO_WEBPACK__ !== true) {
	//
	// 	const
	// 		commonModule = require(path.resolve(dir,'epic-common'))
	//
	// 	commonModule(mainModule)
	// 	// Object.assign(global, {
	// 	// 	epic_libs: require(path.resolve(dir,'epic-common'))
	// 	// })
	// }
	
	
	logOut(`Loading common`)
	
	
	
	
	
	
} else {
	try {
		
		//require('../epic-libs')
		require('../epic-entry-main')
	} catch (err) {
		try {
			require('fs').writeFileSync('/tmp/epicinfo', errInfo)
		} catch (err) {}
		console.error(errInfo)
		console.error(`NOTHING WORKED`,err)
		process.exit(0)
		
	}
	
}



//
