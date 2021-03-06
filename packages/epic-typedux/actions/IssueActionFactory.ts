import { FinderRequest } from "typestore"
import { ActionFactory, ActionThunk, ActionReducer } from "typedux"
import { List } from "immutable"
import { Stores, getStores } from "epic-database-client"
import {
	FinderItemsPerPage,
	IssueKey,
	isNil,
	isNumber,
	cloneObject,
	extractError,
	cloneObjectShallow,
	shallowEquals,
	notifyError,
	notify,
	getSettings,
	Provided,
	isListType
} from "epic-global"
import {
	Comment,
	Issue,
	IssueStore,
	Label,
	Milestone,
	Repo,
	AvailableRepo,
	CommentStore,
	IssuesEventStore,
	IssuesEvent
} from "epic-models"

import { availableReposSelector } from "../selectors"

import {
	getRepoActions,
	getUIActions
} from '../provider'
import { GitHubClient } from "epic-github"
import { getDatabaseClient } from "epic-database-client"
import { getValue, toNumber, isDefined } from "typeguard"
import { nilFilter, pagedFinder } from "epic-util"


/**
 * Created by jglanz on 5/29/16.
 */

const
	log = getLogger(__filename)


function getPages() {
	return RouteRegistryScope.asMap() as any
}


/**
 * User has permission to edit issue
 *
 * @param issue
 * @returns {boolean}
 */
export function hasEditPermission(issue:Issue) {
	const { repo } = issue
	
	assert(repo, 'can not test permission without repo set on issue')
	
	return (!issue.user || issue.user.id === getSettings().user.id || repo.permissions.push)
}


/**
 * Issue data update shape
 *
 */

export interface IIssueDataUpdate {
	issueIds?:number[]
	commentIds?:number[]
	labelUrls?:string[]
	milestoneIds?:number[]
}


declare global {
	interface IIssueActionFactory extends IssueActionFactory {}
}


/**
 * RepoActionFactory.ts
 *
 * @class RepoActionFactory.ts
 * @constructor
 **/
@Scopes.Services.Register
@Provided
export class IssueActionFactory {
	
	static readonly ServiceName = "IssueActions"
	
	constructor() {
	}
	
	async queryIssues(criteria:IIssueCriteria, overrideRepoIds:List<number> = null):Promise<List<Issue>> {
		
		const
			issueSort = criteria.sort,
			availRepos = availableReposSelector(getStoreState()),
			repoIds = availRepos
				.map(it => it.id)
				.sort()
		
		
		let
			queryOpts:any = {
				reduce: true,
				keys: (overrideRepoIds ?
						overrideRepoIds : // IF ONLY-FOCUSED THEN ALL
						repoIds // OTHERWISE ONLY ENABLED
				).map(it => [ it ]).toArray(), // MAP TO ARRAY OF ARRAYS
				reverse: issueSort.direction === 'desc'
			}
		
		if (issueSort.groupBy !== 'none') {
			assign(queryOpts, {
				group: true,
				group_level: 1
			})
		}
		
		let
			viewName:string = "withSortFields"
		
		const
			viewPath = `issues/${viewName}`,
			dbClient = getDatabaseClient(),
			dbAdapter = dbClient.getAdapter(),
			stores = getStores(),
			results:any = await dbAdapter.direct(stores.issue, 'query', viewPath, queryOpts)
		
		log.debug(`Got raw issues`, results)
		
		
		let
			values = getValue(() => results.rows
				.filter(it => Array.isArray(it.value) && Array.isArray(it.value[ 0 ]))
				.map(it => it.value && it.value[ 0 ]), [])
		
		const
			availableRepos = availableReposSelector(getStoreState()),
			matchUser = (repo:AvailableRepo, userId) => repo.collaborators.find(it => it.id === toNumber(userId)),
			issues = values
				.map(value => {
					const
						[
							_id,
							id,
							repoId,
							issueNumber,
							title,
							state,
							labelsStr,
							milestoneId,
							milestoneTitle,
							userId,
							userLogin,
							assigneeId,
							assigneeLogin,
							created_at,
							updated_at,
							focused
						] = value
					
					// IF FOCUSED ONLY CRITERIA THEN DUMP THE REST
					if (criteria.onlyFocused && !focused)
						return null
					
					const
						repo = availableRepos.find(it => it.id === repoId)
					
					
					return new Issue({
						id,
						repoId,
						'number': issueNumber,
						repo: repo.repo,
						labels: !labelsStr ? [] : labelsStr
								.split(',')
								.filter(it => it && it.length > 0)
								.map(it => repo && repo.labels.find(label => label.id === toNumber(it))),
						title,
						state,
						milestone: milestoneId && repo.milestones.find(it => it.id === toNumber(milestoneId)),
						user: userId && matchUser(repo, userId),
						assignee: assigneeId && matchUser(repo, assigneeId),
						created_at,
						updated_at,
						focused,
						$$doc: {
							_id
						}
					})
				})
				.filter(issue => isDefined(issue))
		
		log.debug(`Mapped raw issues`, issues)
		return List<Issue>(issues)
		
		
	}
	
