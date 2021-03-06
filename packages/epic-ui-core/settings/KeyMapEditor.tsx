// Imports
import { Map, Record, List } from "immutable"
import { connect } from 'react-redux'
import { createStructuredSelector, createSelector } from 'reselect'
import { PureRender, KeyboardAccelerator, FormButton, Button, TextField } from 'epic-ui-components/common'
import { IThemedAttributes, ThemedStyles } from 'epic-styles'
import { isDefined, getValue } from "typeguard"
import { CommandAccelerator } from "epic-command-manager/CommandAccelerator"
import { SettingsSection, SettingsField } from "./SettingsElements"
import { makeWidthConstraint } from "epic-styles/styles"
import { getUIActions, getAppActions } from "epic-typedux/provider"
import { customAcceleratorsSelector } from "epic-typedux/selectors"
import { CommandType } from "epic-command-manager"
import { isEmpty } from "epic-global"


// Constants
const
	log = getLogger(__filename)

// DEBUG OVERRIDE
//log.setOverrideLevel(LogLevel.DEBUG)

function baseStyles(topStyles, theme, palette) {
	
	const
		{ text, primary, accent, background } = palette,
		resetWidth = rem(10)
	
	return [ Styles.FlexColumn, Styles.FlexAuto, {
		
		filterSpacer: [makeWidthConstraint(resetWidth)],
		
		accelerator: [ Styles.makePaddingRem(0.5, 1), {
			borderRadius: rem(0.3),
			color: text.primary,
			border: `0.1rem solid ${accent.hue1}`,
			backgroundColor: Styles.Transparent,
			fontWeight: 700,
			
			custom: [ {
				backgroundColor: accent.hue1
			} ]
		} ],
		
		
		reset: [ Styles.makeMarginRem(0,0,0,1.5),Styles.FlexRowCenter, Styles.PositionRelative, makeWidthConstraint(resetWidth), {
			button: [ Styles.FillWidth ]
		} ]
	} ]
}


/**
 * IKeyMapEditorProps
 */
export interface IKeyMapEditorProps extends IThemedAttributes {
	customAccelerators?:Map<string,string>
}

/**
 * IKeyMapEditorState
 */
export interface IKeyMapEditorState {
	filterText?:string
}


/**
 * KeyMapEditor
 *
 * @class KeyMapEditor
 * @constructor
 **/

@connect(createStructuredSelector({
	customAccelerators: customAcceleratorsSelector
}))
@ThemedStyles(baseStyles)
@PureRender
export class KeyMapEditor extends React.Component<IKeyMapEditorProps,IKeyMapEditorState> {
	
	
	private captureAccelerator = (cmd:ICommand) => {
		getUIActions().openSheet(getRoutes().CaptureAccelerator.uri, {
			commandId: cmd.id
		})
	}
	
	private onFilterChange = (event:React.FormEvent<any>) => {
		const
			filterText = (event.target as any).value
		
		this.setState({
			filterText
		})
	}
	
	/**
	 * Clear a custom accelerator
	 *
	 * @param cmd
	 */
	private clearAccelerator(cmd:ICommand) {
		getAppActions().setCustomAccelerator(cmd.id, null)
	}
	
	/**
	 * Render the list
	 *
	 * @returns {any}
	 */
	render() {
		const
			{ customAccelerators, styles } = this.props,
			{ filterText } = this.state
		
		if (DEBUG) {
			log.debug(`Custom accelerators`, customAccelerators.toJS())
		}
		
		const
			title = <div style={makeStyle(Styles.FlexRowCenter,Styles.FlexScale)}>
				<div style={Styles.FlexScale}>Global Shortcuts</div>
				<TextField
					onChange={this.onFilterChange}
					defaultValue=''
					placeholder='filter...'/>
				<div style={styles.filterSpacer}/>
			</div>
		
		return <div style={styles.root}>
			<SettingsSection
				styles={styles}
				iconName="keyboard"
				iconSet="material-icons"
				title={title}>
				
				{Scopes.Commands.all()
					.filter(cmd =>
						cmd.type === CommandType.Global &&
						isDefined(cmd.defaultAccelerator) &&
						(isEmpty(filterText) || cmd.name.toLowerCase().indexOf(filterText.toLowerCase()) > -1))
					
					.map((cmd) => <KeyField
						key={cmd.name}
						cmd={cmd}
						customAccelerators={customAccelerators}
						editor={this}
						styles={styles}/>)}
			
			</SettingsSection>
			
			<SettingsSection
				styles={styles}
				iconName="keyboard"
				iconSet="material-icons"
				title='App Shortcuts'>
				
				{Scopes.Commands.all()
					.filter(cmd =>
						cmd.type !== CommandType.Global &&
						isDefined(cmd.defaultAccelerator) &&
						(
							getValue(() => filterText.length, 0) < 1 ||
							cmd.name.toLowerCase().indexOf(filterText.toLowerCase()) > -1
						)
					)
					
					.map((cmd) => <KeyField
						key={cmd.name}
						cmd={cmd}
						customAccelerators={customAccelerators}
						editor={this}
						styles={styles}/>)}
			
			</SettingsSection>
		
		</div>
	}
	
}

function KeyField({styles,cmd,customAccelerators,editor}) {
	const
		customAccelerator = customAccelerators.get(cmd.id),
		accelerator = new CommandAccelerator(customAccelerator || cmd.defaultAccelerator)
	
	if (customAccelerator)
		log.debug(`Custom "${cmd.name}" mapped to accelerator: ${customAccelerator}, parsed as ${accelerator.toElectronAccelerator()}`)
	
	
	return <SettingsField key={cmd.id} styles={styles} label={cmd.name}>
		<div style={makeStyle(Styles.FlexRow,Styles.makeFlexAlign('center','flex-end'))}>
			
			<KeyboardAccelerator
				style={makeStyle(styles.accelerator,customAccelerator && styles.accelerator.custom)}
				accelerator={accelerator}/>
			
			<Button
				style={Styles.makeMarginRem(0,0,0,1.5)}
				onClick={() => editor.captureAccelerator(cmd)}>
				SET
			</Button>
			
			<div style={styles.reset}>
				{customAccelerator &&
				<Button
					style={styles.reset.button}
					mode="warn"
					onClick={() => editor.clearAccelerator(cmd)}>reset</Button>
				}
			</div>
		</div>
	
	</SettingsField>
}


