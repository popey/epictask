
import {List} from 'immutable'
import {createDeepEqualSelector} from 'shared/util/SelectorUtil'
import {createSelector} from 'reselect'
import {AvailableRepo} from 'shared/models/AvailableRepo'


import {RepoState} from "shared/actions/repo/RepoState"
import {RepoKey} from "shared/Constants"
import { Milestone, Label, User } from "shared/models"

/**
 * Get the current repo state
 * @param state
 * @return {RepoState}
 */
export const repoStateSelector:(state) => RepoState = (state) => state.get(RepoKey)

/**
 * Get repo id from object
 *
 * @param o
 * @returns {number}
 */
function getRepoId(o:any):number {
	return !o ? null :
		_.isNumber(o) ? o :
			(_.isNumber(o.repoId)) ? o.repoId :
				parseInt(o.repoId,10)
}
export const repoIdPredicate = (o:any) => {
	const repoId = getRepoId(o)
	assert(repoId > 0, 'Must provided a repoId or object with repo id')

	return (item) => _.isNumber(item) ? item === repoId : item.repoId === repoId
}



// .set('availableRepoIds',availableRepos.map(it => it.id))
// 	.set('labels',availableRepos.map(it => it.id))
// 	.set('milestones',availableRepos.map(it => it.id))
// 	.set('assignees',availableRepos.map(it => it.id))
// 	.set('enabledRepoIds',enabledRepoIds)
// 	.set('enabledMilestones',milestones.filter(it => enabledRepoIds.includes(it.repoId)))
// 	.set('enabledLabels',labels.filter(it => enabledRepoIds.includes(it.repoId)))
// 	.set('enabledAssignees',assignees.filter(it => it.repoIds.some(repoId => enabledRepoIds.includes(repoId))))




/**
 * All available repos that have been added (excluding deleted)
 */
export const availableReposSelector =
	(state):List<AvailableRepo> => repoStateSelector(state).availableRepos

export const enabledAvailableReposSelector = createSelector(
	availableReposSelector,
	(availRepos:List<AvailableRepo>) => availRepos.filter(availRepo => availRepo.enabled) as List<AvailableRepo>
)


/**
 * All enabled milestones
 */
export const enabledMilestonesSelector = createSelector(
	enabledAvailableReposSelector,
	(availRepos:List<AvailableRepo>) => availRepos.reduce((allMilestones,availRepo) => {
		(availRepo.milestones || [])
			.filter(milestone => !allMilestones.find(it => it.id === milestone.id))
			.forEach(milestone => allMilestones = allMilestones.push(milestone))
		return allMilestones
	},List<Milestone>())
)


/**
 * All enabled labels
 */
export const enabledLabelsSelector = createSelector(
	enabledAvailableReposSelector,
	(availRepos:List<AvailableRepo>) => availRepos.reduce((allLabels,availRepo) => {
		(availRepo.labels || [])
			.filter(label => !allLabels.find(it => it.url === label.url))
			.forEach(label => allLabels = allLabels.push(label))
		return allLabels
	},List<Label>())
)


/**
 * All enabled milestones
 */
export const enabledAssigneesSelector = createSelector(
	enabledAvailableReposSelector,
	(availRepos:List<AvailableRepo>) => availRepos.reduce((allAssignees,availRepo) => {
		(availRepo.collaborators || [])
			.filter(assignee => !allAssignees.find(it => it.id === assignee.id))
			.forEach(assignee => allAssignees = allAssignees.push(assignee))
		return allAssignees
	},List<User>())
)

/**
 * Available repos - only ids
 */
export const availableRepoIdsSelector = createSelector(
	availableReposSelector,
	(availRepos:List<AvailableRepo>):List<number> => availRepos.map(availRepo => availRepo.id) as List<number>
)
	


/**
 * Only available repo ids
 */

export const enabledRepoIdsSelector = createSelector(
	enabledAvailableReposSelector,
	(availRepos:List<AvailableRepo>):List<number> => availRepos
		.map(availRepo => availRepo.id) as List<number>
)


/**
 * Repo Ids that are currently selected in the UI
 *
 * @param state
 */
export const selectedRepoIdsSelector = (state):number[] => (state)
	.map((availRepo:AvailableRepo) => availRepo.repoId)


/**
 * Number of available repos
 */
export const availableRepoCountSelector = createDeepEqualSelector(
	availableRepoIdsSelector,
	(availRepoIds:List<number>) => availRepoIds.size
)