// import 'epic-entry-shared/AppEntry'
// import 'epic-ui-components/UIGlobals'
import { cloneObjectShallow, getValue, shallowEquals } from "epic-global"
import { Provider, connect } from "react-redux"
import { MuiThemeProvider } from "material-ui/styles"
import { PureRender } from "epic-ui-components/common"
import { FillWindow, makeWidthConstraint, makeHeightConstraint, Fill, IThemedAttributes } from "epic-styles"
// STYLES
import { RouteView, WindowHashURIProvider, IRouteInstance, Router, RouterEvent } from "./routes"
import { availableRepoCountSelector, appStateTypeSelector } from "epic-typedux/selectors"
import { AppStateType } from "epic-typedux/state/app"
import { createStructuredSelector } from "reselect"
import { ThemedWithOptions } from "epic-styles/ThemeDecorations"
import { benchmarkLoadTime } from "epic-util"
import * as React from "react"


benchmarkLoadTime(`Starting to loading AppRoot`)

// Logger, Store +++
const
	{ StyleRoot } = Radium,
	log = getLogger(__filename),
	Tooltip = require('react-tooltip'),
	win = window as any,
	$ = require('jquery'),
	windowId = getWindowId()


//DEBUG LOG
//log.setOverrideLevel(LogLevel.DEBUG)


let
	Pages:any,
	Routes:any

function reloadRoutes() {
	Routes = RouteRegistryScope.asRouteMap()
	Pages = RouteRegistryScope.asMap()
}

reloadRoutes()

/**
 * Properties for App/State
 */
export interface IAppRootProps extends IThemedAttributes {
	store?:any
	repoCount?:number
	appStateType?:AppStateType
	
}

export interface IAppRootState {
	windowStyle?:any
	routeViewRef?:RouteView
	routeView?:any
	
	Routes?:any
	Pages?:any
}

const
	CIDS = {
		GithubImport: 'GithubImport',
		GithubSync: 'GithubSync',
		GlobalNewIssue: 'GlobalNewIssue',
		FindAction: 'FindAction',
		CloseWindow: 'CloseWindow',
		Settings: 'Settings',
		RepoSettings: 'RepoSettings',
		Quit: 'Quit'
	}
/**
 * Root App Component
 */
@connect(createStructuredSelector({
	appStateType: appStateTypeSelector,
	repoCount: availableRepoCountSelector
}))
@ThemedWithOptions({ enableRef: true })
@PureRender
class AppRoot extends React.Component<IAppRootProps, IAppRootState> {
	
	uriProvider = new WindowHashURIProvider()
	
	
	constructor(props, context) {
		super(props, context)
		
		this.state = {
			routeView: null
		}
	}
	
	
	/**
	 * On focus
	 */
	onFocus() {
		log.debug('Focused')
	}
	
	/**
	 * On blur
	 */
	onBlur() {
		log.debug('Blur')
	}
	
	/**
	 * on resize update the state
	 *
	 * @param event
	 */
	onWindowResize = (event) => this.updateState()
	
	/**
	 * Update the window style
	 *
	 * @param props
	 */
	private updateState = (props = this.props) => {
		const
			windowStyle = getValue(() => makeStyle(
				makeWidthConstraint(window.innerWidth),
				makeHeightConstraint(window.innerHeight)
			), FillWindow)
		
		if (shallowEquals(windowStyle, getValue(() => this.state.windowStyle)))
			return
		
		
		this.setState({
			windowStyle,
		})
	}
	
	/**
	 * When a route changes
	 */
	
	private onRoutesChanged = () => {
		log.info(`Routes Loaded/Changed - loading`)
		reloadRoutes()
		
		
		this.setState({
			Routes, Pages
		}, this.checkRoute)
		
	}
	
