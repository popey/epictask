// Imports
import * as React from 'react'
import * as Radium from 'radium'
import filterProps from 'react-valid-props'
import {PureRender, Icon} from 'components/common'

import {ThemedStyles} from 'shared/themes/ThemeManager'
import {IJobStatusDetail, IJob, JobStatus, getJobDescription} from "shared/actions/jobs/JobTypes"
import {LinearProgress} from "material-ui"

// Constants
const log = getLogger(__filename)

const baseStyles = createStyles({
	root: [
		FillWidth,
		makeTransition(['height','width','flex-grow','flex-shrink','flex-basis']),
		FlexColumnCenter,
		Ellipsis,
		{
			minWidth: rem(24),
			padding: '0 0.5rem',
		}
	],
	
	// Job Description
	label: [
		makeTransition(['height','width','flex-grow','flex-shrink','flex-basis']),
		FlexRowCenter,
		FillWidth,{
			text: [Ellipsis,{
				flex: '1 1 auto'
			}],
			time: [FlexAuto,{
				fontStyle: 'italic',
				fontWeight: 300
			}],
			icon: [FlexAuto,makePaddingRem(0,1,0,0)],
			progress: [FlexAuto, {
				completed: {
					fontSize: rem(1.1),
				},
				paddingLeft: rem(1)
			}]
		}
	],
	
	// Job Progress Bar
	progressBar: [
		//makeTransition(['opacity','padding-right','padding-left','min-height','max-height','height','width','flex-grow','flex-shrink','flex-basis']),
		makeTransition(),
		OverflowHidden,
		makePaddingRem(0.3,0,0.3,0),
		{
			flexGrow: 1,
			flexShrink: 0,
			flexBasis: rem(5),
			minHeight: 'auto',
			maxHeight: 'auto',
			minWidth: rem(5),
			height: rem(0.4),
			opacity: 1,
			
			hidden: [makePaddingRem(),{
				minWidth: 0,
				flexGrow: 0,
				flexShrink: 0,
				flexBasis: 0,
				margin: 0,
				opacity: 0,
				height: 0,
				maxHeight: 0,
				minHeight: 0
			}]
		}
	]
	
	
})


/**
 * IJobItemProps
 */
export interface IJobItemProps extends React.HTMLAttributes {
	theme?:any
	styles?:any
	
	job:IJob
	detail:IJobStatusDetail
}


/**
 * JobItem
 *
 * @class JobItem
 * @constructor
 **/

// If you have a specific theme key you want to
// merge provide it as the second param
@ThemedStyles(baseStyles,'jobs.item')
@Radium
@PureRender
export class JobItem extends React.Component<IJobItemProps,void> {
	
	render() {
		const {theme, styles,job,detail} = this.props
		
		return <div {...filterProps(this.props)} style={styles.root}>
		
			
			{/* Job Status */}
			<div style={[styles.label]}>
				
				{/*[{JobStatus[recentJob.status]}]&nbsp;*/}
				{/* Icon */}
				<div style={[styles.label.icon]}>
					<Icon iconSet="fa" iconName="building"/>
				</div>
				
				{/* Text */}
				<div style={[styles.label.text]}>
					{JobStatus[job.status]} - {getJobDescription(job)}
				</div>
				
				
				
				<div
					style={[
						styles.label.progress,
						styles.inProgress,
						job.status >= JobStatus.Completed && styles.label.progress.completed,
						job.status === JobStatus.Completed && styles.success,
						job.status === JobStatus.Failed && styles.failed,
					]}>
					{detail.status < JobStatus.Completed ?
						// In-Progress
						<div style={[
							styles.progressBar,
							
							// If the job is finished then hide the progress bar
							detail.status >= JobStatus.Completed && styles.progressBar.hidden
						]}>
							<LinearProgress mode={detail.progress > 0 ? 'determinate' : 'indeterminate'}
							                value={detail.progress * 100}
							                color={theme.palette.accent1Color}
							/>
						</div> : //`${Math.round(detail.progress * 100)}%` :
						
						// Completed / Failed
						<Icon
							style={[styles.label.icon]}
							iconSet="fa"
							iconName={detail.status === JobStatus.Completed ? 'check' : 'exclamation-circle'} />
						
					}
				</div>
				<div style={[styles.label.time]}>
					{Math.ceil((Date.now() - detail.createdAt) / 1000)}s
				</div>
				
				{/*<TimeAgo timestamp={recentDetail.updatedAt} />*/}
			</div>
			
			
		</div>
	}
	
}