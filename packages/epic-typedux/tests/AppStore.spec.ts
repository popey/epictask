import "epic-tests/TestSetup"
import { AuthState } from "epic-typedux/state/AuthState"
import { fromPlainObject } from "typetransform"
import { isNil, isMap } from "typeguard"


const
	log = getLogger(__filename)

log.setOverrideLevel(LogLevel.DEBUG)

test(`Everything is running`,() => {
	const
		authState = new AuthState({
			authenticated: true,
			authenticating: true
		})
	
	expect(authState.authenticated).toBe(true)
	
	const
		po = authState.toJS()
	
	
	
	expect(!isNil(po.$$value)).toBe(true)
	
	log.debug(po)
	expect(po.$$value.authenticated).toBe(true)
	
	const
		hydrated = fromPlainObject(po)
	
	expect(isMap(hydrated)).toBe(true)
	
	
	const
		newAuthState = AuthState.fromJS(hydrated)
	
	console.log(`hydrated`,hydrated,'new auth state',newAuthState,newAuthState.authenticated)
	expect(newAuthState instanceof AuthState).toBeTruthy()
	expect(newAuthState.authenticated).toBeTruthy()
	expect(newAuthState.authenticating).toBeFalsy()
})



export {
	
}