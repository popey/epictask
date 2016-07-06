

/**
 * Created by jglanz on 5/30/16.
 */

// Imports
import {Container} from 'typescript-ioc'
import * as React from 'react'
import {AppActionFactory} from '../../../shared/actions/AppActionFactory'
import {RepoActionFactory} from '../../../shared/actions/repo/RepoActionFactory'
import {RepoList,Icon,Button} from 'components'
import {Dialogs} from '../../../shared/Constants'
import * as Radium from 'radium'

// Key mapping tools
import * as KeyMaps from '../../../shared/KeyMaps'
const {CommonKeys:Keys} = KeyMaps
const {HotKeys} = require('react-hotkeys')

// Constants
const log = getLogger(__filename)
//const styles = require("./RepoPanel.css")


import { connect } from 'react-redux'


const styles = {
	cover: makeStyle(FlexColumn,FlexScale,Fill,{

	}),

	panel: makeStyle(FlexColumn,FlexScale,Fill,{

	}),

	drawerWrapper: makeStyle(FlexColumn,FlexScale,Fill,{
		minWidth: 200,
		position: 'relative'
	}),

	drawer: makeStyle(FlexColumn,FlexScale,FillWidth,{
		minWidth: 200,
		position: 'relative'
	}),

	header: makeStyle(Ellipsis,FlexRowCenter,FlexAuto),
	headerTitle: makeStyle(Ellipsis,FlexScale,{
		fontSize: themeFontSize(1.2),
		padding: '0.4rem 0.5rem'
	}),

	headerButton: makeStyle(FlexRowCenter,{
		height: rem(2)
	}),

	headerButtonLabel: {
		fontSize: rem(0.9),
		padding: '0 0.5rem 0 0'
	},

	headerButtonIcon: {
		fontSize: rem(1)
	},

	listContainer: makeStyle(FlexColumn,FlexScale, {
		overflow: 'hidden'
	})



}

/**
 * IRepoDrawerProps
 */
export interface IRepoPanelProps {
	theme?:any
}

function mapStateToProps(state) {
	return {
		theme: getTheme()
	}
}



/**
 * RepoPanel
 *
 * @class RepoPanel
 * @constructor
 **/

@connect(mapStateToProps)
@Radium
export class RepoPanel extends React.Component<IRepoPanelProps,any> {


	repoActions:RepoActionFactory = Container.get(RepoActionFactory)
	appActions:AppActionFactory = Container.get(AppActionFactory)

	constructor(props, context) {
		super(props, context)
	}


	onBlur = () => this.repoActions.clearSelectedRepos()

	onAddRepoClicked = () => this.appActions.setDialogOpen(Dialogs.RepoAddDialog,true)

	keyHandlers = {

	}

	render() {
		const
			{theme} = this.props,
			{repoPanel:themeStyle} = theme,
			s = mergeStyles(styles,themeStyle),
			panelStyle = makeStyle(styles.panel,themeStyle.root),
			drawerStyle = makeStyle(styles.drawer,themeStyle.root),
			headerStyle = makeStyle(styles.header,themeStyle.header),
			headerButtonStyle = makeStyle(styles.headerButton,themeStyle.headerButton,{
				':hover': themeStyle.headerButtonHover
			})

		return (
			<HotKeys handlers={this.keyHandlers} style={styles.drawerWrapper} onBlur={this.onBlur}>
				<div style={panelStyle}>
					<div style={headerStyle}>
						<div style={s.headerTitle}>Repositories</div>
						<Button style={headerButtonStyle} onClick={this.onAddRepoClicked}>
							<Icon style={styles.headerButtonIcon} iconSet='fa' iconName='plus'/>
						</Button>
					</div>
					<div style={styles.listContainer}>
						<RepoList />
					</div>
				</div>
			</HotKeys>
		)

	}

}