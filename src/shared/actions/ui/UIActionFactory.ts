import {AutoWired,Inject, Container} from 'typescript-ioc'
import * as uuid from 'node-uuid'
import {ActionFactory,ActionReducer,Action,ActionMessage} from 'typedux'
import {List} from 'immutable'
import {UIKey} from "shared/Constants"
import {IToastMessage, ToastMessageType} from 'shared/models/Toast'
import {UIState} from 'shared/actions/ui/UIState'
import {Dialogs} from 'shared/Constants'



export function makeToastMessage(opts:any) {
	return Object.assign({},opts,{
		id:uuid.v4(),
		createdAt:Date.now(),
		content: opts.content || 'No content provided - DANGER will robinson'
	})
}


@AutoWired
export class UIActionFactory extends ActionFactory<any,ActionMessage<UIState>> {

	constructor() {
		super(UIState)
	}

	leaf():string {
		return UIKey;
	}


	@ActionReducer()
	clearMessages() {
		return (state:UIState) => state.set('messages',List())
	}


	@ActionReducer()
	addMessage(message:IToastMessage) {
		return (state:UIState) => state.messages
			.findIndex(item => _.toJS(item).id === message.id) > -1 ?
			state :
			state.update('messages',messages => {
				messages = messages.push(message)
				if (messages.size > 5)
					messages = messages.splice(0,messages.size - 5)

				return messages
			})
	}


	addErrorMessage(err:Error|string) {
		err = ((_.isString(err)) ? new Error(err) : err) as Error
		const message = makeToastMessage({
			type: ToastMessageType.Error,
			content: err.message || err.toString(),
			stack: err.stack
		})
		return this.addMessage(message)
	}

	@ActionReducer()
	removeMessage(id:string) {
		return (state:UIState) => state.set(
			'messages',
			state.messages.filter(msg => _.toJS(msg).id !== id)
		)
	}


	showAddRepoDialog() {
		return this.setDialogOpen(Dialogs.RepoAddDialog,true)
	}


	@ActionReducer()
	setTheme(theme:any) {
		return (state:UIState) => state.set('theme',theme)
	}

	@ActionReducer()
	setDialogOpen(name:string,open:boolean) {
		return (state:UIState) => state.set(
			'dialogs',
			state.dialogs.set(name,open)
		)
	}

	@ActionReducer()
	closeAllDialogs() {
		return (state:UIState) => state.update('dialogs',(dialogs) => dialogs.clear())
	}




}

export default UIActionFactory