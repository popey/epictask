import { FinderRequest } from "typestore"
import { List } from "immutable"
import {
	Benchmark,
	RepoKey,
	isNil,
	getSettings,
	Provided,
	getValue,
	nilFilter,
	cloneObjectShallow,
	RegisterActionFactory,
	pagedFinder,
	GithubSyncStatus
} from "epic-global"
import { getStores,chunkRemove } from "epic-database-client"
import { ActionFactory, ActionReducer, ActionThunk } from "typedux"
import { RepoMessage, RepoState } from "../state/RepoState"

import {
	Milestone,
	Label,
	AvailableRepo,
	Repo,
	LoadStatus,
	Issue,
	IssueStore,
	makeIssueId,
	Comment,
	CommentStore,
	makeCommentId,
	User
} from "epic-models"
import {repoIdPredicate, enabledRepoIdsSelector, availableReposSelector} from '../selectors'
import { getIssueActions } from "epic-typedux/provider"
import {JobType} from "../state/jobs/JobTypes"
import JobDAO from "epic-typedux/state/jobs/JobDAO"
import { createClient } from "epic-github"
import ProcessType from "epic-entry-shared/ProcessType"
import { shallowEquals } from "epic-global/ObjectUtil"

const log = getLogger(__filename)
const uuid = require('node-uuid')
const Benchmarker = Benchmark('RepoActionFactory')



/**
 * RepoActionFactory.ts
 *
 * @class RepoActionFactory.ts
 * @constructor
 **/
@RegisterActionFactory
@Provided
export class RepoActionFactory extends ActionFactory<RepoState,RepoMessage> {
	
	static leaf = RepoKey
	
	
	constructor() {
		super(RepoState)
	}
	
	/**
	 * Supported leaf = RepoState
	 *
	 * @returns {string}
	 */
	leaf():string {
		return RepoKey;
	}
	
	@ActionReducer()
	patchAvailableRepos(patch:any,availableRepos:List<AvailableRepo>|AvailableRepo[]) {
		return (state:RepoState) => {
			
			let
				newAvailRepos = state.availableRepos
			
			availableRepos = (Array.isArray(availableRepos) ?
				availableRepos :
				availableRepos.toArray()) as AvailableRepo[]
			
			for (let availRepo of availableRepos) {
				const
					index = newAvailRepos.findIndex(it => it.id === availRepo.id),
					existingAvailRepo = index > -1 && newAvailRepos.get(index)
				
				if (!existingAvailRepo) {
					log.warn(`Tried to patch a repo that is not in the state`, availRepo)
					continue
				}
				
				availRepo = assign(_.clone(existingAvailRepo),patch)
				
				newAvailRepos = newAvailRepos.set(index,availRepo)
			}
			
			
			return state.set('availableRepos',newAvailRepos)
			
		}
	}
	
	/**
	 * Updated available repo resources
	 *
	 * @param availableRepos
	 * @returns {(state:RepoState)=>Map<K, V>}
	 */
	@ActionReducer()
	updateAvailableRepos(availableRepos:List<AvailableRepo>|AvailableRepo[]) {
		return (state:RepoState) => {
			
			let
				newAvailRepos = state.availableRepos
			
			availableRepos = (Array.isArray(availableRepos) ?
				availableRepos :
				availableRepos.toArray()) as AvailableRepo[]
			
			for (let availRepo of availableRepos) {
				const
					index = newAvailRepos.findIndex(it => it.id === availRepo.id),
					existingAvailRepo = index > -1 && newAvailRepos.get(index)
				
				
				availRepo = assign(_.clone(existingAvailRepo || availRepo),availRepo)
				
				newAvailRepos = index === -1 ?
					newAvailRepos.push(availRepo) :
					newAvailRepos.set(index,availRepo)
			}
			
			
			return state.set('availableRepos',newAvailRepos)
			
		}
			
	}
	
	
	/**
	 * Sync repo including issues, comments, milestones,
	 * labels, collaborators, etc, etc
	 *
	 * @returns {(dispatch:any, getState:any)=>Promise<undefined>}
	 * @param repoIds
	 * @param force
	 */
	@ActionThunk()
	syncRepo(repoIds:number|number[],force:boolean=false) {
		return async (dispatch,getState) => {

			if (!Array.isArray(repoIds))
				repoIds = [repoIds]
			
			for (let repoId of _.uniq(repoIds)) {
				const
					availableRepo = await getStores().availableRepo.findByRepoId(repoId),
					repo = await getStores().repo.get(repoId)

				// Create RepoSync Job
				log.debug(`Triggering repo sync for ${repo.full_name}`)
				JobDAO.create(JobType.RepoSync,null,{
					availableRepo,
					repo,
					force
				})
			}

		}
	}

