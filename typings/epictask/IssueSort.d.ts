

declare type TIssueSortDirection = 'asc'|'desc'

declare type TIssueFieldsGroupable = 'none'|'milestone'|'assignee'|'labels'

declare type TIssueFieldsSortable = 'updated_at'|'created_at'|'repoId'|'title'|'assignee.login'



declare interface IIssueSort {
	// fields to sort by
	fields:TIssueFieldsSortable[]
	
	// Label Urls
	direction:TIssueSortDirection
	
	// Group by field
	groupBy: TIssueFieldsGroupable
	
	// Group by field
	groupByDirection: TIssueSortDirection
	
}
