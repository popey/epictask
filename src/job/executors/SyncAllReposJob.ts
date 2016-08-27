
import {Container} from 'typescript-ioc'
import getJobManager from "../JobManagerService"

import {JobHandler} from 'job/JobHandler'
import {Stores} from 'shared/services/DatabaseClientService'
import {Benchmark} from 'shared/util/Benchmark'
import {JobExecutor} from 'job/JobDecorations'
import {Job} from 'shared/actions/jobs/JobState'
import {RepoActionFactory} from 'shared/actions/repo/RepoActionFactory'


const log = getLogger(__filename)

const Benchmarker = Benchmark('SyncAllReposJob')

/**
 * Synchronize all enabled repos
 */
@JobExecutor
export class SyncAllReposJob extends Job {

	constructor(o:any = {}) {
		super(o)

		Object.assign(this, {
			schedule: '*/30 * * * *', // Every 10 minutes
			repeat: true,
			oneAtATime: true,
			scheduled:true,
			immediate:false
		})
	}

	@Benchmarker
	async executor(handler:JobHandler) {
		log.info(`Starting to sync all repos`)

		const stores = Container.get(Stores)
		const availRepos = await stores.availableRepo.loadAll()
		const service = getJobManager()
		const repoActions:RepoActionFactory = Container.get(RepoActionFactory)
		log.debug('Getting avail repos from DB, not state')

		repoActions.syncRepo(availRepos.map(availRepo => availRepo.repoId))

	}
}
