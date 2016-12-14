

// Imports

import {Icon,Button} from "epic-ui-components"
import {RepoList} from './RepoList'

// Key mapping tools
//import * as KeyMaps from 'epic-command-manager'
import {UIActionFactory} from "epic-typedux"

import {ThemedStyles, createThemedStyles} from "epic-styles"



import {getBuiltInToolId, BuiltInTools} from "epic-ui-components"
import {
	CommandComponent, ICommandComponent, CommandRoot,
	CommandContainerBuilder
} from  "epic-command-manager-ui"
import { getUIActions, getRepoActions } from "epic-typedux"
import { ContainerNames,CommonKeys as Keys } from "epic-command-manager"





// Constants
const log = getLogger(__filename)

const baseStyles:any = createStyles({
	cover: makeStyle(FlexColumn,FlexScale,Fill,{

	}),

	panel: [makeTransition(['opacity']),FlexColumn,FlexScale,Fill,{
		opacity: 1
	}],

	
	drawerWrapper: [makeTransition(['width','minWidth','maxWidth']), FlexColumn,FlexScale,Fill,{
		minWidth: rem(20),
		position: 'relative',

		
	}],

	drawer: makeStyle(FlexColumn,FlexScale,FillWidth,{
		minWidth: 200,
		position: 'relative'
	}),

	header: [Ellipsis,FlexRowCenter,FlexAuto, {
		title: [Ellipsis,FlexScale,{
			fontSize: themeFontSize(1.2),
			padding: '0.4rem 0.5rem'
		}],
		
		button: [FlexRowCenter,{
			height: rem(2),
			borderRadius: 0,
			
			label: {
				fontSize: rem(0.9),
				padding: '0 0.5rem 0 0'
			},
			icon: {
				fontSize: rem(1)
			},
		}]
	}],

	listContainer: [FlexColumn,FlexScale, {
		overflow: 'hidden'
	}]

})

/**
 * IRepoDrawerProps
 */
export interface IRepoPanelProps extends IToolProps {
	theme?:any
	styles?:any
}

function getHeaderControls() {
	const styles = createThemedStyles(baseStyles,['repoPanel'])
	return [
		<Button key="AddRepoButton"
						tabIndex={-1}
		        style={styles.header.button}
		        onClick={(event:React.MouseEvent<any>) => {
							event.preventDefault()
							event.stopPropagation()
					
							log.debug(`add repo click`,event)
					
							getUIActions().openSheet(RouteRegistryScope.get('RepoImport').uri)
					
						}}>
			<Icon style={styles.header.button.icon} iconSet='fa' iconName='plus'/>
		</Button>
	]
}



/**
 * RepoPanel
 *
 * @class RepoPanel
 * @constructor
 **/
@ToolRegistryScope.Register({
	id:getBuiltInToolId(BuiltInTools.RepoPanel),
	defaultLocation: ToolPanelLocation.Left,
	label:'Repositories',
	getHeaderControls,
	buttonLabel: 'Repos'
})
@CommandComponent()
@ThemedStyles(baseStyles,'repoPanel')
export class RepoPanel extends React.Component<IRepoPanelProps,any> implements ICommandComponent {
	
	commandItems = (builder:CommandContainerBuilder) =>
		builder
			.make()
		
	readonly commandComponentId:string = ContainerNames.RepoPanel
	
	/**
	 * On blur - clear selected repos
	 */
	onBlur = () => getRepoActions().clearSelectedRepos()
	
		
	render() {
		const
			{styles,style} = this.props,
			
			panelStyle = [
				styles.panel,
				styles.root,
				style
			]


		//handlers={this.keyHandlers}
		return <CommandRoot
			component={this}
			style={panelStyle}>

				

				{/* List */}
				<div style={styles.listContainer} className="listContainer">
					<RepoList />
				</div>

			</CommandRoot>
		


	}

}