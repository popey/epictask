/**
 * Created by jglanz on 5/30/16.
 */

// Imports
import * as React from 'react'
import * as Radium from 'radium'
import {FAIcons} from './IconFontAwesomeNames'
import {GHIcons} from './IconOpticonNames'
import filterProps from 'react-valid-props'
// Constants
const log = getLogger(__filename)

const MaterialIcons = 'material-icons'
const FontAwesome = 'fa'
const Octicons = 'octicon'
/**
 * IMIconProps
 */
export interface IIconProps extends React.DOMAttributes {
	className?:string
	style?:any
	iconSet?:'material-icons'|'fa'|'octicon'
	iconName?: string,
	fontSize?:any

}

function iconCode(codeSet,iconName) {
	let code = codeSet[iconName]
	if (!code) return ''

	code = (_.isNumber(code)) ? code : parseInt(code,16)

	return String.fromCodePoint(code)
}

/**
 * MIcon
 *
 * @class Icon
 * @constructor
 **/

@Radium
export class Icon extends React.Component<IIconProps,any> {

	constructor(props = {}) {
		super(props)
	}

	render() {
		let {className = '',style,iconName,children,fontSize} = this.props

		const iconSet = this.props.iconSet || MaterialIcons
		const declaredIconSet = [MaterialIcons,FontAwesome,Octicons]
				.filter(name => className.indexOf(name) > -1).length > 0


		if (!declaredIconSet) {
			className += ' ' + iconSet
		}


		const iconContent = (iconSet === FontAwesome) ?
			iconCode(FAIcons,iconName) : (iconSet === Octicons) ?
			iconCode(GHIcons,iconName) :
			children

		return <i {...filterProps(this.props)} className={className} style={style}>
			{iconContent}
		</i>
	}

}