	/**
	 * Sync user repos
	 *
	 * @returns {(dispatch:any, getState:any)=>Promise<AvailableRepo[]>}
	 */
	@ActionThunk()
	syncUserRepos() {
		return (dispatch,getState) => {
			log.debug('Triggering user repo sync')
			
			JobDAO.create(JobType.GetUserRepos)
		}
	}
	
	/**
	 * Sync everything / enabled repos & current user repos list
	 */
	@ActionThunk()
	syncAll() {
		return (dispatch,getState) => {
			
			this.syncUserRepos()
			this.syncRepo(
				enabledRepoIdsSelector(getState()).toArray(),
				true
			)
		}
		
	}

	getUsersByRepoId(...repoIds:number[]):Promise<List<User>> {
		return pagedFinder(User,50,getStores().user,(store,nextRequest) =>
			store.findByRepoId(nextRequest,...repoIds)
		)
	}
	
	/**
	 * Patch available repo
	 */
	
	private patchAvailableRepo(state:RepoState,repoId:number,field:string,value:any) {
		let
			{availableRepos} = state,
			index = availableRepos.findIndex(it => it.id === repoId),
			availableRepo = index !== -1 && cloneObjectShallow(availableRepos.get(index))
		
		if (!availableRepo) {
			log.error(`Can not update ${field} on state, no repo found with id ${repoId}`)
			return state
		}
		
		availableRepo[field] = value
		
		// ON NEXT TICK UPDATE ISSUES
		if (['milestone','labels'].includes(field))
			setImmediate(() => {
				getIssueActions()
					.refillResourcesForRepo(
						availableRepo,
						field === 'milestones' ?
							'milestone' :
							'labels'
					)
		})
		
		return state.set('availableRepos', availableRepos.set(index,availableRepo)) as RepoState
	}
	
	/**
	 * Update available repos
	 *
	 * @param availRepos
	 * @param deletedIds
	 * @returns {(state:RepoState)=>(RepoState|Map<(value:Map<any, any>)=>Map<any, any>, V>)}
	 */
	@ActionReducer()
	onAvailableRepoChanges(availRepos:AvailableRepo[],deletedIds:number[] = []) {
		
		return (state:RepoState) => {
			
			const
				repoIds = availRepos.map(it => it.id),
				affectedRepos = state
					.availableRepos
					
					// CHECK NOT DELETED && THEN CHECK FOR CHANGES
					.filter((it:AvailableRepo) => deletedIds.includes(it.id) ||
						!!availRepos.find(availRepo => availRepo.id === it.id &&
							!shallowEquals(it,availRepo,'enabled','deleted'))
					
					)
			
				// availRepos = state.availableRepos
				// 	.filter(it => repoIds.includes(it.id)) as List<AvailableRepo>
			
			if (!affectedRepos.size)
				return state
			
			
			return state.withMutations((newState:RepoState) => {
				
				
				let
					updatedAvailRepos = newState.availableRepos
				
				newState.availableRepos.forEach((availRepo,index) => {
					
					// WE NEED ACCURATE INDEXES - SO THIS INSTEAD OF FILTERING
					if (!repoIds.includes(availRepo.id))
						return
					
					const
						changedAvailRepo = availRepos.find(it => it.id === availRepo.id),
						updatedAvailRepo = cloneObjectShallow(availRepo,_.pick(changedAvailRepo,'deleted','enabled'))
					
					updatedAvailRepos = updatedAvailRepos
						.set(index,updatedAvailRepo) as any
					
				})
				
				// FINALLY FILTER OUT ALL THE DELETES
				updatedAvailRepos = updatedAvailRepos.filter(it =>
					!it.deleted && !deletedIds.includes(it.id)) as any
				
				return newState.set('availableRepos',updatedAvailRepos) as RepoState
			})
		}
	}
	
