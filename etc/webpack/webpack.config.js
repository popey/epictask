require('../tools/global-env')

const ForkCheckerPlugin = require('awesome-typescript-loader').ForkCheckerPlugin
const webpack = require('webpack')
const assert = require('assert')
const path = require('path')
const nodeExternals = require('webpack-node-externals')

const
	baseDir = path.resolve(__dirname,'../..'),
	distDir = `${baseDir}/dist`

const {DefinePlugin,ExternalsPlugin,HotModuleReplacementPlugin} = webpack

// Import globals - just for linting
const {isDev,env} = global


module.exports = function (projectConfig) {
	const config = {

		context: baseDir,

		stats: WebpackStatsConfig,
		output: {
			path: `${distDir}/`,
			publicPath: `${distDir}/`,
			filename: '[name].js',
			libraryTarget: 'commonjs2'
		},

		recordsPath: `${distDir}/_records`,

		// Currently we need to add '.ts' to the resolve.extensions array.
		resolve: {
			alias: {
				assert: 'browser-assert',
				styles: path.resolve(baseDir,'src/epictask/assets/styles'),
				assets: path.resolve(baseDir,'src/epictask/assets'),
				components: path.resolve(baseDir,'src/epictask/app/components')
			},
			modules: [
				path.resolve(baseDir,'src'),
				path.resolve(baseDir,'node_modules'),
				path.resolve(baseDir,'../typedux','node_modules'),
				path.resolve(baseDir,'../typemutant','node_modules'),
				path.resolve(baseDir,'../typelogger','node_modules')
			],
			extensions: ['', '.ts', '.tsx', '.webpack.js', '.web.js', '.js'],
			packageMains: ['webpack', 'browser', 'web', 'browserify', ['jam', 'main'], 'main']

		},

		// Add the loader for .ts files.
		module: require('./parts/loaders')(projectConfig),

		plugins: [
			new webpack.IgnorePlugin(/vertx/),
			new webpack.optimize.OccurrenceOrderPlugin(),
			new webpack.NoErrorsPlugin(),
			new ForkCheckerPlugin(),
			new DefinePlugin({
				__DEV__: isDev,
				DEBUG: isDev,
				'process.env.NODE_ENV': JSON.stringify(env)
			})
		],
		node: {
			__dirname: true,
			__filename: true
		},

		externals:[
			nodeExternals({
				whitelist: [
					/webpack\/hot/,
					/webpack-hot/,
					/typemutant/,
					/typedux/,
					/typelogger/,
					/electron-oauth-github/,
					/browser-next-tick/,
					/urlsearchparams/
				]
			})
		]

	}

	// Development specific updates
	Object.assign(config,{

		//In development, use inline source maps
		devtool: isDev ? 'inline-source-map' : 'source-map',

		// In development specify absolute path - better
		// debugger support
		output: Object.assign({},config.output, isDev ? {
			devtoolModuleFilenameTemplate: "[absolute-resource-path]"
		} : {}),




		debug: isDev,
		dev: isDev
	})

	// In DEV environments make sure HMR is enabled
	if (isDev)
		config.plugins.splice(1,0,new HotModuleReplacementPlugin())


	return config

}
