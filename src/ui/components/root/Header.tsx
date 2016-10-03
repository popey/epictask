import * as React from 'react'
import {SearchPanel} from 'ui/components/search'
import {makeAbsolute} from 'shared/themes/styles/CommonStyles'
import {SearchType} from 'shared/actions/search/SearchState'
import {TextField} from 'material-ui/TextField'
import {PureRender} from 'ui/components/common'
import { CommandComponent, ICommandComponent, getCommandProps, CommandRoot } from "shared/commands/CommandComponent"
import { ICommand } from "shared/commands/Command"
import { ContainerNames } from "shared/config/CommandContainerConfig"
import { getCommandManager } from "shared/commands/CommandManager"
import { ThemedStyles } from "shared/themes/ThemeDecorations"

export const ImageLogoFile = require('assets/images/epictask-logo-rainbow.png')

const log = getLogger(__filename)

const HeaderSearchTypes = [
	SearchType.Repo,
	SearchType.AvailableRepo,
	SearchType.Issue,
	SearchType.Milestone,
	SearchType.Label
]

export enum HeaderVisibility {
	Hidden,
	Normal,
	Expanded
}

const baseStyles = createStyles((topStyles,theme,palette) => {
	
	return {
		header: makeStyle(FlexRow, FlexAlignCenter, FlexAuto, PositionRelative, makeTransition(), {
			WebkitUserSelect: 'none',
			WebkitAppRegion: 'drag',
			opacity: 0,
			height: 0,
			padding: 0,
			border: 0,
		}),
		
		headerNormal: {
			padding: '0.3rem 10rem',
			opacity: 1
		},
		
		headerExpanded: makeStyle({
			height: '100vh',
			maxHeight: '100vh',
			flexBasis: '100vh',
			flexGrow: 1,
			flexShrink: 0
		}),
		
		controls: makeStyle(makeAbsolute(), {
			opacity: 1,
			border: '0.2rem solid transparent',
			padding: 0
		}),
		
		controlButton: makeStyle(makeTransition(), FlexRowCenter, {
			display: 'inline-flex',
			border: '0.2rem solid transparent'
		}),
		
		controlButtonBefore: makeStyle(makeTransition()),
		
		logoWrapper: makeStyle(makeTransition(), PositionAbsolute, {
			right: 0,
			top: 0,
			width: 'auto',
			padding: '0.2rem 1rem',
			
			
		}),
		
		logo: makeStyle(makeTransition(), PositionAbsolute, {
			top: '50%',
			left: '50%',
			height: '70%',
			width: 'auto',
			maxWidth: '70%',
			transform: 'translate(-50%,-50%)'
			
		}),
		
		logoExpanded: makeStyle({
			top: '50%',
			left: '50%',
			height: '80%',
			width: 'auto',
			maxWidth: '80%',
			transform: 'translate(-50%,-50%)'
		}),
		
		logoWrapperExpanded: makeStyle({
			top: '25%',
			left: '50%',
			right: 'inherit',
			transform: 'translate(-50%,-50%)',
			padding: '10rem 10rem 4rem 10rem',
			height: '50%',
			width: '50%',
			backgroundSize: '40%',
			backgroundPosition: 'bottom center'
		}),
		
		search: [ {
			backgroundColor: Transparent,
			
			field: [ {
				backgroundColor: Transparent
			}],
			input: [ {
				backgroundColor: Transparent
			} ],
			hint: [ {} ]
		
		} ]
		
	}
	
})

export interface IHeaderProps {
	className?:string
	visibility:HeaderVisibility
	style?:any
	styles?:any
}

export interface IHeaderState {
	searchPanel?:SearchPanel
	hotKeys?:any
	resultsHidden?:boolean
	forceBlur?:boolean
	focused?:boolean
}

/**
 * The app header component, title/logo/settings
 */
@CommandComponent()
@ThemedStyles(baseStyles,'header')
@PureRender
export class Header extends React.Component<IHeaderProps,IHeaderState> implements ICommandComponent {
	
	
	readonly commands:ICommand[] = []
	
