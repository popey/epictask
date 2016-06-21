//declare module 'lodash' {
// declare module _ {
// 	interface LoDashStatic {
// 		isArrayEqualBy(arr1,arr2,prop):boolean
// 	}
// }

// declare module _ {
// 	interface LoDashStatic {
// 		isArrayEqualBy(arr1,arr2,prop):boolean
// 	}
// }

declare global {
	interface LodashMixins {
		isArrayEqualBy(arr1,arr2,prop):boolean
	}
}

const _ = require('lodash')

/**
 * Mixin lo dash functions
 *
 * isArrayEqual
 */
_.mixin({
	isArrayEqualBy(arr1,arr2,prop) {
		return arr1 === arr2 ||  _.isEqual(
			!arr1 ? null : arr1.map(v => v[prop]).sort(),
			!arr2 ? null : arr2.map(v => v[prop]).sort()
		)
	}
})

export function isNil(o:any) {
	return _.isNil(o)
}

export function cloneObject<T>(o:T,...newSources:any[]):T {
	const cloned = _.cloneDeep(o)

	if (Array.isArray(cloned)) {
		cloned.forEach((acloned,index) => {
			acloned.id = o[index].id
			_.assign(acloned,...newSources)
		})
	} else {
		cloned.id = (o as any)['id']
		_.assign(cloned,...newSources)
	}

	return cloned

}