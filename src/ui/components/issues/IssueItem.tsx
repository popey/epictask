


// Imports
import * as moment from 'moment'
import * as React from 'react'

import {PureRender, Renderers, Avatar} from '../common'
import {connect} from 'react-redux'
import filterProps from 'react-valid-props'
import {IssueLabelsAndMilestones} from './IssueLabelsAndMilestones'
import {Issue} from 'shared/models'

import {IIssueGroup} from 'shared/actions/issue/IIssueGroup'
import { selectedIssueIdsSelector } from "shared/actions/issue/IssueSelectors"
import { createDeepEqualSelector } from "shared/util/SelectorUtil"
import {IssueStateIcon} from 'ui/components/issues/IssueStateIcon'


interface IIssueItemProps extends React.HTMLAttributes<any> {
	styles:any
	index:number
	issues:Issue[]
	issue?:Issue
	issuesGrouped?:IIssueGroup[]
	groupBy:string
	onSelected:(event:any, issue:Issue) => void
	isSelected?:boolean
	isSelectedMulti?:boolean
}

// State is connected at the item level to minimize redraws for the whole issue list
@connect(createDeepEqualSelector(
	[
		selectedIssueIdsSelector,
		(state,props:IIssueItemProps):Issue[] => props.issues,
		(state,props:IIssueItemProps):number => props.index
	],
	(selectedIssueIds:number[],issues:Issue[],index:number) => {
		const
			issue = issues && issues[index],
			isSelected = issue && selectedIssueIds && selectedIssueIds.includes(issue.id)
		
		return {
			isSelected,
			issue,
			isSelectedMulti: isSelected && selectedIssueIds.length > 1
		}
	}
))
@PureRender
class IssueItem extends React.Component<IIssueItemProps,void> {


	
	render() {
		const
			{props} = this,
			{styles,onSelected,issue,index,isSelected,isSelectedMulti} = props
			
			
		if (!issue)
			return React.DOM.noscript()

		const
			{labels} = issue,

			issueStyles = makeStyle(
				styles.issue,
				isSelected && styles.issue.selected,
				(isSelectedMulti) && styles.issue.multi
			),
			issueTitleStyle = makeStyle(
				styles.issueTitle,
				isSelected && styles.issueTitleSelected,
				isSelectedMulti && styles.issueTitleSelectedMulti
			)

		return <div {...filterProps(props)} id={`issue-item-${issue.id}`}
		                                    style={issueStyles}
		                                    className={'animated fadeIn ' + (isSelected ? 'selected' : '')}
		                                    onClick={(event) => onSelected(event,issue)}>

			{/*<div style={styles.issueMarkers}></div>*/}
			<div style={styles.issueDetails}>

				<div style={styles.issueRepoRow}>
					<div style={styles.issueRepo}>
						<span style={styles.issueNumber}>
							#{issue.number}&nbsp;&nbsp;
						</span>
						<Renderers.RepoName repo={issue.repo} style={styles.issueRepo}/>
						
					</div>

					{/* ASSIGNEE */}
					<Avatar user={issue.assignee}
					        style={styles.issue.avatar}
					        labelPlacement='before'
					        labelStyle={styles.username}
					        avatarStyle={styles.avatar}/>

				</div>


				<div style={styles.issueTitleRow}>
					<div style={issueTitleStyle}>{issue.title}</div>
					<div style={styles.issueTitleTime}>{moment(issue.updated_at).fromNow()}</div>
				</div>

				<div style={styles.issueBottomRow}>

					{/* LABELS */}
					<IssueLabelsAndMilestones
						showIcon
						labels={labels}
						milestones={issue.milestone ? [issue.milestone] : []}
						style={styles.issueLabels}
					    labelStyle={styles.issueLabels.label}
					/>


					<IssueStateIcon state={issue.state}/>
					{/*/!* MILESTONE *!/*/}
					{/*{issue.milestone && <div style={styles.issueMilestone}>*/}
						{/*{issue.milestone.title}*/}
					{/*</div>}*/}
				</div>
			</div>
		</div>

	}
}

export default IssueItem