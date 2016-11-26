import { RegisterModel, reviveImmutable } from "epic-global"
import { Record, List, Map } from "immutable"
import { ActionMessage } from "typedux"
import { AvailableRepo } from "epic-models"
import { toPlainObject,excludeFilter,excludeFilterConfig } from "typetransform"

const
	log = getLogger(__filename)


/**
 * Repo State Record
 */
export const RepoStateRecord = Record({
	availableRepos:List<AvailableRepo>(),
	selectedRepoIds:[],
	reposLoading:Map<number,boolean>()
})

/**
 * Repository State
 */
@RegisterModel
export class RepoState extends RepoStateRecord {

	static fromJS(o:any) {
		return reviveImmutable(
			o,
			RepoState,
			[
				'availableRepos'
			],[
				'reposLoading'
			]
		)
	}
	
	toJS() {
		return toPlainObject(this,
			excludeFilterConfig(
				...excludeFilter('reposLoading','selectedRepoIds')
			))
	}
	
	
	selectedRepoIds:number[]
	availableRepos:List<AvailableRepo>
	reposLoading:Map<number,boolean>
}

/**
 * RepoMessage
 */
export interface RepoMessage extends ActionMessage<RepoState> {

}