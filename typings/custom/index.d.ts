/// <reference path="./reflect-metadata/index.d.ts" />
/// <reference path="./material-ui/index.d.ts" />
/// <reference path="./webpack-env.d.ts" />
/// <reference path="./element-class.d.ts" />
/// <reference path="./lodash-mixins.d.ts" />

interface Window {
	devToolsExtension:any
}

declare namespace NodeJS {
	interface Global {
		MainBooted:boolean
	}
}

// declare global {
// 	import * as assertGlobal from 'assert'
// 	import * as ImmutableGlobal from 'immutable'
// 	import * as LodashGlobal from 'lodash'
//
// 	declare var
// }