	/**
	 * Open a new issue window
	 */
	newIssueWindow() {
		getUIActions().openWindow(getRoutes().IssueEditDialog.makeURI())
	}
	
	/**
	 * Load all issues
	 *
	 * @returns {(dispatch:any, getState:any)=>Promise<undefined>}
	 */
	// @ActionThunk()
	// loadIssues() {
	// 	return async (dispatch,getState) => {
	// 		const
	// 			enabledRepos = enabledAvailableReposSelector(getState())
	//
	// 		let
	// 			issues
	//
	// 		if (!enabledRepos || enabledRepos.size === 0) {
	// 			log.debug(`No enabled repos found, can not load issues`)
	// 			issues = List<Issue>()
	// 		} else {
	// 			log.info(`Updating repos`,enabledRepos)
	// 			// GET ISSUES PUSHES THEM A PAGE AT A TIME UNLESS ITS AN UPDATE
	// 			// @see reloadIssues
	// 			await this.getIssues(enabledRepos.toArray())
	// 		}
	//
	// 		const
	// 			selectedIssueIds = selectedIssueIdsSelector(getState())
	//
	// 		// IFF SELECTED ISSUE THEN LOAD ACTIVITY
	// 		if (selectedIssueIds && selectedIssueIds.length === 1) {
	// 			this.loadActivityForIssue(selectedIssueIds[0])
	// 		}
	//
	//
	// 	}
	// }
	//
	// async getIssueIds(issueFilter:IIssueFilter,issueSort:IIssueSort) {
	// 	const
	// 		availRepos = enabledAvailableReposSelector(getStoreState()),
	// 		enabledRepoIds = availRepos.map(it => `${it.id}`).sort()
	//
	// 	let
	// 		queryOpts:any = {
	// 			keys: enabledRepoIds
	// 		}
	//
	// 	if (issueSort.groupBy !== 'none') {
	// 		assign(queryOpts,{
	// 			reduce: true,
	// 			group: true,
	// 			group_level: 1
	// 		})
	// 	}
	//
	
	//
	// }
	
	/**
	 * Refill all the issues for a given repo based on resource changes
	 *
	 * @param issues
	 * @param availRepo
	 * @param field (only for a specific field)
	 */
	refillResourcesForRepo(issues:List<Issue>, availRepo:AvailableRepo, field:'both'|'milestone'|'labels') {
		
		let
			changes = List<Issue>()
		
		issues
			.filter(issue => issue.repoId === availRepo.id)
			.forEach(issue => {
				if ([ 'milestone', 'both' ].includes(field)) {
					if (issue.milestone) {
						const
							milestone = availRepo.milestones.find(it => it.id === issue.milestone.id)
						
						if (milestone && shallowEquals(milestone, issue.milestone, 'state', 'title', 'description', 'due_on"'))
							return
						
						const
							change = cloneObjectShallow(issue)
						
						change.milestone = milestone
						changes = changes.push(change) as List<Issue>
					}
				}
				
				if ([ 'labels', 'both' ].includes(field)) {
					if (issue.labels && issue.labels.length) {
						let
							changed = false
						
						for (let label of issue.labels) {
							const
								newLabel = availRepo.labels.find(it => it.url === label.url)
							
							if (!newLabel || !shallowEquals(label, newLabel, 'color', 'name')) {
								changed = true
								break
							}
						}
						
						if (changed) {
							const
								change = cloneObjectShallow(issue)
							
							change.labels = nilFilter(
								change.labels.map(label =>
									availRepo
										.labels
										.find(it => label.url === it.url))
							)
							
							changes = changes.push(change) as List<Issue>
						}
					}
				}
			})
		
		return changes
		
	}
	
	/**
	 * Fill issues
	 *
	 * @param partialIssues
	 * @param availRepos
	 * @returns {List<Issue>}
	 */
	fillIssueResources(partialIssues, ...availRepos:AvailableRepo[]) {
		if (!availRepos.length)
			availRepos = availableReposSelector(getStoreState()).toArray()
		
		const
			filledIssues = partialIssues
				.filter(issue => {
					const
						hasRepoId = issue && !!issue.repoId
					
					if (!hasRepoId) {
						log.warn(`Issue does not have repoId`, issue)
					}
					
					return hasRepoId
				})
				.map(issue => {
					const
						availRepo = (availRepos as AvailableRepo[])
							.find(availRepo => availRepo.repoId === issue.repoId),
						repo = availRepo.repo
					
					
					return cloneObjectShallow(issue, {
						repo,
						collaborators: availRepo.collaborators,
						
						// Find labels
						labels: !issue.labels ? [] :
							nilFilter(issue.labels.map(label =>
								availRepo.labels.find(it => it.url === label.url)
							)),
						
						// Find milestones
						milestone: (
							issue.milestone &&
							getValue(
								() => availRepo.milestones.find(it => it.id === issue.milestone.id),
								issue.milestone
							)
						)
					})
				})
		return List.isList(filledIssues) ? filledIssues : List<Issue>(filledIssues)
	}
	
