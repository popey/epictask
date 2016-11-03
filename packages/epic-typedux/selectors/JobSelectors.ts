import { JobKey, createDeepEqualSelector, TSelector, TRootState } from "epic-global"
import { JobState } from "../state/JobState"
import { IJob, TJobMap, IJobStatusDetail, IJobAndStatusDetail } from "../state/jobs"
import { uiStateSelector } from "epic-typedux/selectors/UISelectors"
import { createSelector } from "reselect"
import { UIState } from "epic-typedux/state/UIState"


/**
 * Get the current job state
 *
 * @param state
 * @return {JobState}
 *
 */
export const jobStateSelector:TSelector<JobState> =
	(state):JobState => state.get(JobKey) as JobState



/**
 * Get all jobs
 */
export const jobsSelector:TSelector<TJobMap> = createSelector(
	jobStateSelector,
	(state:JobState) => state.all
)

export const jobLogIdSelector:TSelector<string> = createSelector(
	uiStateSelector,
	(state:UIState) => state.jobs.selectedLogId
)

/**
 * Get all job details
 */
export const jobDetailsSelector:TSelector<IJobStatusDetail[]> = createDeepEqualSelector(
	jobStateSelector,
	(state:JobState) =>
		_.orderBy(state.details.toArray(),['updatedAt'],['desc'])
)

/**
 * Get all job details
 */
export const jobsAndStatusDetailsSelector:TSelector<IJobAndStatusDetail[]> = createDeepEqualSelector(
	jobStateSelector,
	(state:JobState) => state
		.details
		.toArray()
		.map(detail => ({
			id: detail.id,
			job: state.all.get(detail.id),
			detail
		}))
)

