export enum CommonKeys {
	MoveUp = 1,
	MoveDown,
	MoveRight,
	MoveLeft,
	MoveUpSelect,
	MoveDownSelect,
	New,
	Edit,
	Escape,
	Enter,
	Delete,
	Backspace,
	Space,
	Find
	// View1,
	// View2,
	// SetAssignee,
	// SetMilestone,
	// AddLabels,
	// CreateComment
}

export const GlobalKeys = {
	[CommonKeys.New]: 'super+n',
	[CommonKeys.Edit]: 'super+e',
	[CommonKeys.MoveUp]: 'ArrowUp',
	[CommonKeys.MoveDown]: 'ArrowDown',
	[CommonKeys.MoveLeft]: 'ArrowLeft',
	[CommonKeys.MoveRight]: 'ArrowRight',
	[CommonKeys.MoveUpSelect]: 'Shift+ArrowUp',
	[CommonKeys.MoveDownSelect]: 'Shift+ArrowDown',
	[CommonKeys.Enter]: 'Enter',
	[CommonKeys.Escape]: 'Escape',
	[CommonKeys.Find]: 'Super+F',
	[CommonKeys.Space]: 'Space',
	[CommonKeys.Delete]: 'Delete',
	[CommonKeys.Backspace]: 'Backspace'
	// [CommonKeys.SetAssignee]: ['alt+a','a'],
	// [CommonKeys.SetMilestone]: ['alt+m','m'],
	// [CommonKeys.AddLabels]: ['alt+t','t'],
	// [CommonKeys.CreateComment]: ['alt+c','c']
	
}

export const App = Object.assign({}, GlobalKeys, {})

export const Main = Object.assign({}, GlobalKeys, {})


import { isNil, isNumber, isString } from  "epic-global"

const
	log = getLogger(__filename)


export type TCommandDefaultAccelerator = string|CommonKeys|any


/**
 * ALl command types
 */
export enum CommandType {
	/**
	 * Registers a global shortcut in electron apps
	 */
	Global,
		
		/**
		 * App-Wide
		 */
	App,
		
		/**
		 * Container or selector based
		 */
	Container
}

assignGlobal({
	CommandType
})

export type TCommandType = typeof CommandType

declare global {
	const CommandType:TCommandType
}


export type TCommandContainer = ICommandContainer|Electron.Menu


/**
 * Command updater set on registration
 */
export interface ICommandUpdater {
	setEnabled:(enabled:boolean) => any
	setHidden:(hidden:boolean) => any
	update:(cmd:ICommand) => any
}


/**
 * Executor shape
 */
export type TCommandExecutor = (command:ICommand, event?:any) => any


/**
 * Command shape
 */
declare global {
	interface ICommand {
		/**
		 * Unique identifier for command
		 */
		id?:string
		
		/**
		 * Global, App or Regular command
		 */
		type?:CommandType
		
		/**
		 * React Component
		 */
		container?:React.Component<any,any>|Electron.Menu
		
		/**
		 * Execute the command, takes no args aside from the command
		 *
		 * @param command
		 */
		execute?:TCommandExecutor
		
		/**
		 * Holder for electron accel
		 */
		electronAccelerator?:string
		
		/**
		 * Electron styled accelerator (converted to mousetrap in browser window)
		 *
		 * if false, an accelerator can not be assigned
		 *
		 * @see https://github.com/electron/electron/blob/master/docs/api/accelerator.md
		 */
		defaultAccelerator?:TCommandDefaultAccelerator
		
		
		/**
		 * Accelerator currently configured
		 */
		accelerator?:TCommandDefaultAccelerator
		
		/**
		 * If the command does not have a modifier and an input/select/textarea
		 * has focus, unless overrideInput is true, the command is not triggered
		 */
		overrideInput?:boolean
		
		/**
		 * The visible name or label
		 */
		name?:string
		
		/**
		 * Optional extended info
		 */
		description?:string
		
		/**
		 * if not specified - assumes should show
		 */
		hidden?:boolean
		
		/**
		 * Hide in allCommands result
		 */
		hideInAllCommands?:boolean
		
		/**
		 * Current action is enabled
		 */
		enabled?:boolean
		
		/**
		 * Path to the menu where this should be added
		 */
		menuItem?:ICommandMenuItem
		
		/**
		 * if hidden disabled is assumed, but this prop
		 * overrides all
		 */
		disableKeyReassign?:boolean
		
		/**
		 * A function that accepts and updater for making changes to registered commands
		 *
		 * @param updater
		 */
		updateManager?:(cmd:ICommand, updater:ICommandUpdater) => any
	}
}