	/**
	 * On repo change - make some updates ;)
	 *
	 * @param repos
	 * @returns {(state:RepoState)=>Map<(value:Map<any, any>)=>Map<any, any>, V>}
	 */
	@ActionReducer()
	updateRepos(repos:Repo[]) {
		return (state:RepoState) => {
			
			const
				repoIds = repos.map(it => it.id),
				availRepos = state.availableRepos.filter(it => repoIds.includes(it.id)) as List<AvailableRepo>
				
			if (!availRepos.size)
				return state
			
			
			return state.withMutations((newState:RepoState) => {
				
				let
					updatedAvailRepos = newState.availableRepos
				
				newState.availableRepos.forEach((availRepo,index) => {
					
					// WE NEED ACCURATE INDEXES - SO THIS INSTEAD OF FILTERING
					if (!repoIds.includes(availRepo.id))
						return
					
					const
						repo = repos.find(it => it.id === availRepo.id),
						updatedRepo = cloneObjectShallow(availRepo.repo,repo),
						updatedAvailRepo = cloneObjectShallow(availRepo,{
							repo:updatedRepo
						})
					
					updatedAvailRepos = updatedAvailRepos
						.set(index,updatedAvailRepo) as any
					
				})
				
				return newState.set('availableRepos',updatedAvailRepos) as RepoState
			})
		}
	}
	
	
	/**
	 * Update milestones on state
	 *
	 * @param milestones
	 * @param deletedIds
	 */
	@ActionReducer()
	updateMilestones(milestones:Milestone[], deletedIds:number[] = []) {
		return (state:RepoState) => {
			
			const
				updatedMilestoneIds = milestones.map(it => it.id).concat(deletedIds),
				{availableRepos} = state
			
			return state.withMutations((newState:RepoState) => {
				
				// ITERATE REPOS, UPDATING ALL
				availableRepos.forEach(availableRepo => {
					
					const
						repoId = availableRepo.id,
						repoMilestones = milestones.filter(it =>it.repoId === repoId)
					
					if (!repoMilestones.length)
						return
					
					// TODO: As we move back to general data management with requests, etc - we should simply do allLoadedUsers.filter(repoIds.includes(repoId)
					
					// THIS FILTERS UPDATES AND DELETES
					let
						updatedMilestones =  (availableRepo.milestones || [])
							.filter(milestone => !updatedMilestoneIds.includes(milestone.id))
							.concat(repoMilestones)
					
					
					newState = this.patchAvailableRepo(newState,repoId,'milestones',updatedMilestones)
				})
				
				return newState
			})
			
		}
	}
	
	/**
	 * Update labels on state
	 *
	 * @param labels
	 * @param deletedIds
	 */
	@ActionReducer()
	updateLabels(labels:Label[], deletedIds:number[] = []) {
		return (state:RepoState) => {
			
			const
				updatedLabelIds = labels.map(it => it.id).concat(deletedIds),
				{availableRepos} = state
			
			return state.withMutations((newState:RepoState) => {
				
				// ITERATE REPOS, UPDATING ALL
				availableRepos.forEach(availableRepo => {
					
					const
						repoId = availableRepo.id,
						repoLabels = labels.filter(it =>it.repoId === repoId)
					
					if (!repoLabels.length)
						return
					
					// TODO: As we move back to general data management with requests, etc - we should simply do allLoadedUsers.filter(repoIds.includes(repoId)
					
					// THIS FILTERS UPDATES AND DELETES
					let
						updatedLabels =  (availableRepo.labels || [])
							.filter(label => !updatedLabelIds.includes(label.id))
							.concat(repoLabels)
					
					
					newState = this.patchAvailableRepo(newState,repoId,'labels',updatedLabels)
				})
				
				return newState
			})
			
		}
	}
	
