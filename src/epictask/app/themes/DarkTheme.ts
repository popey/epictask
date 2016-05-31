import * as Styles from 'material-ui/styles'
//import * as _ from 'lodash'

/**
 * Get colors ref
 */
const {colors:c} = Styles
const baseTheme = _.cloneDeep(Styles.darkBaseTheme)

export const DarkTheme = Styles.getMuiTheme(_.merge(baseTheme, {
	name: 'DarkTheme',
	navBar: {
		titleStyle: {
			fontFamily: 'Orbitron, sans-serif',
			letterSpacing: '0.3rem',
			fontSize: 10,
			fontWeight: 300

		},
		style: {
			color: 'white',
			height: 24,
			backgroundImage: "-webkit-linear-gradient(#4b4e54 0%, #4b4e54 1.9%, #494c51 2%, #333539 100%)"
		}
	},

	fontFamily: 'Play,sans-serif',
	fontWeight: 400,
	palette: {
		primary1Color: c.purple500,
		primary2Color: c.purple300,
		primary3Color: c.purple700,
		accent1Color: c.blueGrey500,
		accent2Color: c.blueGrey700,
		canvasColor: c.blueGrey700,
		textColor: 'white',
		alternateTextColor: 'white'
	}
}))