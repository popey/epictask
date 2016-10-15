// Imports
import { PureRender } from 'ui/components/common/PureRender'
import { getToolComponent, getToolHeaderControls } from "shared/Registry"
import { IToolPanel, ITool } from "shared/tools/ToolTypes"

// Constants
const
	log = getLogger(__filename)



/**
 * IToolWrapperProps
 */
export interface IToolWrapperProps {
	styles:any
	tool:ITool
	panel:IToolPanel
}

/**
 * IToolWrapperState
 */
export interface IToolWrapperState {
	
}

/**
 * ToolWrapper
 *
 * @class ToolWrapper
 * @constructor
 **/

@Radium
@PureRender
export class ToolWrapper extends React.Component<IToolWrapperProps,any> {
	
	render() {
		const
			{styles,tool,panel} = this.props,
			{location} = panel,
			toolStyles = styles.tool,
			ToolComponent = getToolComponent(tool.id),
			ToolHeaderControls = getToolHeaderControls(tool.id)
		
		return <div style={[toolStyles,toolStyles[location]]} className="toolWrapper">
			<div style={[toolStyles.header,toolStyles.header[location]]}>
				<div style={[toolStyles.header.label]}>{tool.label}</div>
				{ToolHeaderControls}
			</div>
			<div style={[toolStyles.container]}>
				<ToolComponent tool={tool} panel={panel} visible={panel.open && tool.active} />
			</div>
		</div>
	}
}