	/**
	 * Update assignees on state
	 *
	 * @param collaborators
	 */
	@ActionReducer()
	updateCollaborators(collaborators:User[]) {
		return (state:RepoState) => {
			
			const
				updatedCollabIds = collaborators.map(it => it.id),
				{availableRepos} = state
			
			return state.withMutations((newState:RepoState) => {
				
				// ITERATE REPOS, UPDATING ALL
				availableRepos.forEach(availableRepo => {
					
					const
						repoId = availableRepo.id,
						repoCollabs = collaborators.filter(it =>
							it.repoIds && it.repoIds.includes(repoId)
						)
					
					
					if (!repoCollabs.length)
						return
					
					// TODO: As we move back to general data management with requests, etc - we should simply do allLoadedUsers.filter(repoIds.includes(repoId)
					
					// THIS FILTERS UPDATES AND DELETES
					let
						updatedCollabs =  availableRepo
							.collaborators
							.filter(collab => !updatedCollabIds.includes(collab.id))
							.concat(repoCollabs)
					
					newState = this.patchAvailableRepo(newState,repoId,'collaborators',updatedCollabs)
				})
				
				return newState
			})
		}
	}
	
	/**
	 * Check if a repo has already been loaded into the state
	 *
	 * @param availRepo
	 * @returns {boolean}
	 */
	private repoInState(availRepo) {
		const
			{availableRepos} = this.state,
			currentRepo = availableRepos && availableRepos
				.find(it =>
					it.id === availRepo.id &&
					it.repoLoadStatus &&
					it.repoLoadStatus > LoadStatus.NotLoaded)
		return !isNil(currentRepo)
			
	}
	
	/**
	 * Load all available repo resources
	 */
	@ActionThunk()
	loadAvailableRepos(prepareOnBoot = false) {
		return async (dispatch,getState) => {
			log.debug(`Getting available repos`)
			
			const
				stores = getStores(),
				
				// UPDATE LOAD STATUS AND STEP OVER
				updateLoadStatuses = async (availReposToUpdate,repoLoadStatus:LoadStatus,issuesLoadStatus:LoadStatus) => {
					let
						updatedAvailRepos = availReposToUpdate.map(it => assign(_.clone(it),{
							repoLoadStatus: LoadStatus.Loading,
							issuesLoadStatus: LoadStatus.NotLoaded
						}))
					
					this.updateAvailableRepos(updatedAvailRepos)
					
					// QUICK DELAY TO ALLOW UI UPDATE
					await Promise.setImmediate()
					
					if (List.isList(updatedAvailRepos))
						updatedAvailRepos = updatedAvailRepos.toArray()
					
					return updatedAvailRepos as AvailableRepo[]
				}
			
			
			
			// IF THIS IS THE BOOT REQUEST
			if (prepareOnBoot && getValue(() => this.state.availableRepos.size,0)) {
				await updateLoadStatuses(this.state.availableRepos,LoadStatus.NotLoaded, LoadStatus.NotLoaded)
			}
			
			// NOW QUERY THE DB AND GET TO WORK
			let
				availRepos = (await stores.availableRepo.findAll())
					// FILTER DELETED && ALREADY IN STATE
					.filter(availRepo => !availRepo.deleted && !this.repoInState(availRepo)),
				
				availRepoIds = availRepos.map(it => it.id)
			
			// IF EVERYTHING IS IN THE STATE THEN EXIT IMMEDIATELY
			if (availRepoIds.length === 0)
				return
			
			// SET LOADING
			availRepos = await updateLoadStatuses(
				availRepos,
				LoadStatus.Loading,
				LoadStatus.NotLoaded)
			
			// DELAYING FOR A QUICK STATE UPDATE TO DISPLAY LOADING STATUS
			log.debug(`Got available repos `, availRepos,availRepoIds)
			
			
			const
				repoIds = availRepos.map(item => item.id),
				
				// LOAD REPO, ASSIGNEES/COLLABS, LABELS & MILESTONES
				promises = [
					
					// Repos
					stores.repo.bulkGet(...repoIds)
						.then(models => {
							availRepos.forEach(it =>
								it.repo = models.find(repo => repo.id ===  it.id))
						}),
					
					// Users/Assignees/Collaborators
					this.getUsersByRepoId(...repoIds).then(modelList => {
						const
							models = modelList.toArray()
						
						availRepos.forEach(it =>
							(it.collaborators = it.collaborators || [])
								.push(...models.filter(user => user.repoIds.includes(it.repoId))))
					})
				
				
				].concat(
					
					// Labels
					availRepos.map(availRepo =>
						stores.label.findByRepo(availRepo.id)
							.then(models => {
								availRepo.labels = models
							}),
					),
					
					// Milestones
					availRepos.map(availRepo =>
						stores.milestone.findByRepo(availRepo.id)
							.then(models => {
								availRepo.milestones = models
							})
					)
				)
			
			// WAIT FOR EVERYTHING TO LOAD
			await Promise.all(promises)
			
			// UPDATE ALL STATUSES
			availRepos = availRepos.map(it => assign(_.clone(it),{repoLoadStatus: LoadStatus.Loaded}))
			
			// ASSIGN TO NEW REF
			this.updateAvailableRepos(List<AvailableRepo>(availRepos))
			
			// QUICK DELAY
			await Promise.delay(100)
			
			// LOAD ISSUES
			if (ProcessConfig.isType(ProcessType.UI)) {
				log.warn('CHANGE THIS TO CONFIG')
				getIssueActions().loadIssues()
			}
			
		}
	}
	
