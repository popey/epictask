
const
	log = getLogger(__filename)

import {DefaultLeafReducer} from 'typedux'
import {RepoKey} from "epic-global/Constants"
import {RepoState,RepoMessage} from '../state/RepoState'

import {Provided} from  "epic-global/ProxyProvided"

@Provided
export class RepoReducer extends DefaultLeafReducer<RepoState,RepoMessage> {

	constructor() {
		super(RepoKey,RepoState)
	}


	/**
	 *
	 * @returns {RepoState}
	 */
	defaultState(o = {}):any {
		return RepoState.fromJS(o)
	}

}