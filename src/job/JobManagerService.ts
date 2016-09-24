import {Map} from 'immutable'

import {JobHandler, JobHandlerEventType} from 'job/JobHandler'
import * as assert from 'assert'
import {IEnumEventRemover} from 'shared/util/EnumEventEmitter'
import {IJob, JobStatus, JobType} from 'shared/actions/jobs/JobTypes'
import {IJobExecutorConstructor, loadAllExecutors, IJobExecutor} from "job/JobExecutors"
import {BaseService, RegisterService, IServiceConstructor} from "shared/services"
import {DatabaseClientService} from "shared/services/DatabaseClientService"
import {IJobStatusDetail} from "shared/actions/jobs/JobState"
import { JobKey } from "shared/Constants"
import { clientObserveState, getStateValue } from "shared/AppStoreClient"

const log = getLogger(__filename)



export type TJobExecutorClassMap = {[name:string]:IJobExecutorConstructor}

export interface IJobContainer {
	eventRemovers:IEnumEventRemover[]
	handler:JobHandler
	job:IJob
}

export type TJobMap= {[name:string]:IJobContainer}


// Singleton ref
let jobManager:JobManagerService


/**
 * Type guard job
 *
 * @param jobOrString
 * @returns {any}
 */
function isJob(jobOrString:IJob|string):jobOrString is IJob {
	return _.isString((jobOrString as any).id)
}

/**
 * Job Service for managing all operations
 */
@RegisterService(ProcessType.JobServer)
export class JobManagerService extends BaseService {

	static getInstance() {
		if (!jobManager) {
			jobManager = new JobManagerService()
		}
		
		return jobManager
	}
	
	
	private killed = false

	
	/**
	 * Keeps track of all Job Classes and Types
	 * @type {TJobExecutorClassMap<any>}
	 */
	private executorClassMap:TJobExecutorClassMap = {}


	/**
	 * Currently working jobs
	 *
	 * @type {TJobIMap}
	 */
	private workingJobs:TJobMap = {}
	
	
	
	/**
	 * Unsubscribe from store updates
	 */
	private unsubscriber:Function
	
	dependencies(): IServiceConstructor[] {
		return [DatabaseClientService]
	}
	
	constructor() {
		super()
		
		assert(!jobManager,`Job Manager can only be instantiated once`)
	}
	
	
	
	
	getJobTypes() {
		return Object.keys(this.executorClassMap).join(',')
	}

	/**
	 * Register a job class
	 *
	 * @param executorConstructor
	 * @return {TJobExecutorClassMap}
	 */
	registerExecutor(executorConstructor:IJobExecutorConstructor) {
		
		const name = executorConstructor.name
		
		log.info(`Registering Job: ${name}`)
		if (this.killed) {
			log.warn(`Job Process is killed, can not load ${name}`)
			return null
		}
		
		executorConstructor
			.supportedTypes()
			.forEach((type:JobType) =>
				this.executorClassMap[JobType[type]] = executorConstructor)
				
		
		return this.executorClassMap
	}
	
	/**
	 * Create a new JobExecutor
	 *
	 * @param job
	 */
	newExecutor(job:IJob):IJobExecutor {
		const
			{type} = job,
			name = JobType[type]
		
		log.info(`Looking for job executor that can handle job type ${name}`)
		
		const executorClazz = this.executorClassMap[name]
		assert(executorClazz,`Unable to find class for job named ${name}, available classes are: ${Object.keys(this.executorClassMap)}`)

		return new executorClazz(job)
	}
	
	
	async init():Promise<any> {
		return super.init()
	}
	
	/**
	 * Start the Job Service,
	 * load all schedules, etc, etc
	 *
	 * @returns {JobManagerService}
	 */
	async start():Promise<this> {
		log.info("Load executors")
		loadAllExecutors()
		
		
		this.unsubscriber = await clientObserveState([JobKey, 'all'], this.onJobsUpdated)
		
		
		// Execute default jobs
		const allJobs = await getStateValue(JobKey,'all')
		await this.onJobsUpdated(allJobs)
		
		
		
		// Watch for job updates
		log.info('Subscribe for state updates')
		return super.start()
	}
	
	
	/**
	 * Check for new jobs, cancelled jobs, etc
	 *
	 * @param jobs
	 */
	onJobsUpdated = async (jobs:{[id:string]:IJob}) => {
		log.info(`Checking jobs`,jobs)
		const newJobs = Object
			.values(jobs)
			.filter(job =>
				job &&
				job.status === JobStatus.Created &&
				!this.workingJobs[job.id])
		
		const details = await getStateValue(JobKey,'details')
		
		log.info(`Found ${newJobs.length} new jobs, executing now`)
		
		newJobs.forEach(job => {
			this.execute(job,details.find(detail => detail.id === job.id))
		})
	}
	

	/**
	 * On a job event, handle it!
	 *
	 * @param event
	 * @param handler
	 * @param job
	 * @param detail
	 */
	onJobEvent = (event:JobHandlerEventType, handler:JobHandler, job:IJob, detail:IJobStatusDetail) => {
		const workingJob = this.workingJobs[job.id]
		
		if (workingJob && [JobStatus.Failed,JobStatus.Completed].includes(job.status)) {
			log.info(`Removing ${job.name} (${job.id}) from working job list`)
			delete this.workingJobs[job.id]
		}
			
	}
	
	/**
	 * Execute a job
	 *
	 * @param job
	 * @param detail
	 * @returns {JobHandler}
	 */
	execute = (job:IJob,detail:IJobStatusDetail) => {
		// Create a new executor
		const
			handler = new JobHandler(this,job,detail),

			// Attach to all events
			eventRemovers:IEnumEventRemover[] = handler.onAll(this.onJobEvent)

		this.workingJobs[job.id] = {
			eventRemovers,
			handler,
			job
		}
		
		log.info(`Executing Job ${job.name} (${job.id})`)
		handler.execute()
		
	}

	
	/**
	 * Find an existing job that matches the
	 * current job request
	 *
	 *
	 * @param nameOrId
	 */
	findJob(nameOrId) {
		if (this.killed) return null

		const workingJobs = this.workingJobs
		const container = this.workingJobs[nameOrId] || Object
			.values(workingJobs)
			.find(({handler}) =>
				handler.job.status < JobStatus.Completed &&
				handler.job.name === nameOrId)

		return container ? container.handler.job : null

	}


	kill() {
		//assert(module.hot,'kill can only be called for hmr')
		this.killed = true
		
		if (this.unsubscriber)
			this.unsubscriber()
		
		this.workingJobs = {}
	}
	
	
	
	
}


/**
 * Get the JobManager singleton
 *
 * @return {JobManagerService}
 */
export function getJobManager() {
	return JobManagerService.getInstance()
}

Container.bind(JobManagerService).provider({get: getJobManager})

export default getJobManager

if (module.hot) {
	module.hot.accept(() => log.info('hot reload',__filename))
}

