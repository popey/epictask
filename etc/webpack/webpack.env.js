const
	{
		env,
		isDev,
		baseDir
	} = global,
	Path = require('path'),
	Fs = require('fs'),
	pkgJson = JSON.parse(Fs.readFileSync(Path.resolve(baseDir, 'package.json'), 'utf-8'))

module.exports = {
	__DEV__: isDev,
	DEBUG: isDev,
	TEST: false,
	VERSION: JSON.stringify(pkgJson.version),
	LOCAL_CONFIG: Fs.readFileSync(Path.resolve(baseDir, 'epictask-local.json'), 'utf-8'),
	'Env.isDev': isDev,
	'process.env.__DEV__': isDev,
	'process.env.NODE_ENV': JSON.stringify(env),
	'process.env.BASEDIR': baseDir,
	'process.env.DefaultTransportScheme': JSON.stringify('IPC'),
	'ProcessConfig.isStorybook()': false,
	'Env.isElectron': true
}