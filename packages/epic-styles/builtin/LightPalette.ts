

import {IPalette,makePalette, Palettes} from '../material/MaterialTools'
import { colorDarken } from "epic-styles/styles/ColorTools"


export function LightPalette():IPalette {
	const
		palette = makePalette(
			'LightPalette',
			Palettes.grey,
			[ 'l400', 'l300', 'l100', 'l700' ],
			//[ 'l100', 'l200', 'l300', 'l700' ],
			Palettes.purple,
			[ 'A400', 'A200', 'A100', 'l100' ],
			//[ 'l100', 'l200', 'l300', 'l100' ],
			// [ 'l100', 'l200', 'l300', 'l100' ],
			// Palettes.teal,
			// ['l400', 'l200', 'l100', 'l50'],
			Palettes.lightBlue,
			[ 'A400', 'A200', 'A100', 'l100' ],
			Palettes.red,
			[ 'l400', 'l200', 'l100', 'l50' ],
			Palettes.green,
			[ 'A700', 'A400', 'A200', 'A100' ],
			colorDarken(Palettes.white,10),
			false
		)
	
	
	return palette
}


export namespace LightPalette {
	export const PaletteName = 'LightPalette'
}


export default LightPalette