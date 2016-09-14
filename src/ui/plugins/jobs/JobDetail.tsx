
// Imports
import * as React from 'react'
import * as Radium from 'radium'
import {PureRender} from 'ui/components/common'
import {ThemedStyles} from 'shared/themes/ThemeManager'
import {LinearProgress} from "material-ui"

import {JobActionFactory, TJobIMap} from 'shared/actions/jobs/JobActionFactory'
import {getJobDescription, IJobStatusDetail, IJob, IJobLog, JobStatus} from "shared/actions/jobs/JobTypes"
import {TimeAgo} from "ui/components/common/TimeAgo"
import {
	FlexColumnCenter, FlexScale, makePaddingRem, rem, FillHeight, createStyles, FillWidth,
	FlexRowCenter, Ellipsis
} from "shared/themes"
import {Icon} from "ui/components/common/Icon"
import {getJobStatusIcon, getJobStatusColors} from "ui/plugins/jobs/JobItem"

// Constants
const log = getLogger(__filename)

const baseStyles = createStyles({
	root: [FlexColumnCenter, FillHeight, FillWidth, FlexScale, {
		hasJobs: {
			borderLeftStyle: 'solid',
			borderLeftWidth: rem(0.1)
		}
	}],
	header: [FlexRowCenter,FillWidth,makePaddingRem(1,1,1,1),{
		status: [makePaddingRem(0,0,0,1),{
			fontWeight:500,
			textTransform: 'uppercase'
		}],
		description: [Ellipsis,FlexScale],
		progress: [FlexScale,makePaddingRem(0,1.5),{
			flex: '0 0 25rem'
		}],
		time: [FlexAuto, {
			fontStyle: 'italic',
			fontWeight: 300
		}],
		icon: [FlexAuto,makePaddingRem(0,1,0,1)]
	}],
	logs: [FlexScale,FillWidth,OverflowAuto,{
		
		levels: [{
			warn: {
				fontWeight: 500
			},
			error: {
				fontWeight: 700,
				fontStyle: 'italic'
			}
		}],
		
		entry: [FlexColumn,FlexAuto,makeTransition('background-color'),{
			cursor: 'pointer',
			
			
			row: [
				FlexRowCenter,
				FlexAuto,
				OverflowHidden,
				makeTransition(['background-color','height','max-height','min-height','flex-basis','flex-grow','flex-shrink']),
				{
					margin: '0 0.3rem',
					flexGrow: 0,
					flexShrink: 0,
					flexBasis: 'auto',
					hidden: [{
						flexBasis: 0
					}]
				}
			],
			
			// Hovered style - applied to kids when hovering
			hovered: {
				transform: 'scale(1.1)'
			},
			
			level: [Ellipsis,makeTransition('transform'),{
				paddingLeft: rem(0.5),
				flex: '0 0 7rem'
				
			}],
			message: [FlexScale, makeTransition('transform'),makePaddingRem(1,1),{
				transformOrigin: 'left center'
			}],
			
			time: [Ellipsis,makeTransition('transform'),{
				width: rem(12),
				paddingRight: rem(0.5),
				fontWeight: 300,
				fontSize: rem(1.1),
				textAlign: 'right',
				transformOrigin: 'right center'
			}],
			
			details: [FlexScale,{overflowX: 'auto'}],
			
			divider: [{
				borderBottomWidth: rem(0.2),
				borderBottomStyle: 'solid'
			}]
		}]
	}]
})


/**
 * IJobDetailProps
 */
export interface IJobDetailProps extends React.HTMLAttributes<any> {
	theme?:any
	styles?:any
	job:IJob
	jobs?: TJobIMap
	detail:IJobStatusDetail
	selectedLogId:string
}


/**
 * JobDetail
 *
 * @class JobDetail
 * @constructor
 **/

// If you have a specific theme key you want to
// merge provide it as the second param
@ThemedStyles(baseStyles,'jobs','jobs.item','jobs.detail')
@PureRender
export class JobDetail extends React.Component<IJobDetailProps,any> {
	