	/**
	 * Clear selected repos
	 *
	 * @returns {(state:RepoState)=>Map<string, Array>}
	 */
	@ActionReducer()
	clearSelectedRepos() {
		return (state:RepoState) => state.set('selectedRepoIds',[])
	}
	
	/**
	 * Select a repo in the repo list
	 *
	 * @param selectedRepoId
	 * @param selected
	 */
	@ActionReducer()
	setRepoSelected(selectedRepoId:number,selected:boolean) {
		return (state:RepoState) => state.set(
			'selectedRepoIds',
			state
				.selectedRepoIds.filter(repoIdPredicate(selectedRepoId))
				.concat(selected ? [selectedRepoId] : [])
		)
	}
	
	/**
	 * Mark a repo as an 'AvailableRepo'
	 *
	 * @param repo
	 */
	@ActionThunk()
	createAvailableRepo(repo:Repo) {
		return async(dispatch, getState) => {
			const
				actions = this.withDispatcher(dispatch, getState),
				repoStore = getStores().repo,
				availRepoStore = getStores().availableRepo

			let availRepo:AvailableRepo = new AvailableRepo({
				id: repo.id,
				repoId: repo.id,
				enabled: true,
				deleted: false
			})

			let
				savedRepo = await repoStore.get(repo.id)
			
			if (!savedRepo) {
				log.debug(`Create available repo request with a repo that isn't in the db - probably direct query result from GitHUb, adding`)
				await repoStore.save(repo)
			}
			
			const
				existingAvailRepo:AvailableRepo = await availRepoStore.get(repo.id)
			
			log.debug('Saving new available repo as ',availRepo.repoId,'existing',existingAvailRepo && JSON.stringify(existingAvailRepo,null,4))
			if (existingAvailRepo)
				availRepo = assign(existingAvailRepo,availRepo)
		
			await availRepoStore.save(availRepo)
			actions.loadAvailableRepos()
			actions.syncRepo([availRepo.repoId],true)
			
		}
	}
	
	/**
	 * Remove the repo from the state
	 *
	 * @param repoId
	 */
	@ActionReducer()
	private removeAvailableRepoFromState(repoId:number) {
		return (state:RepoState) => state.set(
			'availableRepos',state.availableRepos.filter(it => it.id !== repoId))
	}
	
