import { Map, Record, List } from "immutable"
import { reviveImmutable } from "epic-global"
import {
	IIssueEditInlineConfig,
	DefaultIssueCriteria,
	IssuesEvent,
	Issue,
	Comment,
	Label,
	Milestone
} from "epic-models"
import { toPlainObject, excludeFilterConfig, excludeFilter } from "typetransform"




/**
 * Declare the interface first
 */
declare global {
	
	
	
	// Expose interface
	interface IIssuesPanelState  {
		issues?:List<Issue>
		comments?:List<Comment>
		events?:List<IssuesEvent>
		
		criteria?:IIssueCriteria
		
		searchText?:string
		
		groupVisibility?:Map<string,boolean>
		
		selectedIssueIds?:List<number>
		focusedIssueIds?:List<number>
		
		saving?:boolean
		saveError?: Error
		
		itemIndexes?:List<number>
		
		editInlineConfig?:IIssueEditInlineConfig
		editingIssue?:Issue
		
	}
}



const
	log = getLogger(__filename)

export type TIssueActivity = {
	events:List<IssuesEvent>
	comments:List<Comment>
	selectedIssue:Issue
}

/**
 * Issue sort and filter type
 */
export type TIssueSortAndFilter = {issueFilter:IIssueFilter,issueSort:IIssueSort}

/**
 * Patch modes
 */
export const IssuePatchModes = {
	Label:Label.$$clazz,
	Milestone:Milestone.$$clazz,
	Assignee:'Assignee',
}

/**
 * Immutable record
 *
 * @type {Record.Class}
 */
export const IssuesPanelStateRecord = Record({
	issues:List<Issue>(),
	
	comments:List<Comment>(),
	events:List<IssuesEvent>(),
	
	groupVisibility:Map<string,boolean>(),
	
	selectedIssueIds:List<number>(),
	
	criteria: DefaultIssueCriteria,
	
	itemIndexes: List<number>(),
	
	searchText: '',
	
	editInlineConfig:null,
	editingIssue:null,
	
	saveError: null,
	saving: false,
} as IIssuesPanelState)

@ModelRegistryScope.Register
export class IssuesPanelState extends IssuesPanelStateRecord implements IIssuesPanelState {
	
	static fromJS(o:any = {}) {
		return reviveImmutable(
			o,
			IssuesPanelState,
			['issues','comments','events','selectedIssueIds'],
			['groupVisibility']
		)
	}
	
	toJS() {
		return toPlainObject(this,excludeFilterConfig(
			...excludeFilter(
				'activityLoading',
				'issues',
				'events',
				'comments',
				'itemIndexes',
				/^edit/,
				/^sav/
			)))
	}
	
	issues:List<Issue>
	comments:List<Comment>
	events:List<IssuesEvent>
	
	criteria:IIssueCriteria
	searchText:string
	
	itemIndexes:List<number>
	
	groupVisibility:Map<string,boolean>
	
	selectedIssueIds:List<number>
	
	saving:boolean
	saveError: Error
	
	editInlineConfig:IIssueEditInlineConfig
	editingIssue:Issue
	
	constructor(o:any = {}) {
		super(o)
	}
}

export default IssuesPanelState