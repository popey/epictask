const path = require('path')
const fs = require('fs')

const tsConfigBaseFile = () => `${baseDir}/tsconfig.json`

/**
 * Create base TypeScript Configuration
 */
export function makeTsConfigBase() {
	
	const
		// Load the base configuration
		baseConfig = require('../tsconfig.base.json'),
		
		// Tweaks
		templateConfig = {
			...baseConfig,
			
			// Set absolute baseUrl
			compilerOptions: {
				...baseConfig.compilerOptions,
				baseUrl: path.resolve(baseDir, 'src'),
				outDir: path.resolve(baseDir, 'dist/out')
			},
			
			// Map exclusions to include parents
			exclude: baseConfig.exclude.reduce((excludedPaths, excludePath) => {
				excludedPaths.push(excludePath, '../' + excludePath)
				return excludedPaths
			}, [])
		}
	
	// Write the updated config
	writeJSONFileSync(tsConfigBaseFile(), templateConfig)
	
	// Link the root config
	//const rootTsConfigFile = `${baseDir}/tsconfig.json`
	
	// if (fs.existsSync(rootTsConfigFile)) {
	//
	// 	fs.
	// }
	// try {
	// 	fs.unlinkSync(rootTsConfigFile)
	// } catch (err) {}
	// fs.symlinkSync(tsConfigBaseFile(), rootTsConfigFile)
}


/**
 * Create project configs for Awesome-TypeScript-Loader
 *
 * @param dest
 * @param typingMode
 * @param extraOpts
 * @returns {*}
 */
export function makeTsConfig(dest,...extraOpts) {
	
	// Load the default configuration
	const baseConfig = readJSONFileSync(tsConfigBaseFile())
	
	// Expand exclusions
	const config = {
		...baseConfig,
		
		exclude: baseConfig.exclude
			.map(excludePath =>
				_.startsWith(excludePath, '../') ? excludePath.substring(3) : excludePath
			)
	}
	
	// Merge additional config options
	const tsConfigJson = _.merge({}, config, ...extraOpts)
	
	// Write the config and return it
	writeJSONFileSync(dest, tsConfigJson)
	
	return dest
}
