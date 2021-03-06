

import { makePromisedComponent, toJSON} from "epic-util"
import {Issue,Comment} from 'epic-models'
import { List } from "immutable"
import { getUIActions, getIssueActions } from "epic-typedux/provider"
import { CommonKeys } from "epic-command-manager"
import { acceptHot } from "epic-global"

const
	log = getLogger(__filename)



/**
 * Routes
 */
RouteRegistryScope.Register(
	
	/**
	 * Issue Edit Dialog
	 */
	{
		name: 'IssueTray',
		uri: 'dialog/issue-tray',
		showDevTools: false,
		provider: makePromisedComponent((resolver: TComponentResolver) =>
			require.ensure([], function (require: any) {
				resolver.resolve(require('epic-ui-issues/issue-tray').IssueTray)
			}))
	},
	
	/**
	 * Issue View Dialog
	 */
	{
		name: 'IssueViewDialog',
		uri: 'dialog/issue-view/:issueKey',
		makeURI(issue: Issue = null) {
			return `dialog/issue-view/${!issue ? -1 : Issue.makeIssueId(issue)}`
		},
		showDevTools: false,
		provider: makePromisedComponent((resolver: TComponentResolver) =>
			require.ensure([], function (require: any) {
				resolver.resolve(require('epic-ui-issues/issue-view').IssueViewDialog)
			}))
		
	},
	
	/**
	 * Issue Edit Dialog
	 */
	{
		name: 'IssueEditDialog',
		uri: 'dialog/issue-edit/:issueId',
		makeURI(issue: Issue = null) {
			return `dialog/issue-edit/${!issue ? -1 : Issue.makeIssueId(issue)}`
		},
		showDevTools: false,
		provider: makePromisedComponent((resolver: TComponentResolver) =>
			require.ensure([], function (require: any) {
				resolver.resolve(require('epic-ui-issues/issue-edit').IssueEditDialog)
			}))
		
		
	},
	
	/**
	 * Issue patch dialog
	 */
	{
		name: 'IssuePatchDialog',
		uri: 'dialog/issue-patch',
		makeURI(mode: TIssuePatchMode, issues: List<Issue>) {
			const
				issueKeys = toJSON(
					issues.map(issue => Issue.makeIssueId(issue)).toJS()
				)
			
			return `dialog/issue-patch?mode=${mode}&issueKeys=${encodeURIComponent(issueKeys)}`
		},
		showDevTools: false,
		provider: makePromisedComponent((resolver: TComponentResolver) =>
			require.ensure([], function (require: any) {
				resolver.resolve(require('epic-ui-issues/issue-patch').IssuePatchDialog)
			}))
		
		
	},
	
	/**
	 * Comment edit dialog
	 */
	{
		name: 'CommentEditDialog',
		showDevTools: false,
		uri: 'dialog/comment-edit/:issueId/:commentId',
		makeURI(issue: Issue, comment: Comment = null) {
			return `dialog/comment-edit/${Issue.makeIssueId(issue)}/${
				!comment ? -1 : Comment.makeCommentId(comment)}`
		},
		provider: makePromisedComponent((resolver: TComponentResolver) =>
			require.ensure([], function (require: any) {
				resolver.resolve(require('epic-ui-issues/comment-edit/CommentEditDialog').CommentEditDialog)
			}))
		
	}
)

/**
 * Register Views
 */
Scopes.Views.Register({
	id: "IssuesPanel",
	name: "Issues Panel",
	type: "IssuesPanel",
	defaultView: true,
	provider: makePromisedComponent(resolver => require.ensure([],function(require:any) {
		const
			modId = require.resolve('epic-ui-issues/issues-panel'),
			mod = __webpack_require__(modId)
		
		log.debug(`Loaded issues panel module`,mod.id,modId,mod)
		resolver.resolve(mod.IssuesPanel)
	}))
})



Scopes.Commands.Register({
	id: 'NewIssueGlobal',
	type: CommandType.Global,
	name: "New Issue",
	execute: (cmd, event) => getIssueActions().newIssueWindow(),
	defaultAccelerator: "Control+Alt+n",
	hidden: true
},{
	id: 'NewIssue',
	type: CommandType.App,
	name: "New Issue",
	defaultAccelerator: "CommandOrControl+n",
	execute: (cmd, event) => getIssueActions().newIssueWindow()
},{
	id: 'ToggleIssuesPanelView',
	type: CommandType.Container,
	name: "Toggle view horizontal/vertical",
	defaultAccelerator: 'CommandOrControl+l'
},{
	id: 'NewComment',
	type: CommandType.Container,
	name: "New Comment",
	defaultAccelerator: 'c'
},{
	id: 'ClearFilterSort',
	type: CommandType.Container,
	name: "Clear Filter & Sort",
	defaultAccelerator: 'Alt+c'
},{
	id: 'IssueViewer',
	type: CommandType.Container,
	name: "View issue in separate window",
	defaultAccelerator: 'v'
},{
	id: 'LabelIssues',
	type: CommandType.Container,
	name: "Label selected issues",
	defaultAccelerator: 't'
},{
	id: 'MilestoneIssues',
	type: CommandType.Container,
	name: "Milestone selected issues",
	defaultAccelerator: 'm'
}, {
	id: 'AssignIssues',
	type: CommandType.Container,
	name: "Assign selected issues",
	defaultAccelerator: 'a'
}, {
	id: 'FindIssues',
	type: CommandType.Container,
	name: "Find & filter issues",
	defaultAccelerator: 'CommandOrControl+f'
}, {
	id: 'ToggleFocusIssues',
	type: CommandType.Container,
	name: "Toggle focus",
	defaultAccelerator: CommonKeys.Space
}, {
	id: 'CloseIssues',
	type: CommandType.Container,
	name: "Close selected issues",
	defaultAccelerator: CommonKeys.Delete
}, {
	id: 'NewIssueInline',
	type: CommandType.Container,
	name: "New issue inline",
	defaultAccelerator: CommonKeys.Enter
})


acceptHot(module)