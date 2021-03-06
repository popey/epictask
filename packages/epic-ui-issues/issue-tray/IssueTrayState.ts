import {Record,Map,List} from 'immutable'
import { Issue } from "epic-models"
import { reviveImmutable } from "epic-util"
import { IssuesPanelStateRecordDefaults } from "../issues-panel/IssuesPanelState"

export const IssueTrayStateRecord = Record({
	...IssuesPanelStateRecordDefaults,
	
	issues:List<Issue>(),
	repoIds:List<number>()
})


export class IssueTrayState extends IssueTrayStateRecord {
	
	static fromJS(o:any = {}) {
		return reviveImmutable(
			o,
			IssueTrayState,[],[]
		)
	}
	
	constructor(o:any = {}) {
		super(o)
	}
	
	repoIds:List<number>
	issues:List<Issue>
}