	/**
	 * Remove an AvailableRepo from the system
	 *
	 * @param availRepoId
	 * @param dispatch
	 * @param getState
	 */
	@Benchmarker
	private async removeAvailableRepoAction(availRepoId,dispatch, getState) {
		
		const
			stores = getStores(),
			myUserId = _.get(getSettings(),'user.id')

		// Get the repo
		let
			availRepo = await stores.availableRepo.get(availRepoId)
		
		assert(availRepo,`Available repo not found for id ${availRepoId}`)
		
		const
			{repoId} = availRepo
		
		availRepo.deleted = true
		availRepo.enabled = false
		availRepo = await stores.availableRepo.save(availRepo)
		
		
		// FIRST - get everything out of the state
		log.debug(`Reloading avail repos`)
		this.removeAvailableRepoFromState(availRepo.id)

		log.debug('Cleaning up issue selections')
		getIssueActions().removeAllRepoResources(availRepo.id)
		
		log.debug(`Going to delay for a second then delete everything`)
		await Promise.delay(1000)


		// Retrieve every entity for the repo
		const
			labelIds = (await stores.label.findIdsByRepo(repoId)).map(url => `${repoId}-${url}`),
			milestoneIds = (await stores.milestone.findIdsByRepo(repoId)).map(id => `${repoId}-${id}`),
			
			// MAP ALL ISSUES TO ISSUE IDS
			issueIds = (await pagedFinder(
					Issue,
					100,
					getStores().issue,
					(issueStore:IssueStore, nextRequest:FinderRequest, lastIssues:Issue[]) =>
						issueStore.findByIssuePrefix(nextRequest, availRepo.repoId)
				)).map(issue => makeIssueId(issue)).toArray(),
			
			// ALL COMMENTS
			commentIds = (await pagedFinder(
				Comment,
				100,
				getStores().comment,
				(commentStore:CommentStore,nextRequest:FinderRequest) =>
					commentStore.findByRepoId(nextRequest,repoId)
				
			)).map(comment => makeCommentId(comment)).toArray(),
			
			// USERS
			users = (await stores.user.findByRepoId(null,repoId))
				.filter(user => user.id !== myUserId),
			
			removeUsers = users
				.filter(user => user.repoIds && user.repoIds.length === 1)
				.map(user => {
					_.remove(user.repoIds,(userRepoId) => repoId === userRepoId)
					return user
				})

		log.debug(`Going to remove
			availRepo: ${availRepo.id}
			labels: ${labelIds.length}
			issues: ${issueIds.length}
			comments: ${commentIds.length}
			milestones: ${milestoneIds.length}
			users (update): ${removeUsers.length}
		`)

		log.debug(`Removing avail repo`)

		const
			// Concat all ids to remove
			removeUserIds = nilFilter(removeUsers.map(user => user.id)).map(id => id + ''),
			
			// Create a promise to remove everything
			removePromise = Promise.all([
				chunkRemove(commentIds,stores.comment),
				chunkRemove(labelIds,stores.label),
				chunkRemove(milestoneIds,stores.milestone),
				chunkRemove(issueIds,stores.issue),
				chunkRemove(removeUserIds,stores.user)
			])
		
		
		GithubSyncStatus.clearPrefix(`${availRepoId}`)
		
		// Wait for the all-clear
		await removePromise

		// WE DO THIS AT THE END JUST IN CASE THE APP EXITS
		// IN THE MIDDLE SO WE CAN CONTINUE DELETING AFTER
		await stores.availableRepo.remove(availRepoId)
		
		log.debug(`Avail repo removed ${repoId}`)

	}
	
	/**
	 * Remove an available repo
	 *
	 * @param availRepoId
	 * @returns {(dispatch:any, getState:any)=>Promise<undefined>}
	 */
	@ActionThunk()
	removeAvailableRepo(availRepoId:number) {
		return (dispatch, getState) => this.removeAvailableRepoAction(availRepoId,dispatch,getState)
	}