	/**
	 * Load multiple issues
	 *
	 * @param issueKeys
	 * @returns {List<Issue>|List<any>|any}
	 */
	async loadIssues(issueKeys:List<string>):Promise<List<Issue>> {
		let
			issues = await getStores().issue.bulkGet(...issueKeys.toArray()),
			results = this.fillIssueResources(issues)
		
		return List<Issue>(results)
	}
	
	/**
	 * Load a single issue
	 * @param issueKey
	 *
	 * @returns {Issue}
	 */
	async loadIssue(issueKey:string):Promise<Issue> {
		let
			issues = await this.loadIssues(List([ issueKey ]))
		
		return issues.size && issues.get(0)
	}
	
	/**
	 * Get issues for a set of available repos
	 *
	 * @param availRepos
	 * @param fromIssues
	 * @returns {Promise<Issue[]>}
	 */
	
	async getIssues(availRepos:List<AvailableRepo>|AvailableRepo[], fromIssues:Issue[] = null):Promise<List<Issue>> {
		
		if (isListType(availRepos, AvailableRepo))
			availRepos = availRepos.toArray()
		
		
		// REPOS TO USE FOR VALUES
		availRepos = (nilFilter(availRepos) as AvailableRepo[])
		
		/**
		 * Update issue load status
		 *
		 * @param newLoadStatus
		 */
		const updateIssuesLoadStatus = async(newLoadStatus:LoadStatus) => {
			availRepos = availableReposSelector(getStoreState())
				.filter(it => (availRepos as any).find(availRepo => availRepo.id === it.id)) as any
			
			
			// getRepoActions().patchAvailableRepos({issuesLoadStatus: newLoadStatus},availRepos)
			// await Promise.delay(10)
		}
		
		
		let
			issues = List<Issue>(),
			loadingFromRepos = false
		
		// IF SOURCE ISSUES ARE PASSED THEN WE DO NOT NEED TO LOAD
		if (fromIssues && fromIssues.length) {
			issues = issues.push(...fromIssues)
			issues = this.fillIssueResources(issues, ...availRepos)
		}
		// OTHERWISE ONLY LOAD ISSUES SPECIFICALLY FOR UNLOADED REPOS
		else {
			// FILTER OUT ANY LOADED REPOS
			availRepos = availRepos
				.filter(it => !it.issuesLoadStatus || it.issuesLoadStatus < LoadStatus.Loading)
			
			// UPDATE LOADING STATUS
			updateIssuesLoadStatus(LoadStatus.Loading)
			
			// NOW GET EVERYTHING
			await Promise.all(
				availRepos
					.map(async(availRepo) => {
						
						const
							repoIssues:List<Issue> = await pagedFinder(
								Issue,
								FinderItemsPerPage,
								getStores().issue,
								(issueStore:IssueStore, nextRequest:FinderRequest, lastIssues:Issue[]) => {
									
									return issueStore.findByIssuePrefix(nextRequest, availRepo.repoId)
								}
							)
						
						
						issues = issues.concat(repoIssues) as List<Issue>
					}))
		}
		
		return issues
		
	}
	
	
	/**
	 * Start editing an i
	 * @param fromIssue
	 */
	createIssueInline(fromIssue:Issue) {
		return this.newIssue(fromIssue)
	}
	
	/**
	 * Update issues label
	 */
	patchIssuesLabel(issues:List<Issue>) {
		return this.patchIssues('Label', issues)
	}
	
	
	/**
	 * Update issues milestone
	 */
	patchIssuesMilestone(issues:List<Issue>) {
		return this.patchIssues('Milestone', issues)
	}
	
	/**
	 * Update issues assignee
	 */
	patchIssuesAssignee(issues:List<Issue>) {
		return this.patchIssues('Assignee', issues)
	}
	
	/**
	 * Open issue patch dialog
	 *
	 * @param mode
	 * @param issues
	 */
	async patchIssues(mode:TIssuePatchMode, issues:List<Issue>) {
		
		if (!issues.size) {
			log.warn('Must have at least 1 issue selected to open patch editor', issues)
			return
		}
		
		getUIActions().openWindow(getPages().IssuePatchDialog.makeURI(mode, issues))
	}
	
	/**
	 * Apply patches to issues
	 *
	 * @param patch
	 * @param issues
	 * @returns {(dispatch:any, getState:any)=>Promise<undefined>}
	 * @param useAssign
	 */
	
