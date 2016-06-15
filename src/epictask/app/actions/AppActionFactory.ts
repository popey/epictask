import {ActionFactory,Action,ActionMessage} from 'typedux'
import {AppStateType} from 'shared/AppStateType'
import {AppKey, Dialogs, RepoKey} from "shared/Constants"
import {IToastMessage} from 'shared/models/Toast'
import {Issue} from 'shared/models/Issue'
import {AppState} from './AppState'
import {User} from 'shared/models/User'

const log = getLogger(__filename)

export class AppActionFactory extends ActionFactory<any,ActionMessage<typeof AppState>> {

	constructor() {
		super(AppState)
	}

	leaf():string {
		return AppKey;
	}

	@Action()
	setTheme(theme:any) {}

	@Action()
	setDialogOpen(name:string,open:boolean) {}

	@Action()
	setEditingIssue(issue:Issue) {}

	@Action()
	updateEditingIssue(props:any) {
		return (dispatch,getState) => {
			const issue = this.state.editingIssue
			if (!issue) return

			this.setEditingIssue(_.assign(_.cloneDeep(issue),props) as any)
		}
	}

	@Action()
	newIssue() {
		return (dispatch,getState) => {
			const
				actions = this.withDispatcher(dispatch,getState),
				dialogName = Dialogs.IssueEditDialog


			if (actions.state.dialogs[dialogName]) {
				log.info('Dialog is already open',dialogName)
				return
			}

			const {availableRepos,selectedIssues} = getState().get(RepoKey)
			const repoId = (selectedIssues && selectedIssues.length) ?
				selectedIssues[0].repoId :
				(availableRepos && availableRepos.length) ? availableRepos[0].repoId :
						null

			if (!repoId) {
				actions.addErrorMessage(new Error('You need to add some repos before you can create an issue. duh...'))
				return
			}

			const issue = new Issue({repoId})

			actions.setEditingIssue(issue)
			actions.setDialogOpen(dialogName,true)
		}

	}

	@Action()
	setStateType(stateType:AppStateType) {}

	@Action()
	setError(err:Error) {}

	@Action()
	addMessage(message:IToastMessage) {}

	@Action()
	addErrorMessage(err:Error|string) {}

	@Action()
	removeMessage(id:string) {}

	@Action()
	setMonitorState(monitorState:any) {}

	@Action()
	setUser(user:User) {}

}
