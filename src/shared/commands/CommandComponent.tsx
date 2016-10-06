import { ICommand, CommandType, TCommandExecutor, TCommandDefaultAccelerator } from "shared/commands/Command"
import { getCommandManager } from "shared/commands/CommandManager"
import * as React from 'react'
import filterProps from 'react-valid-props'
import { isFunction, shortId } from "shared/util/ObjectUtil"

const
	log = getLogger(__filename),
	commandContainerCommands = new WeakMap<CommandContainer,ICommand[]>()

// DEBUG ENABLE
log.setOverrideLevel(LogLevel.DEBUG)


/**
 * Options for the future (maybe global commands or something??
 */
export interface ICommandContainerOptions {
	
}


/**
 * Container props
 */
interface ICommandContainerProps extends React.HTMLAttributes<any> {
	commandComponent:ICommandComponentConstructor<any>
}

/**
 * Container state
 */
interface ICommandContainerState {
	instance?:ICommandComponent
	mounted?:boolean
	focused?:boolean
	registered?:boolean
}


/**
 * Container component, provided to children
 */
export class CommandContainer extends React.Component<ICommandContainerProps,ICommandContainerState> {
	
	constructor(props, context) {
		super(props, context)
		
		this.state = {
			mounted: false,
			focused: false,
			registered: false
		}
	}
	
	/**
	 * get unwrapped instance
	 */
	get instance():ICommandComponent {
		let
			i = _.get(this, 'state.instance', null) as any
		
		if (i && i.getWrappedInstance)
			i = i.getWrappedInstance()
		
		return i
	}
	
	/**
	 * get unwrapped id
	 */
	get id() {
		const
			{ instance } = this
		
		return instance && instance.commandComponentId
	}
	
	/**
	 * Return our wrapped instance
	 *
	 * @returns {ICommandComponent}
	 */
	getWrappedInstance() {
		return this.instance
	}
	
	/**
	 * On mount, set 'mounted', then update the commands
	 */
	componentDidMount = () => this.setState({
		mounted: true
	}, this.updateCommands)
	
	
	/**
	 * On unmount, set 'mounted' = false, then update the commands (remove them)
	 */
	componentWillUnmount = () => this.setState({
		mounted: false
	}, this.updateCommands)
	
	/**
	 * Set the command component instance
	 *
	 * @param instance
	 */
	setInstance = (instance:ICommandComponent) => {
		if (!instance) {
			log.debug(`Instance set to null`, this)
			return
		}
		
		// JUST IN CASE ITS WRAPPED IN RADIUM OR CONNECT/REDUX
		this.setState({ instance }, this.updateCommands)
	}
	
	/**
	 * On focus
	 *
	 * @param event
	 */
	onFocus = (event:React.FocusEvent<any>) => {
		
		
		const
			{ instance, id } = this,
			{ focused } = this.state
		
		log.debug(`focused`, id, instance)
		
		if (!instance) {
				return log.warn(`No instance but focused`,instance,this)
		}
		
		if (focused) {
			log.debug(`Already focused`)
		} else {
			this.setState({ focused: true })
		}
		
		setImmediate(() => {
			getCommandManager().setContainerFocused(id, this, true, event)
			
			if (instance.onFocus)
				instance.onFocus(event)
		})
		
		
	}
	
	/**
	 * On blur event
	 *
	 * @param event
	 */
	onBlur = (event:React.FocusEvent<any>) => {
		const
			{ instance, id } = this,
			{ focused } = this.state
		
		log.debug(`blurred`, id)
		if(!instance)
			return log.warn(`Blur, but no instance???`)
		//assert(instance, `Blur, but no instance???`)
		
		if (!focused) {
			log.debug(`Blur, but not focused`)
		} else {
			this.setState({ focused: false })
		}
		
		setImmediate(() => {
			getCommandManager().setContainerFocused(id, this, false, event)
		})
		
		
		if (instance.onBlur)
			instance.onBlur(event)
	}
	
	
	/**
	 * Update the commands when we get a new instance or changes are registered
	 */
	updateCommands = () => {
		const
			{ instance, id } = this,
			{ mounted, registered } = this.state
		
		log.debug(`Updating commands for ${id}`)
		
		if (!instance || !id) {
			log.warn(`Instance is not set yet, can not do anything, mounted=${mounted}, id=${id}`)
			return
		}
		
		
		// REGISTER
		if (!registered) {
			log.debug(`Registering commands on container ${id}`)
			
			getCommandManager()
				.registerContainerCommand(this.id, this, ...this.getCommands())
			
			this.setState({ registered: true })
		}
		
	}
	