	async applyPatchToIssues(patch:any, useAssign:boolean, issues:List<Issue>) {
		
		
		if (!issues.size)
			return
		
		
		const
			originalIssues = issues,
			stores = getStores(),
			client = Container.get(GitHubClient)
		
		try {
			
			// Filter out issues that the milestone/assignee does not have access to
			if (patch.hasOwnProperty('milestone') && patch.milestone) {
				issues = issues.filter(issue => issue.repoId === patch.milestone.repoId) as any
			} else if (patch.hasOwnProperty('assignee') && patch.assignee) {
				issues = issues.filter(issue => patch.assignee.repoIds && patch.assignee.repoIds.includes(issue.repoId)) as any
			}
			
			let
				updatedIssues = List<Issue>()
			// Now apply the patch to clones
			issues.forEach(issue => {
				
				issue = cloneObjectShallow(issue)
				
				const
					patchCopy = cloneObjectShallow(patch)
				
				Object.entries(patch).forEach(([ key, val ]) => {
					log.debug(`Patching key ${key}`, patch[ key ])
					
					switch (key) {
						case 'labels':
							patchCopy.labels = _.nilFilter(patchCopy.labels)
							
							if (!patchCopy.labels || !patchCopy.labels.length) {
								issue.labels = []
								break
							}
							
							const
								addLabels = patchCopy.labels
									.filter(({ action }:IIssuePatchLabel) => action === 'add')
									.map(({ label }:IIssuePatchLabel) => label),
								
								removeLabelUrls = patchCopy.labels
									.filter(({ action }:IIssuePatchLabel) => action === 'remove')
									.map(({ label }:IIssuePatchLabel) => label.id)
							
							
							// Add new labels and filter out old ones
							issue.labels = _.uniqBy((issue.labels || [])
								.concat(addLabels
									.filter(label => label && label.repoId === issue.repoId)
								)
								, 'url'
							).filter(label => label && !removeLabelUrls.includes(label.id))
							
							log.debug(`Patching labels, adding`, addLabels, `Removing urls`, removeLabelUrls, 'updated issue', issue)
							break
						case 'milestone':
							issue.milestone = patchCopy.milestone
							break
						case 'assignee':
							issue.assignee = patchCopy.assignee
							break
					}
				})
				
				updatedIssues = updatedIssues.push(issue)
				
				if (!issue.id)
					throw new Error('issue id CANNOT be null')
				
			})
			
			// const issueStore:IssueStore = this.stores.issue
			// One by one update the issues on GitHub
			await Promise.all(updatedIssues.map(async(issue:Issue, index) => {
				const
					repo = issue.repo || await stores.repo.get(issue.repoId)
				
				assert(repo, `Unable to find repo for issue patching: ${issue.repoId}`)
				
				await this.saveAndUpdateIssueModel(client, repo, issue)
			}).toArray())
			
			getNotificationCenter().notifyInfo(
				`${updatedIssues.map(it => `#${it.number}`).join(', ')} Updated Successfully`)
			
		} catch (err) {
			log.error('issue patching failed', err, patch, issues, originalIssues)
			getNotificationCenter().notifyError(err)
			throw err
		}
		
	}
	
	/**
	 * Persist issue to github
	 *
	 * @param client
	 * @param repo
	 * @param issue
	 * @returns {Issue}
	 */
	private async saveAndUpdateIssueModel(client:GitHubClient, repo:Repo, issue:Issue) {
		
		const
			hasNullMilestone = !issue.milestone && issue.hasOwnProperty('milestone'),
			hasNullAssignee = !issue.assignee && issue.hasOwnProperty('assignee')
		
		issue = cloneObjectShallow(issue)
		
		const
			issueStore:IssueStore = getStores().issue
		
		// Because our object could be
		// behind the persistent rev,
		// lets update it first
		// TODO: HACKISH - investigate
		
		const
			existingIssue = await issueStore.get(Issue.makeIssueId(issue))
		
		if (existingIssue)
			issue = cloneObjectShallow(existingIssue, issue)
		
		if (hasNullAssignee) {
			issue.assignee = null
		}
		
		if (hasNullMilestone) {
			issue.milestone = null
		}
		
		
		// First save to github
		const
			savedIssue:Issue = await client.issueSave(repo, issue),
			mergedIssue = cloneObjectShallow(issue, savedIssue)
		
		
		log.debug(`Issue save, our version`, issue, 'github version', savedIssue, 'merged version', mergedIssue)
		
		await issueStore.save(mergedIssue)
		
		const
			loadedIssue = await issueStore.get(Issue.makeIssueId(mergedIssue))
		
		// SYNC ISSUE EVENTS
		//getGithubEventMonitor().forcePolling(repo.id)
		//RepoSyncManager.get(repo).syncIssues(getStores(),repo)
		
		log.debug(`Updating issue in state`, loadedIssue)
		return loadedIssue
		
	}
	
	
	/**
	 * Save issues and update it in GitHub
	 *
	 * @param issues
	 * @param skipGithub - when updating local attributes, skip github
	 */
	async saveIssues(issues:List<Issue>, skipGithub = false) {
		const
			client = Container.get(GitHubClient),
			stores = getStores()
		
		if (skipGithub) {
			return List(await stores.issue.bulkSave(...issues.toArray()))
		}
		
		const
			promises:Promise<Issue>[] = issues.map(issue => {
				let
					
					repo = issue.repo,
					persist = () => this.saveAndUpdateIssueModel(client, repo, issue)
				
				
				return repo ?
					persist() :
					stores.repo.get(issue.repoId).then(it => {
						repo = it
						return persist()
					})
				
			}).toArray(),
			
			results = await Promise.all(promises)
		
		return List<Issue>(results)
	}
	
	/**
	 * Save an issue and update it in GitHub
	 *
	 * @param issue
	 * @param skipGithub - when updating local attributes, skip github
	 */
	
	async saveIssue(issue:Issue, skipGithub = false) {
		const
			results = await this.saveIssues(List<Issue>([ issue ]), skipGithub)
		
		return results.get(0)
	}
	
	
	/**
	 * Save an issue and update it in GitHub
	 *
	 * @param comment
	 */
	
	
	async deleteComment(comment:Comment) {
		
		assert(comment.issueNumber && comment.repoId, 'Comment issue number and repo id MUST be set')
		
		const
			client = Container.get(GitHubClient),
			stores = getStores(),
			repo = await stores.repo.get(comment.repoId),
			commentStore = getStores().comment
		
		try {
			await client.commentDelete(repo, comment)
		} catch (err) {
			if (_.get(err, 'statusCode') !== 404)
				throw err
			
			log.warn(`Issue was already removed from GitHub`)
		}
		
		// PERSIST
		await commentStore.remove(Comment.makeCommentId(comment))
		
		
	}
	
	/**
	 * Update / create the comment in GitHub, persist and update state
	 *
	 * @param issue
	 * @param comment
	 */
	async saveComment(issue:Issue, comment:Comment) {
		
		comment = cloneObject(comment)
		
		const
			client = Container.get(GitHubClient),
			stores = getStores()
		
		
		assert(issue, `Unable to find issue with repoId = ${comment.repoId} and issueNumber ${comment.issueNumber}`)
		
		const
			availRepo = availableReposSelector(getStoreState())
				.find(it => it.repoId === issue.repoId),
			
			repo = availRepo && availRepo.repo
		
		
		log.debug(`Got repo`, repo, `for issue`, issue, `for comment`, comment)
		assert(repo, `Unable to get repo from repoId on issue: ${issue.repoId}`)
		
		
		const
			commentStore = getStores().comment,
			ghComment = await client.commentSave(repo, issue, comment)
		
		// Assign all the updated from github to the comment
		assign(comment, ghComment, {
			issueNumber: issue.number,
			repoId: repo.id,
			parentRefId: Comment.makeParentRefId(repo.id, issue.number)
		})
		
		const
			commentId = Comment.makeCommentId(comment),
			existingComment = comment.id && (await commentStore.get(commentId))
		
		if (existingComment)
			comment = cloneObjectShallow(existingComment, comment)
		
		// Persist
		await commentStore.save(comment)
		
		// Reload to make sure we're good
		comment = await commentStore.get(commentId)
		
		assert(comment, `Persist was successful, but query for ${commentId} failed - ???`)
		
		
		return comment
		
		
	}
	
	
	/**
	 * Create a new issue
	 *
	 * @returns {(dispatch:any, getState:any)=>Promise<undefined>}
	 */
	
	async newIssue(fromIssue:Issue = null) {
		
		const
			uiActions = getUIActions(),
			{ issue:issueStore } = getStores()
		
		// If no from issue was provided then use the selected
		// issue if available - otherwise totally empty
		
		
		const
			issue = assign(
				new Issue(),
				fromIssue && cloneObject(
					_.pick(fromIssue, 'milestone', 'labels', 'assignee', 'repoId')
				)
			)
		
		
	}
	
	newIssueDialog() {
		getUIActions().openWindow(getPages().IssueEditDialog.makeURI())
	}
	
	
	/**
	 * Start editing an issue
	 *
	 * @returns {(dispatch:any, getState:any)=>Promise<undefined>}
	 */
	editIssue(issue:Issue = null) {
		const
			uiActions = getUIActions()
		
		assert(issue, 'You must have an issue selected in order to edit one ;)')
		
		// TODO: fix issue fill
		const
			editingIssue = cloneObject(issue)
		
		uiActions.openWindow(getPages().IssueEditDialog.makeURI(editingIssue))
	}
	
	/**
	 * Start editing a comment
	 *
	 * @param issue - required, used as the base for 'new comments'
	 * @param comment - if editing, the comment to edit
	 */
	editComment(issue:Issue, comment:Comment = null) {
		const
			uiActions = getUIActions()
		
		assert(issue, 'You must provide an issue to edit/create a comment ;)')
		
		// Get repo ref for creating parent ref id
		const { repo } = issue
		
		if (!comment)
			comment = Object.assign(new Comment(), {
				issueNumber: issue.number,
				parentRefId: Comment.makeParentRefId(repo.id, issue.number),
				repoId: repo.id,
				body: ''
			})
		
		uiActions.openWindow(getPages().CommentEditDialog.makeURI(issue, comment))
	}
	
	
	
	/**
	 * Open issue viewer for a specific issue
	 *
	 * @param issue
	 */
	async openIssueViewer(issue:Issue) {
		
		issue.repo = issue.repo || (issue.repoId && await getStores().repo.get(issue.repoId))
		
		const
			{repo} = issue,
			availRepo = repo && await getStores().availableRepo.get(issue.repo.id),
			showLocalView = () => {
				const
					uri = (<any>RouteRegistryScope.asMap()).IssueViewDialog.makeURI(issue)
				
				getUIActions().openWindow(uri)
			}
		
		if (availRepo) {
			showLocalView()
		} else {
			const
				electron = require('electron'),
				{remote} = electron,
				{dialog,shell} = remote || electron
			
			dialog.showMessageBox(remote && remote.getCurrentWindow(),{
				type: "question",
				buttons: ["View on Github","Import Repo", "Cancel"],
				title: `View ${issue.title}`,
				message: `The repo ${getValue(() => repo.full_name,'unknown')} has not been imported, would you like to import it or view the issue on Github`
				
			},(index) => {
				log.debug(`selected index: ${index}`)
				switch(index) {
					case 0:
						//VIEW ON GITHUB
						const
							url = `https://github.com/${repo.full_name}/issues/${issue.number}`
						
						log.debug(`Opening URL: ${url}`)
						shell.openExternal(url)
						break
					case 1:
						//IMPORT
						getRepoActions().createAvailableRepo(repo.full_name)
						
						break
					case 2:
						//CANCEL
						break
				}
			})
		}
		
		
		
		
	}
	
	//
	//
	//
	// /**
	//  * Update a list of issues in the current state
	//  *
	//  * @param updatedIssues
	//  * @returns {(state:IssueState)=>Map<K, V>}
	//  */
	// @ActionReducer()
	// private updateIssuesInState(updatedIssues:List<Issue>) {
	// 	return (state:IssueState) => state.withMutations((newState:IssueState) => {
	// 		let
	// 			{issues} = newState
	//
	// 		updatedIssues.forEach(updatedIssue => {
	// 			const
	// 				issueIndex = issues.findIndex(issue => issue.id === updatedIssue.id)
	//
	// 			issues = (issueIndex > -1) ?
	// 				issues.set(issueIndex,updatedIssue) :
	// 				issues.push(updatedIssue)
	// 		})
	//
	// 		return newState.set('issues',issues)
	// 	})
	// }
	
	
	// /**
	//  * Internally updates the state with new comments that match the
	//  * currently selected issue
	//  *
	//  * @param updatedComments
	//  * @param remove
	//  */
	// @ActionReducer()
	// private updateCommentsInState(updatedComments:List<Comment>,remove = false) {
	// 	return (state:IssueState) => {
	//
	// 		let
	// 			{comments,selectedIssueIds,issues} = state
	//
	// 		if (!selectedIssueIds || selectedIssueIds.length !== 1)
	// 			return state
	//
	// 		const
	// 			selectedIssue = this.state.issues.find(it => it.id === selectedIssueIds[0])
	//
	// 		if (!selectedIssue)
	// 			return state
	//
	// 		updatedComments
	// 			.filter(comment => comment.issueNumber === selectedIssue.number && comment.repoId === selectedIssue.repoId)
	// 			.forEach(updatedComment => {
	// 				const
	// 					commentIndex = comments.findIndex(it => it && updatedComment && it.id === updatedComment.id)
	//
	// 				// REMOVE COMMENT
	// 				if (remove) {
	// 					if (commentIndex === -1) {
	// 						log.debug(`Comment is not in state, can not remove`, updatedComment)
	// 					} else {
	// 						comments = comments.remove(commentIndex)
	// 					}
	// 				}
	//
	// 				// UPDATE & ADD COMMENT
	// 				else {
	// 					if (commentIndex > -1) {
	// 						comments = comments.set(commentIndex, updatedComment)
	// 					}else {
	// 						comments = comments.push(updatedComment)
	// 					}
	// 				}
	// 			})
	//
	// 		return (comments === state.comments) ?
	// 			state :
	// 			state.set('comments',comments)
	//
	// 	}
	// }
	//
	// /**
	//  * Push updated comments for the currently selected issue
	//  *
	//  * @param comments
	//  */
	// @ActionThunk()
	// commentsChanged(...comments:Comment[]) {
	// 	return (dispatch,getState) => {
	// 		const
	// 			selectedIssue = selectedIssueSelector(getState())
	//
	// 		if (!selectedIssue)
	// 			return
	//
	// 		const
	// 			filteredComments = comments.filter(comment =>
	// 				comment.issueNumber === selectedIssue.number &&
	// 				comment.repoId === selectedIssue.repoId)
	//
	// 		if (!filteredComments.length) {
	// 			log.debug(`No issue comments matched in batch of ${comments.length}`)
	// 			return
	// 		}
	//
	// 		log.debug(`Pushing ${filteredComments.length} onto the state`)
	// 		this.updateCommentsInState(List<Comment>().push(...filteredComments))
	// 	}
	// }
	
	/**
	 * Remove all issues & comments matching this repo
	 *
	 * @param repoId
	 */
	//@ActionReducer()
	removeAllRepoResources(repoId:number) {
		//return (state:IssueState) => {
		//
		// if (state.selectedIssueIds && state.selectedIssueIds.length) {
		// 	state = state.set('selectedIssueIds',state.selectedIssueIds.filter(issueId => {
		// 		const
		// 			issue = state.issues.find(it => it.id === issueId)
		//
		// 		return issue && issue.repoId !== repoId
		// 	})) as IssueState
		// }
		//
		// if (state.editingIssue && state.editingIssue.repoId === repoId) {
		// 	state = state
		// 		.set('editingIssue', null)
		// 		.set('editInlineConfig',null)
		// 		.set('patchIssues',[])
		// 		.set('editCommentRequest',null)
		// 		.set('editingInline',false)
		// 		.set('issueSaving',false)
		// 		.set('issueSaveError',null) as IssueState
		// }
		//
		// state = state
		// 	.set('issues', state.issues.filter(it => it.repoId !== repoId))
		// 	.set('issuesEvents', state.issuesEvents.filter(it => it.repoId !== repoId))
		// 	.set('comments', state.comments.filter(it => it.repoId !== repoId)) as IssueState
		//
		//
		
		//
		// 	return state
		// }
	}
	
	//
	// /**
	//  * Load all issues for enabled repos
	//  *
	//  * @param dispatch
	//  * @param getState
	//  * @returns {number[]}
	//  */
	// async loadIssuesAction(dispatch, getState) {
	// 	const
	// 		actions = this.withDispatcher(dispatch, getState)
	//
	// 	// Issue repo
	// 	const
	// 		issueState = actions.state,
	// 		availRepos = enabledAvailableReposSelector(getState),
	// 		repoIds = availRepos.map(availRepo => availRepo.repoId)
	//
	// 	log.debug(`Loading issues for repos`, repoIds)
	//
	// 	this.setIssues(await this.getIssues(availRepos))
	//
	// }
	//
	// /**
	//  * Set all activity - add pull requests, etc
	//  *
	//  * @param comments
	//  * @param issuesEvents
	//  */
	// @ActionReducer()
	// private setActivity(comments:List<Comment>,issuesEvents:List<IssuesEvent>) {
	// 	return (state:IssueState) =>
	// 		state
	// 			.set('comments',comments)
	// 			.set('issuesEvents',issuesEvents)
	//
	// }
	
	/**
	 * Get all activity for an issue
	 *
	 * @param issue
	 * @returns {{comments: any}}
	 */
	async getActivity(issue:Issue) {
		
		const
			comments:List<Comment> = await pagedFinder(
				Comment,
				FinderItemsPerPage,
				getStores().comment,
				(commentStore:CommentStore, nextRequest:FinderRequest) =>
					commentStore.findByCommentPrefix(nextRequest, issue.repoId, issue.number)
			),
			events:List<IssuesEvent> = await pagedFinder(IssuesEvent, FinderItemsPerPage, getStores().issuesEvent,
				(issuesEventStore:IssuesEventStore, nextRequest:FinderRequest) =>
					issuesEventStore.findByIssue(nextRequest, issue)
			)
		
		return {
			comments,
			events
		}
		
	}
	
	//
	// /**
	//  * Set activity loading flag
	//  *
	//  * @param loading
	//  * @returns {(state:IssueState)=>Map<string, V>}
	//  */
	// @ActionReducer()
	// setActivityLoading(loading:boolean) {
	// 	return (state:IssueState) => state.set('activityLoading',loading)
	// }
	
	// /**
	//  * Load comments (and should be all activity, pull requests etc)
	//  * for an issue
	//  *
	//  * @param issueId
	//  */
	
	// loadActivityForIssue(issueId: number) {
	//
	// 	const
	// 		deferred = Promise.defer(),
	// 		isCancelled = () => deferred.isCancelled(),
	// 		doResolve = () => !isCancelled() && deferred.resolve(),
	// 		doLoad = async () => {
	// 			this.setActivityLoading(true)
	//
	// 			try {
	// 				// Issue repo
	// 				let
	// 					{ issues } = this.state
	//
	// 				//log.debug(`Loading issue activity`,issues,issueId)
	// 				if (!isListType(issues, Issue) || isCancelled())
	// 					return doResolve()
	//
	// 				let
	// 					issue:Issue = issues.find(issue => issue.id === issueId)
	//
	// 				if (!issue) {
	// 					log.error(`Issue not found in state: ${issueId}`)
	// 					//assert(issue, `Issue still not found in state ${issueId}`)
	// 					return doResolve()
	// 				}
	//
	// 				const
	// 					{ comments, issuesEvents } = await this.getActivity(issue)
	//
	// 				if (isCancelled())
	// 					return doResolve()
	//
	// 				log.debug(`Loading activity for issue ${issueId}, comments = ${comments.size}, events =
	// ${issuesEvents.size}`) this.setActivity(comments, issuesEvents) this.setActivityLoading(false) } catch (err) {
	// log.error(`Failed to load activity for issue ${issueId}`,err)  } finally { doResolve() } }  doLoad()  return
	// deferred  }   /** * Gets issue list from state, if no ids are provided * then it uses the selected ids * @param
	// issueIds */ getSelectedIssuesFromState(...issueIds:number[]) {  issueIds = issueIds.length ? issueIds :
	// this.state.selectedIssueIds  const {issues} = this.state  return issueIds .map(id => issues.find(it => it.id ===
	// id)) .filter(issue => !isNil(issue)) }  export type TIssueIdOrIssue = Array<number|Issue>  /** * Reload all issues
	// in the passed list * that are currently in the state * * @param issues */ reloadIssues(issues:List<Issue>|Issue[])
	//  /** * Same as above - but with rest args of ids or issues * * @param issuesOrIssueIds */
	// reloadIssues(...issuesOrIssueIds:Array<number|Issue>)   /** * Reload issues in the current state (will only work
	// for enabled repos) * * @param args * @returns {(dispatch:any, getState:any)=>Promise<undefined>} */ @ActionThunk() reloadIssues(...args:any[]) { return async (dispatch,getState) => { let enabledRepoIds = enabledRepoIdsSelector(getState()), issues:Issue[] = (Array.isArray(args[0])) ? args[0] : isListType(args[0],Issue) ? args[0].toArray() : isNumber(args[0]) ? nilFilter(args.filter(id => this.state.issues.find(it => it.id === id))) : args  // FINALLY FILTER FOR ONLY ENABLED REPO IDS  issues = issues.filter(it => enabledRepoIds.includes(it.repoId))  log.debug(`Going to reload issues`, issues, 'from args', args) if (!issues.length) { log.debug(`No issues found in state to update from `, args) return }  const updatedIssues = await this.getIssues(availableReposSelector(getStoreState()),issues)  this.updateIssuesInState(List<Issue>(updatedIssues))  } }
	
	
	/**
	 * This is actually 'state' in github - but gets confusing since
	 * our system is in redux
	 *
	 * @param newState
	 * @param issues
	 * @returns {(dispatch:any, getState:any)=>Promise<undefined>}
	 */
	
	async setIssueStatus(issues:List<Issue>, newState:TIssueState) {
		
		log.debug(`Going to delete ${issues.size} issues`)
		
		const
			client = Container.get(GitHubClient),
			closeIssues = issues.toArray()
				.map(it => cloneObjectShallow(it))
		
		
		for (let issue of closeIssues) {
			if (!hasEditPermission(issue)) {
				notifyError(`You don't have permission to close this issue: ${issue.number}`)
				return
			}
		}
		
		const
			promises = closeIssues
				.map(async(issue:Issue) => {
					issue.state = newState
					
					try {
						assert(issue.repo, 'repo not found for issue: ' + issue.repoId)
						
						return await this.saveAndUpdateIssueModel(client, issue.repo, issue)
						
					} catch (err) {
						log.error('set issue state failed', err)
						notifyError(`Unable set set issue state for #${issue.number}: ${err.message}`)
					}
				}),
			
			// WAIT FOR ALL RESPONSES
			results = await Promise.all(promises)
		
		
		notify(`${newState === 'closed' ? 'Closed' : 'Reopened'} ${results.length} issues successfully`)
		
		// Now we simply update the state - removed
		//this.loadIssuesAction(dispatch, getState)
		
		
	}
	
	//
	// /**
	//  * Set the comment being edited
	//  *
	//  * @param editCommentRequest
	//  */
	// @ActionReducer()
	// setEditingComment(editCommentRequest: TEditCommentRequest) {
	// 	return (state: IssueState, getState) => state.set('editCommentRequest', editCommentRequest)
	// }
}


export default IssueActionFactory
