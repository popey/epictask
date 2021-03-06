import {Map} from 'immutable'
import {Issue} from "./Issue"


export interface IIssueEditInlineConfig {
	index:number
	fromIssue:Issue
	fromIssueId:number
}


/**
 * Issue group shape
 */
export interface IIssueGroup {
	id:string
	issueIndexes:number[]
	size:number
	index:number
	groupBy: TIssueFieldsGroupable
	groupByItem: any
}

/**
 * Defines interface for group items - used for selector typing
 */
export interface IIssueItemGroupProps {
	group:IIssueGroup
}

/**
 * Get/Create group id
 *
 * @param groupBy
 * @param groupByItem
 * @returns {any}
 */
export function getIssueGroupId({groupBy,groupByItem}) {

	const objectId = (!groupByItem || groupByItem.length === 0) ?
		'' :
		(Array.isArray(groupByItem)) ?
			groupByItem.map(item => _.toLower(item.name))
				.sort()
				.join('-') :
			(groupByItem.title || groupByItem.name)



	return _.toLower(`${groupBy}-${objectId}`)
}

/**
 * Place holder for indexes
 *
 * @type {number}
 */
export const EditIssueInlineIndex = -2

/**
 * List item types
 */
export enum IssueListItemType {
	Issue = 1,
	EditIssueInline,
	Group
}

/**
 * All items for issue list,
 * created by selector
 */
export interface IIssueListItem<T extends Issue|IIssueGroup|IIssueEditInlineConfig> {
	type:IssueListItemType
	id:string|number
	item:T
}

export function isIssueListItem(item:IIssueListItem<any>):item is IIssueListItem<Issue> {
	return item.type === IssueListItemType.Issue
}

export function isGroupListItem(item:IIssueListItem<any>):item is IIssueListItem<IIssueGroup> {
	return item.type === IssueListItemType.Group
}

export function isEditInlineListItem(item:IIssueListItem<any>):item is IIssueListItem<IIssueEditInlineConfig> {
	return item.type === IssueListItemType.EditIssueInline
}



export function isGroupVisible(groupVisibility:Map<string,boolean>, id:string) {
	return groupVisibility.has(id) ? groupVisibility.get(id) : true
}