	/**
	 * Get commands from instance
	 */
	private getCommands = () => {
		let
			commands = commandContainerCommands.get(this)
		
		if (!commands) {
			const
			 rawCommands = this.instance.commands
			
			commands = (isFunction(rawCommands)) ?
				rawCommands(new CommandContainerBuilder(this)) :
				rawCommands
			
			commandContainerCommands.set(this,commands)
		}
		
		
		return commands
	}
	
	/**
	 * Render the HOC wrapped component
	 */
	render() {
		//noinspection JSUnusedLocalSymbols
		const
			{ commandComponent } = this.props,
			Wrapper = {
				commandComponent
			}
		
		return <Wrapper.commandComponent
			tabIndex="-1"
			{..._.omit(this.props,'ref', 'onFocus', 'onBlur')}
			onFocus={this.onFocus}
			onBlur={this.onBlur}
			commandContainer={this} ref={this.setInstance}/>
	}
}

/**
 * Properties for a command component
 */
export interface ICommandComponentProps extends React.HTMLAttributes<any> {
	commandContainer?:CommandContainer
}

/**
 * Container Command creator type
 */
export type TCommandsCreator = (builder:CommandContainerBuilder) => ICommand[]

/**
 * The only property a command component must implement is "commands"
 */
export interface ICommandComponent extends React.Component<ICommandComponentProps,any> {
	readonly commands:ICommand[]|TCommandsCreator
	readonly commandComponentId:string
	
	onFocus?:(event:React.FocusEvent<any>) => any
	onBlur?:(event:React.FocusEvent<any>) => any
	
}

/**
 * Get the required pass thru components
 * @param component
 * @returns {{onFocus,onBlur}
 */
export function getCommandProps(component:ICommandComponent) {
	return _.pick((component as any).props, [ 'tabIndex', 'onFocus', 'onBlur' ]) as {
		tabIndex:number
		onFocus:React.FocusEventHandler<any>,
		onBlur:React.FocusEventHandler<any>
	}
}

/**
 * Constructor for a command component
 */
export interface ICommandComponentConstructor<C extends ICommandComponent> {
	new (props?, context?):C
	defaultProps?:any
}

export type TCommandComponentConstructor = ICommandComponentConstructor<any>

/**
 * Add context for CommandContainer
 *
 * @param opts
 */
export function CommandComponent<T extends TCommandComponentConstructor>(opts:ICommandContainerOptions = {} as any) {
	
	/**
	 * @param Component - the component to wrap
	 */
	return ((TargetComponent:T) => {
		
		return (function (props, context) {
			return <CommandContainer commandComponent={TargetComponent as any} {...props} />
		}) as any
	}) as any
}

/**
 * Command Root element for controlling focus events, etc
 */
export interface ICommandRootProps extends React.HTMLAttributes<any> {
	component:ICommandComponent & {props:any}
}


/**
 * Command component root node - makes it easier - really
 * just a div
 *
 * @param props
 * @constructor
 */
export class CommandRoot extends React.Component<ICommandRootProps,void> {
	
	render() {
		const
			{ props } = this,
			
			// FILTER ONLY VALID HTML PROPS AND REMOVE onFocus + onBlur
			cleanProps = Object.assign(filterProps(props), {
				onFocus: null,
				onBlur: null,
				style: !props.style ? {} : Array.isArray(props.style) ? makeStyle(...props.style) : props.style
			})
		
		return <div {...cleanProps} {...getCommandProps(props.component)}>
			{props.children}
		</div>
	}
}



/**
 * Command builder
 */
export class CommandContainerBuilder {
	
	private commands:ICommand[] = []
	
	/**
	 * Create with a container
	 *
	 * @param container
	 */
	constructor(public container:CommandContainer) {
		
	}
	
	/**
	 * Command factory function
	 *
	 * @param type
	 * @param name
	 * @param execute
	 * @param defaultAccelerator
	 * @param opts
	 */
	command = (type:CommandType,
	           name:string,
	           execute:TCommandExecutor,
	           defaultAccelerator:TCommandDefaultAccelerator = null,
	           opts:ICommand = {}) => {
		
		assert(this instanceof CommandContainerBuilder, 'Must be an instance of CommandContainerBuilder')
		
		const
			cmd = Object.assign({
				id: opts.id || `${this.container.id}-${name}`,
				type,
				execute,
				name,
				defaultAccelerator,
				container: this.container
			},opts || {})
		
		this.commands.push(cmd)
			
		return this
	}
	
	make() {
		return this.commands
	}
	
}


export default CommandComponent