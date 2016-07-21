import {ObservableStore} from 'typedux'
import {List} from 'immutable'
import {Singleton, AutoWired, Inject,Container, Scope} from 'typescript-ioc'
import {IService, ServiceStatus, BaseService} from './IService'
import {RepoActionFactory} from 'shared/actions/repo/RepoActionFactory'
import {issueModelsSelector} from 'shared/actions/data/DataSelectors'

import {createDeepEqualSelector} from 'shared/util/SelectorUtil'
import {enabledReposSelector,enabledRepoIdsSelector} from 'shared/actions/repo/RepoSelectors'
import {AvailableRepo} from 'shared/models/AvailableRepo'
import {DataActionFactory} from 'shared/actions/data/DataActionFactory'
import {Stores} from 'main/services/DBService'
import {IssueActionFactory} from 'shared/actions/issue/IssueActionFactory'
import {selectedIssueIdsSelector} from 'shared/actions/issue/IssueSelectors'

const log = getLogger(__filename)



// @AutoWired
// @Singleton
export default class RepoStateService extends BaseService {

	private unsubscribe:Function

	store:ObservableStore<any> = Container.get(ObservableStore as any) as any

	repoActions:RepoActionFactory = Container.get(RepoActionFactory)

	issueActions:IssueActionFactory = Container.get(IssueActionFactory)

	async init():Promise<this> {
		await super.init()
		return this
	}

	async start():Promise<this> {
		await super.start()
		// Issue selected handler
		// this.selectedIssuesChanged = _.debounce((selectedIssues) => {
		// 	if (selectedIssues && selectedIssues.size === 1) {
		// 		this.repoActions.loadIssue(selectedIssues.get(0))
		// 	}
		// },150)
		//
		// // Enable repo change handler and selection change

		await this.enabledReposChanged()
		// this.selectedIssuesChanged(this.repoActions.state.selectedIssues)
		//
		// // Setup watches for both

		const enabledReposChangedSelector = createDeepEqualSelector(
			enabledReposSelector,
			this.enabledReposChanged
		)

		const selectedIssueIdsChangedSelector = createDeepEqualSelector(
			selectedIssueIdsSelector,
			this.selectedIssueIdsChanged
		)

		this.unsubscribe = this.store.getReduxStore().subscribe(() => {
			const state = this.store.getState()
			enabledReposChangedSelector(state)
			selectedIssueIdsChangedSelector(state)
		})

		if (module.hot) {
			module.hot.dispose(() => this.unsubscribe && this.unsubscribe())
		}

		//
		// this.store.observe(
		// 	[this.repoActions.leaf(),'selectedIssues'],
		// 	this.selectedIssuesChanged
		// )


		return this
	}


	async stop():Promise<this> {
		await super.stop()
		if (this.unsubscribe) {
			this.unsubscribe()
			this.unsubscribe = null
		}

		return this
	}

	destroy():this {
		return this
	}


	selectedIssueIdsChanged = (selectedIssueIds:number[]) => {
		if (selectedIssueIds && selectedIssueIds.length === 1)
			this.issueActions.loadActivityForIssue(selectedIssueIds[0])
	}

	/**
	 * When enabled repos change,
	 * load supporting data/models
	 *
	 * @param availableRepos
	 */
	enabledReposChanged = async () => {
		const enabledRepoIds = enabledRepoIdsSelector(this.store.getState())
		const issueModels = issueModelsSelector(this.store.getState())
		const selectedIssueIds = selectedIssueIdsSelector(this.store.getState())
		let newSelectedIssueIds = await selectedIssueIds
			.filter((issueId) => {
				let issue = issueModels.get(`${issueId}`)

				const issueExists = !_.isNil(issue)
				const repoIdEnabled = issueExists && enabledRepoIds.includes(issue.repoId)
				log.info('Selected issue id filter',issueExists,repoIdEnabled)
				return issueExists && repoIdEnabled
			})

		if (!_.isEqual(selectedIssueIds,newSelectedIssueIds))
			this.issueActions.setSelectedIssueIds(newSelectedIssueIds)
		this.issueActions.loadIssues()
	}
}