	/**
	 * On mount create state and start listening to size
	 */
	componentWillMount() {
		this.onRoutesChanged()
		
		EventHub.on(EventHub.RoutesChanged, this.onRoutesChanged)
		
		this.checkRoute()
		
	}
	
	
	/**
	 * Component will receive props
	 *
	 * @param nextProps
	 */
	componentWillReceiveProps(nextProps) {
		this.checkRoute(nextProps)
	}
	
	/**
	 * On unmount - remove window listener,
	 */
	componentWillUnmount() {
		this.setState({
			routeView: null
		})
	}
	
	private checkRoute = _.debounce((props = this.props, router:Router = null, route:IRouteInstance<any> = null) => {
		setImmediate(() => {
			router = router || getValue(() => this.state.routeViewRef.getRouter())
			route = route || getValue(() => router.getRoute()) || Object.values(Pages).find(it => it.defaultRoute)
			
			if (!router || !route)
				return log.warn(`Router and route can not be null`, router, route)
			
			const
				{ uri: path } = route,
				{ uriProvider } = router,
				{ uri, params } = !uriProvider ? ({} as any) : uriProvider.getLocation(),
				{ repoCount, appStateType } = props,
				isAuthenticated = appStateType !== AppStateType.AuthLogin,
				isLogin = uri === Pages.Login.uri,
				isWelcome = uri === Pages.Welcome.uri,
				isRoot = [ null, '', Pages.IDE.uri, Pages.IssueTray.uri ].includes(uri),
				
				wConfig = getValue(() => getWindowConfig()),
				wType = wConfig && wConfig.type
			
			
			log.info('Window type', wType, 'name', WindowType[ wType ], `Checking root: ${uri} for IDE and no repos`, uri, path, isAuthenticated, isLogin, isRoot, repoCount)
			
			if (!isAuthenticated || repoCount === 0) {
				if (!isLogin) {
					log.debug(`Scheduling redirect to login`)
					uriProvider.setLocation({
						uri: Pages.Login.uri,
						params
					})
				}
			}
			// else if (uri === '' || isLogin || (isWelcome && repoCount > 0) || (isRoot && repoCount < 1)) {
			// 	log.debug(`Scheduling redirect to welcome/ide`)
			//
			// 	uriProvider.setLocation({
			// 		uri: repoCount < 1 ? Pages.Welcome.uri : wType === WindowType.Tray ? Pages.IssueTray.uri : Pages.IDE.uri,
			// 		params
			// 	})
			//
			// }
		})
	}, 100)
	
	/**
	 * When the route changes come here
	 *
	 * @param event
	 * @param router
	 * @param route
	 */
	private onRouteChange = (event:RouterEvent, router:Router, route:IRouteInstance<any>) => {
		this.checkRoute(this.props, router, route)
	}
	
	
	/**
	 * Render the app container
	 */
	render() {
		
		const
			{ theme, palette } = this.props,
			{ Routes } = this.state
		
		return <StyleRoot style={makeStyle(Fill, { color: palette.text.primary })}>
			
			<div
				id="appRoot"
				style={Fill}>
				
				
				<Provider store={this.props.store}>
					<RouteView
						ref={(routeViewRef) => this.setState({ routeViewRef }, () => this.checkRoute())}
						routerId="app-root"
						routes={Routes}
						onRouteChange={this.onRouteChange}
						uriProvider={this.uriProvider}/>
				</Provider>
				
				{/* ENVIRONMENT MARKER */}
				<EnvMarker/>
				
			</div>
		
		</StyleRoot>
		
	}
}


export default AppRoot


/**
 * Env Marker Component
 *
 * @returns {any}
 * @constructor
 */
function EnvMarker() {
	if (DEBUG) {
		return <div
			style={{
				position: 'fixed',
				textTransform: 'uppercase',
				right: 100,
				top: 0,
				backgroundColor: 'red',
				color: 'white',
				fontSize: 10
			}}>
			{process.env.NODE_ENV}
		</div>
	} else {
		return React.DOM.noscript()
	}
}
