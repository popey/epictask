import * as React from 'react'
import {Dialog,AutoComplete,FlatButton} from 'material-ui'

const log = getLogger(__filename)
import {RepoActionFactory,AuthActionFactory,TRepoState,TAuthState} from 'epictask/app/actions'
import {RepoPanel,IssuesPanel,IssueDetailPanel} from 'components'
import {Repo} from 'epictask/shared'
import {getStore} from '../../store'
import {Page} from '../common'
import {AppActionFactory} from '../../actions/AppActionFactory'
import {AppStateType} from '../../../shared/AppStateType'
import {connect} from 'react-redux'
import * as SplitPane from 'react-split-pane'
const {Flexbox,FlexItem} = require('flexbox-react')

const styles = require('./HomePage.css')
const repoActions = new RepoActionFactory()
const authActions = new AuthActionFactory()
const appActions = new AppActionFactory()

interface IHomeProps {
	repo?:Repo
	addRepoDialog?:boolean

}

function mapToProps(state) {
	return {
		repo: repoActions.state.repo,
		addRepoDialog: appActions.state.stateType === AppStateType.RepoAdd
	}
}

/**
 * The root container for the app
 */
@connect(mapToProps)
export class HomePage extends React.Component<IHomeProps,any> {

	constructor(props, context) {
		super(props, context)
	}

	handleClose = () => {
		appActions.setStateType(AppStateType.Home)
	}

	render() {
		//const repos = repoActions.state.repos || []

		const addRepoActions = [
			<FlatButton
				label="Cancel"
				primary={true}
				onTouchTap={this.handleClose}
			/>,
			<FlatButton
				label="Submit"
				primary={true}
				disabled={true}
				onTouchTap={this.handleClose}
			/>,
		]

		return (
			<Page>
				{/*Login here, <Link to="/repos">Goto Repos</Link>*/}
				{/*Repo list*/}
				<SplitPane split="vertical" className={styles.splitter}>
					<RepoPanel />
					<IssuesPanel />
				</SplitPane>

				<Dialog
					title="add a repo..."
					modal={true}
					open={this.props.addRepoDialog}
				    actions={addRepoActions}
				>
					Add repo here
				</Dialog>
			</Page>
		)
	}
}