	/**
	 * Enabled and disable repos
	 *
	 * @param availRepoId
	 * @param enabled
	 * @returns {(dispatch:any, getState:any)=>Promise<undefined|boolean>}
	 */
	@ActionThunk()
	setRepoEnabled(availRepoId,enabled:boolean) {
		return async (dispatch,getState) => {
			let
				stores = getStores(),
				availableRepos = availableReposSelector(getState()),
				availRepo = availableRepos.find(it => it.id === availRepoId)
			
			
			log.debug(`Setting available repo ${availRepo.id} to enabled ${enabled}`,availRepo,enabled)
			if (enabled === availRepo.enabled) {
				log.warn(`No change in avail repo enabled state`,availRepo,enabled)
				return
			}
			
			let
				persistentAvailRepo = await stores.availableRepo.get(availRepoId)
			
			availRepo.enabled = persistentAvailRepo.enabled = enabled
			await stores.availableRepo.save(persistentAvailRepo)
			
			
			
			
			// UPDATE THE ACTUAL REPO
			this.patchAvailableRepos({
				enabled,
				issuesLoadStatus: LoadStatus.NotLoaded
			},[availRepo])
			
			// IF NOT ENABLED THEN CLEAR ISSUES
			
			await Promise.delay(100)
			if (!enabled) {
				getIssueActions().removeAllRepoResources(availRepoId)
			} else {
				getIssueActions().loadIssues()
			}
			
			log.debug('Saved avail repo, setting enabled to',enabled)
			
		}
	}
	
	@ActionThunk()
	saveMilestone(repo:Repo,milestone:Milestone) {
		return async (dispatch,getState) => {
			const
				milestoneStore = getStores().milestone,
				client = createClient()
			
			const
				updatedMilestone = await client.milestoneSave(repo,milestone)
				
			
			if (!updatedMilestone.repoId)
				updatedMilestone.repoId = repo.id
			
			const
				savedMilestone = await milestoneStore.save(updatedMilestone),
			
				availableRepos = availableReposSelector(getState()),
				availableRepo = _.clone(availableRepos.find(it => it.id === repo.id))
			
			availableRepo.milestones = availableRepo.milestones
				.filter(it => it.id !== savedMilestone.id)
				.concat([savedMilestone])
			
			this.updateAvailableRepos([availableRepo])
		}
	}
	
	@ActionThunk()
	deleteMilestone(repo:Repo,milestone:Milestone) {
		return async (dispatch,getState) => {
			const
				milestoneStore = getStores().milestone,
				client = createClient()
			
			await client.milestoneDelete(repo,milestone)
			
			await milestoneStore.remove(Milestone.makeId(milestone))
			
			const
				availableRepos = availableReposSelector(getState()),
				availableRepo = _.clone(availableRepos.find(it => it.id === repo.id))
			
			availableRepo.milestones = availableRepo
				.milestones
				.filter(it => it.id !== milestone.id)
			
			this.updateAvailableRepos([availableRepo])
		}
	}
	
	@ActionThunk()
	saveLabel(repo:Repo,label:Label) {
		return async (dispatch,getState) => {
			const
				labelStore = getStores().label,
				client = createClient()
			
			
			
			const
				updatedLabel = await client.labelSave(repo,label)
			
			if (!updatedLabel.repoId)
				updatedLabel.repoId = repo.id
			
			const
				savedLabel = await labelStore.save(updatedLabel),
			
				availableRepos = availableReposSelector(getState()),
				availableRepo = _.clone(availableRepos.find(it => it.id === repo.id))
			
			
			
			availableRepo.labels = availableRepo
				.labels
				.filter(it => it.url !== label.url)
				.concat([savedLabel])
			
			this.updateAvailableRepos([availableRepo])
		}
	}
	
	
	@ActionThunk()
	deleteLabel(repo:Repo,label:Label) {
		return async (dispatch,getState) => {
			const
				labelStore = getStores().label,
				client = createClient()
			
			await client.labelDelete(repo,label)
			
			await labelStore.remove(Label.makeId(label))
			
			const
				availableRepos = availableReposSelector(getState()),
				availableRepo = _.clone(availableRepos.find(it => it.id === repo.id)),
				currentLabels = availableRepo.labels
			
			
			availableRepo.labels = availableRepo.labels.filter(it => it.url !== label.url)
			log.info(`Removed label, new labels=`,availableRepo.labels,'old labels=',currentLabels)
			this.updateAvailableRepos([availableRepo])
		}
	}

}


export default RepoActionFactory