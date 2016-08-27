import * as React from 'react'
const log = getLogger(__filename)

import {RaisedButton,FlatButton,FontIcon} from 'material-ui'
import {AuthActionFactory} from '../../../shared/actions/auth/AuthActionFactory'
import {Page} from './Page'
import {GitHubConfig} from "shared/Constants"

const styles = {
	page: makeStyle(FlexColumnCenter,FlexScale,{
		// WebkitAppRegion: 'drag'
	}),

	panel: makeStyle(FlexAuto,FlexColumn,{

	}),

	logo: makeStyle({
		maxWidth: '80vw',
		height: 'auto',
		paddingBottom: '5vh'
	}),

	label: makeStyle({
		fontSize: '2rem',
		textTransform: 'none'
	}),

	icon:  makeStyle({
		paddingRight: '2rem',
		fontSize: '6rem',
		textTransform: 'none'
	})
}



/**
 * The root container for the app
 */
export class LoginPage extends React.Component<any,any> {

	constructor(props, context) {
		super(props, context)
	}


	startAuth = () => {
		const authActions = Container.get(AuthActionFactory)
		
		authActions.setAuthenticating(true)
		
		const GitHubOAuthWindow = require('main/auth/GitHubOAuthWindow').default
		
		// Create a new auth request/window
		const authRequest = new GitHubOAuthWindow(GitHubConfig)
		
		// Start authentication
		authRequest.startRequest(function(err,token) {
			authActions.setAuthResult(err,token)
		})
	}
	
	render() {
		const theme = getTheme()
		const {palette} = theme

		const pageStyle = makeStyle(styles.page,{
			backgroundColor: palette.accent4Color,
			color: palette.accent4ColorText
		})



		const buttonStyle = makeStyle(styles.label,{
			border: `0.1rem solid ${palette.accent4ColorText}`,
			borderRadius: '0.2rem',
			padding: '1rem',
			height: 'auto',
			// backgroundColor: 'transparent',
			color: palette.textColor
		})

		return (
			<Page style={pageStyle} id='loginPage'>
				{/*Login here, <Link to="/repos">Goto Repos</Link>*/}
				<div style={styles.panel}>
					<img style={styles.logo}
					     src={require('assets/images/epictask-logo-rainbow.png')}/>
					<FlatButton
						style={buttonStyle}
						hoverColor={palette.accent3Color}
						onClick={this.startAuth}>

						<div style={makeStyle(FlexRowCenter)}>
							<span className='fa' style={styles.icon}>{'\uf09b'}</span>
							<span style={styles.label}>Login</span>
						</div>
					</FlatButton>

				</div>
			</Page>
		)
	}
}