/**
 * Default Implementation of Command, any things that fits the shape can be used
 */
export class Command implements ICommand {
	
	
	id:string
	container:TCommandContainer
	defaultAccelerator:TCommandDefaultAccelerator
	overrideInput:boolean = false
	hidden:boolean = false
	menuItem:ICommandMenuItem
	disableKeyReassign:boolean
	
	/**
	 * Create a command from a command object - anything that implements the interface
	 *
	 * @param command
	 */
	constructor(command:ICommand)
	
	/**
	 * Create a command with required values
	 *
	 * @param id
	 * @param type
	 * @param execute
	 * @param name
	 * @param description
	 */
	constructor(id:string, type:CommandType, execute:TCommandExecutor, name?:string, description?:string)
	constructor(idOrCommand:string|ICommand = null, public type:CommandType = null, public execute:TCommandExecutor = null, public name:string = null, public description:string = null) {
		if (isString(idOrCommand)) {
			this.id = idOrCommand
		} else if (idOrCommand) {
			assign(this, idOrCommand)
		}
		
		assign(this, {
			disableKeyReassign: !isNil(this.disableKeyReassign) ? this.disableKeyReassign : !!this.hidden,
		})
	}
}


/**
 * Command menu item type
 */
export enum CommandMenuItemType {
	Menu = 1,
	Command,
	Separator,
	Checkbox
}

/**
 * Executor shape
 */
export type TCommandMenuItemExecutor = (item:ICommandMenuItem, event?:any) => any


export interface ICommandFontIcon {
	iconSet:string
	iconName:string
}

export interface ICommandImageIcon {
	url:string
}


export type TCommandIcon = string|ICommandFontIcon|ICommandImageIcon

/**
 * Check for font icon
 *
 * @param o
 */
export function isCommandFontIcon(o:any):o is ICommandFontIcon {
	return o && o.iconSet && o.iconName
}

/**
 * Is image icon
 *
 * @param o
 * @returns {any}
 */
export function isCommandImageIcon(o:any):o is ICommandImageIcon {
	return o && o.url
}

/**
 * Command menu item
 */
export interface ICommandMenuItem {
	
	/**
	 * Menu item id
	 */
	id?:string
	
	containerId?:string
	
	icon?:TCommandIcon
	
	type?:CommandMenuItemType
	
	subItems?:ICommandMenuItem[]
	
	commandId?:string
	
	mountsWithContainer?:boolean
	
	label?:string
	
	subLabel?:string
	
	enabled?:boolean
	
	hidden?:boolean
	
	menuPath?:string[]
	
	execute?:TCommandMenuItemExecutor
	
}


export interface ICommandMenuManager {
	
	
	
	/**
	 * Update menu items
	 *
	 * @param menuItems
	 */
	updateItem(...menuItems:ICommandMenuItem[]):void
	
	/**
	 * Remove items
	 *
	 * @param menuItems
	 */
	removeItem(...menuItems:ICommandMenuItem[]):void
	
	
	/**
	 * Show items
	 *
	 * @param menuItems
	 */
	showItem(...menuItems:ICommandMenuItem[]):void
	
	
	/**
	 * Hide items
	 *
	 * @param menuItemIds
	 */
	hideItem(...menuItemIds:string[]):void
}


/**
 * Provider interface
 */
export interface ICommandMenuManagerProvider {
	():ICommandMenuManager
}