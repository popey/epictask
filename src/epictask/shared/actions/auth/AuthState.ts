/**
 * Authentication State Holder
 */
import {
	RecordModel,
	RecordProperty,
	makeRecord
} from 'typemutant'

import Settings from '../../../shared/Settings'
import * as Constants from '../../../shared/Constants'

export interface IAuthState {
	authenticated?:boolean
	username?:string
	email?:string
	token?:string
	authenticating?:boolean
	error?:Error
}

@RecordModel()
class AuthStateModel {

	@RecordProperty()
	authenticating:boolean

	@RecordProperty()
	error:Error

	@RecordProperty()
	authenticated:boolean

	@RecordProperty()
	username:string

	@RecordProperty()
	email:string

	@RecordProperty()
	token:string

	/**
	 * Set authentication token
	 *
	 * @param token
	 * @returns {AuthStateModel}
	 */
	setToken(token:string) {
		this.token = Settings.token = token
		this.authenticating = false
		this.authenticated = !_.isNil(token)
		this.error = null
		return this
	}


	/**
	 * Set authenticating
	 *
	 * @param authenticating
	 * @returns {AuthStateModel}
	 */
	setAuthenticating(authenticating:boolean) {
		this.authenticating = authenticating
		return this
	}

	setError(err:Error) {
		this.error = err
		return this
	}
	
	

}



const AuthStateDefaults = {
	token: Settings.token
}

export const AuthState = makeRecord(AuthStateModel,AuthStateDefaults)
export type TAuthState = typeof AuthState