	readonly commandComponentId:string = 'Header'
	
	constructor(props,context) {
		super(props,context)
	}

	get isExpanded():boolean {
		return this.props.visibility === HeaderVisibility.Expanded
	}

	get searchPanel():SearchPanel {
		const panel = _.get(this,'state.searchPanel') as any
		return panel && panel.getWrappedInstance ? panel.getWrappedInstance() : panel
	}

	get textField():TextField {
		return _.get(this,'searchPanel.textField') as any
	}




	windowClose = () => {
		log.info('window close')
	}

	windowMin = () => {
		log.info('window min')
	}

	windowMax = () => {
		log.info('window max')
	}

	setSearchPanelRef = (searchPanel) => {
		this.setState({searchPanel})
	}

	setHotKeysRef = (hotKeys) => {
		this.setState({hotKeys})
	}

	/**
	 * On escape sequence close the header unless expanded
	 */
	onEscape = () => {
		
		log.info(`Header on escape`)
		
		if (this.isExpanded)
			return
		
		// if (this.textField)
		// 	this.textField.blur()
		//
		getCommandManager().focusOnContainer(ContainerNames.IssuesPanel)
		
		// const {searchPanel} = this
		//
		// if (searchPanel) {
		// 	const textField:any = searchPanel.textField
		// 	if (textField) {
		// 		textField.blur()
		// 	} else {
		// 		const doc = document as any
		// 		doc.activeElement.blur()
		// 	}
		// }
		
		//ActionFactoryProviders[UIKey].focusIssuesPanel()
	}

	/**
	 * onBlur - exiting find
	 *
	 * @param event
	 */

	onBlur = (event) => {
		this.setState({
			resultsHidden:this.isExpanded,
			focused:false
		})
	}

	/**
	 * On focus - usually for find
	 *
	 * @param event
	 */
	onFocus = (event) => {
		this.setState({resultsHidden:false,focused:true})
	}

	keyHandlers = {}


	/**
	 * on mount clear the state
	 */
	componentWillMount = () => !this.state && this.setState({})

	/**
	 * Render component
	 *
	 * @returns {any}
	 */
	render() {
		const theme = getTheme()
		const
			{visibility, styles,style} = this.props,
			expanded = this.isExpanded,
			{resultsHidden} = this.state

		const themeHeight = theme.header.style.height

		//noinspection JSSuspiciousNameCombination
		const logoWrapperStyle = makeStyle(
			baseStyles.logoWrapper,
			theme.header.logoWrapperStyle,
			{
				height: themeHeight,
				width: themeHeight,
				right: themeHeight / 2
			},
			expanded && baseStyles.logoWrapperExpanded)

		const logoStyle = makeStyle(
			baseStyles.logo,
			theme.header.logo,
			expanded && baseStyles.logoExpanded
		)

		let headerStyle = makeStyle(baseStyles.header)

		
		if ((visibility !== HeaderVisibility.Hidden)) {
			headerStyle = makeStyle(
				theme.header.style,
				style,
				baseStyles.header,
				baseStyles.headerNormal,
				expanded && baseStyles.headerExpanded, {
					height: (visibility === HeaderVisibility.Expanded) ? '100%' : themeHeight,
					WebkitAppRegion: 'drag'
				}
			)
		}

		const
			controlStyle = makeStyle(theme.header.controlStyle,baseStyles.controlButton)
		//ref={this.setSearchPanelRef}
		// ref={this.setHotKeysRef}
		
		return <CommandRoot
			component={this}
      id="header"
      style={headerStyle}>
			
			<SearchPanel
				ref={this.setSearchPanelRef}
				searchId='header-search'
				types={HeaderSearchTypes}
				inlineResults={expanded}
				expanded={expanded}
				panelStyle={styles.search}
				fieldStyle={styles.search.field}
				inputStyle={styles.search.input}
				onEscape={this.onEscape}
				mode={expanded ? 'repos' : 'issues'}/>

			<div style={logoWrapperStyle}>
				<img style={logoStyle} src={ImageLogoFile}/>
			</div>

		</CommandRoot>
	}
}


