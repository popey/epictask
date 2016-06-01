import * as React from 'react'
//import {AppBar} from "material-ui";
import {IAuthState} from '../actions/auth/AuthState'
import {AuthActionFactory} from '../actions/auth/AuthActionFactory'
import {getStore} from '../store/AppStore'


const styles = require('./HeaderComponent.css')
const log = getLogger(__filename)
const authActions = new AuthActionFactory()
const store = getStore()


export interface IHeaderProps {
	className:string
}

/**
 * The app header component, title/logo/settings
 */
@CSSModules(styles)
export class HeaderComponent extends React.Component<IHeaderProps,any> {

	/**
	 * Create a new header component
	 *
	 * @param props
	 * @param context
	 */
	constructor(props, context) {
		super(props, context)
	}


	render() {
		const state = authActions.state
		const theme = getTheme()

		const {titleStyle,style} = theme.navBar


		return <div className={`${this.props.className}`} style={style}>
			<div  styleName="logo">
				<img src={require('assets/images/epictask-logo.png')}/>
				{/*// <div styleName="title" style={titleStyle}>*/}
					{/**/}
				{/*</div>*/}
			</div>
		</div>
	}
}