	/**
	 * Render job details
	 *
	 * @returns {any}
	 */
	render() {
		
		const
			{theme, styles, job, jobs,detail,selectedLogId} = this.props,
			logs = [],//detail && detail.logs,
			statusColors = getJobStatusColors(detail,styles)
		
		const levelStyle = (log:IJobLog) =>
			styles.logs.levels['WARN' === log.level ? 'warn' : 'ERROR' === log.level ? 'error' : 'DEBUG' === log.level ? 'success' : 'info']
		
		
		return <div style={[styles.root, jobs && jobs.size && styles.root.hasJobs ]}>
			
			{/* No Job Selected */}
			{!job && <div style={styles.root}>
				<div>Select a Job</div>
			</div>}
			
			{/* Job is selected */}
			{job && <div style={styles.root}>
				
				{/* HEADER */}
				<div style={[styles.header]}>
					
					{/*<Icon*/}
						{/*style={[*/}
								{/*styles.header.icon,*/}
								{/*...statusColors*/}
							{/*]}*/}
						{/*iconSet="fa"*/}
						{/*iconName={getJobStatusIcon(detail)} />*/}
					
					<div style={styles.header.description}>{getJobDescription(job)}</div>
				
					{detail.status < JobStatus.Completed &&
						<div style={styles.header.progress}>
							<LinearProgress mode={detail.progress > 0 ? 'determinate' : 'indeterminate'}
							                value={detail.progress * 100}
							                color={theme.palette.accent1Color}
							/>
						</div>
						
						
						
					}
						
					
					<div style={styles.header.time}>
						{Math.ceil((Date.now() - detail.createdAt) / 1000)}s
					</div>
					<div style={[styles.header.status,...statusColors]}>
						{JobStatus[job.status]}
					</div>
					
					
				</div>
				
				{/* LOGS */}
				<div style={styles.logs}>
					
					{logs && logs.map((log:IJobLog,index) => { //_.uniqBy(logs,'id').map((log:IJobLog,index) => {
						const
							isError = log.level === 'ERROR',
							errorDetails = log.errorDetails,
							errorStyle = isError && levelStyle(log),
							logKey = log.id,
							selected = selectedLogId === log.id,
							hoverStyle =
								(selected || Radium.getState(this.state,logKey,':hover')) &&
								styles.logs.entry.hovered
							
						
						
						//Log Entry Row
						return <div key={logKey}
						            onClick={() => !selected && Container.get(JobActionFactory).setSelectedLogId(log.id)}
						            style={[
													styles.logs.entry,
													index < logs.size - 1 && styles.logs.entry.divider
												]}>
							<div style={[styles.logs.entry.row]}>
								<div style={[styles.logs.entry.level,hoverStyle,levelStyle(log)]}>
									{log.level}
								</div>
								<div style={[styles.logs.entry.message,hoverStyle,errorStyle]}>
									{log.message}
								</div>
								<div style={[styles.logs.entry.time,errorStyle]}>
									<TimeAgo timestamp={log.timestamp}/>
								</div>
							</div>
							
							{/* Error stack details */}
							{isError && errorDetails && <div style={[styles.logs.entry.row, !selected && styles.logs.entry.row.hidden ]}>
								<div style={[styles.logs.entry.level]}>
									{/* Empty spacing place holder */}
								</div>
								<pre style={[styles.logs.entry.details]}>
									<div>Error details: </div>
									<div>{errorDetails.message}</div>
									<div>{errorDetails.stack}</div>
									{/*{errorDetails.stack.map(frame => <div>*/}
										{/*<span>*/}
											{/*<span>{frame.functionName}</span>*/}
											{/*at*/}
											{/*<span>{frame.fileName}</span>*/}
											{/*:(*/}
											{/*<span>{frame.lineNumber}</span>:*/}
											{/*<span>{frame.columnNumber}</span>*/}
											{/*)*/}
										{/*</span>*/}
									{/*</div>)}*/}
								</pre>
							</div>}
						</div>
					})}
				</div>
			</div>}
		</div>
	}
	
}