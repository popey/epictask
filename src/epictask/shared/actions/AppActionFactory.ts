import {AutoWired,Inject, Container} from 'typescript-ioc'
import {ActionFactory,Action,ActionMessage} from 'typedux'
import {AppStateType} from 'shared/AppStateType'

import {AppKey, Dialogs, RepoKey,RepoTransientProps} from "shared/Constants"
import {IToastMessage} from 'shared/models/Toast'
import {ISettings} from 'shared/Settings'
import {Issue} from 'shared/models/Issue'
import {AppState} from './AppState'
import {User} from 'shared/models/User'
import {cloneObject} from 'shared/util'


const log = getLogger(__filename)

/**
 * Update the transient values on an issue
 *
 * @param issue
 * @param availableRepos
 */
function updateIssueTransients(issue,availableRepos) {

	const
		{repoId} = issue,
		availRepo = availableRepos.find(availRepo => availRepo.repoId === repoId)

	assert.ok(availRepo,'Unable to find repo with id: ' + repoId)

	// Assign all transient props
	Object.assign(issue,_.pick(availRepo.repo,RepoTransientProps))
}

@AutoWired
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
	setReady(ready:boolean) {}

	@Action()
	setDialogOpen(name:string,open:boolean) {}




	@Action()
	updateSettings(newSettings:ISettings) {}

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
	clearMessages() {}

	@Action()
	setMonitorState(monitorState:any) {}

	@Action()
	setUser(user:User) {}

}
