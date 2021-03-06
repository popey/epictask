import {create as FreeStyleCreate,FreeStyle} from 'free-style'

const
	globalStyleConfigs = [] as any,
	shortId = require('short-id')

declare global {
	interface IGlobalThemedStyle {
		id:string
		fn:(theme:any,Style:FreeStyle) => any
		remove:() => void
		create: () => void
		element: typeof $
		clean:() => void
	}
	
	function CreateGlobalThemedStyles(fn:(theme:any,Style:FreeStyle) => any):IGlobalThemedStyle
}

export function CreateGlobalThemedStyles(fn:(theme:any,Style:FreeStyle) => any):IGlobalThemedStyle {
	
	const
		id = `themedStyle${shortId.generate()}`,
		config = {} as any,
		remove = () => $(`#${id}`).remove(),
		create = () => {
			remove()
			const
				Style = FreeStyleCreate(),
				newStyles = fn(getTheme(),Style)
			
			
			Object
				.keys(newStyles)
				.forEach(selector => Style.registerRule(selector,newStyles[selector]))
			
			
			return $(`<style id="${id}" type="text/css">
				${Style.getStyles()}
			</style>`).appendTo($('head'))
		}
	
	Object.assign(config, {
		id,
		fn,
		remove,
		create,
		element: create(),
		removeListener: EventHub.on(EventHub.ThemeChanged,() => config.create()),
		clean() {
			if (!config.removeListener)
				throw new Error(`ThemeStyle has already been remove ${id}`)
			
			config.removeListener()
			config.removeListener = null
			config.remove()
		}
	})
	
	globalStyleConfigs.push(config)
	
	return config
	
}

assignGlobal({
	CreateGlobalThemedStyles
})