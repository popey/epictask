import {ActionFactory,Action,ActionMessage} from 'typedux'
import {AppStateType} from 'shared/AppStateType'
import {AppKey} from "shared/Constants"
import {IToastMessage} from 'shared/models/Toast'
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
	setStateType(stateType:AppStateType) {}

	@Action()
	setError(err:Error) {}

	@Action()
	addMessage(message:IToastMessage) {}

	@Action()
	addErrorMessage(err:Error) {}

	@Action()
	removeMessage(id:string) {}

	@Action()
	setMonitorState(monitorState:any) {}

	@Action()
	setUser(user:User) {}

}
