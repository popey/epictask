import { setDataOnHotDispose,getHot } from "epic-global/HotUtils"
import {OrderedMap} from 'immutable'
import { getValue, cloneObjectShallow } from "epic-global"
import {EnumEventEmitter} from 'type-enum-events'
const
	log = getLogger(__filename)

//DEBUG
//log.setOverrideLevel(LogLevel.DEBUG)

declare global {
	type TRouteMap = {[path:string]:TComponentProvider<any>|IRoute<any>}
}


export type TRouteChangeListener = (
	uriProvider:IRouteURIProvider,
  uri:string,
	params?:any) => any



export interface IRouterLocation {
	uri:string
	params?:any
}

export type TRouteComponent<ParamsType> = React.ComponentClass<IRouteComponentProps<ParamsType>>

/**
 * URI Provider shape
 */
export interface IRouteURIProvider {
	addListener(listener:TRouteChangeListener)
	removeListener(listener:TRouteChangeListener)
	
	getLocation():IRouterLocation
	setLocation(location:IRouterLocation)
}

/**
 * Route component props
 */
export interface IRouteComponentProps<ParamsType> {
	route?:IRouteInstance<ParamsType>
}


/**
 * Route shape
 */
export interface IRoute<ParamsType> {
	uri:string
	provider:TComponentProvider<ParamsType>
	onSelect?: (router:Router) => any
	defaultRoute?:boolean
}


/**
 * Type guard route
 *
 * @param o
 * @returns {boolean}
 */
function isRoute(o):o is IRoute<any> {
	return getValue(() => o.hasOwnProperty('provider') && o.hasOwnProperty('uri'),false)
}


/**
 * An instance of a route
 */
export interface IRouteInstance<ParamsType> extends IRoute<ParamsType> {
	uri:string
	params?:ParamsType
}


/**
 * Type guard route
 *
 * @param o
 * @returns {boolean}
 */
function isRouteInstance(o):o is IRouteInstance<any> {
	return getValue(() => isRoute(o) && o.hasOwnProperty('uri'),false)
}


/**
 * Component provider type
 */
export type TComponentProvider<ParamsType> = () =>
	Promise<TRouteComponent<ParamsType>>



const
	Routers = getHot(module,'Routers',{}) as {[id:string]:Router}

setDataOnHotDispose(module,() => ({
	Routers: Routers
}))


/**
 * Router events
 */
export enum RouterEvent {
	RouteChanged
}

/**
 * Router
 */
export class Router extends EnumEventEmitter<RouterEvent> {
	
	/**
	 * Get an existing router or create a new one
	 * if the id has not been used yet
	 *
	 * @param id
	 * @returns {Router}
	 */
	static get(id:string) {
		let
			router = Routers[id]
		
		if (!router)
			router = Routers[id] = new Router(id)
		
		return router
	}
	
	/**
	 * Current URI provider
	 */
	uriProvider:IRouteURIProvider
	
	/**
	 * Current route
	 */
	private route:IRouteInstance<any>
	
	
	/**
	 * All
	 */
	private routes = OrderedMap<string,IRoute<any>>().asMutable()
	
	/**
	 * Create a new router
	 *
	 * @param id
	 */
	private constructor(public id:string) {
		super(RouterEvent)
	}
	
	/**
	 * Clear all routes
	 */
	clear() {
		this.routes.clear()
		this.route = null
	}
	
	/**
	 * Set the default route
	 *
	 * @param uri
	 */
	setDefaultRoute(uri:string) {
		this.routes
			.valueSeq()
			.filter(it => it.uri !== uri && it.defaultRoute)
			.forEach(route => route.defaultRoute = false)
		
		const
			route = this.routes.get(uri)
		
		if (route) {
			log.debug(`Setting default route to ${uri} for router ${this.id}`)
			route.defaultRoute = true
		} else {
			log.debug(`No route matching path ${uri} for router ${this.id}`)
		}
	}
	
	/**
	 * Add a route
	 *
	 * @param uri
	 * @param route
	 */
	addRoute<ParamsType>(uri:string, route:IRoute<ParamsType>):this
	
	/**
	 * Add route
	 *
	 * @param uri
	 * @param provider
	 * @param defaultRoute
	 */
	addRoute<ParamsType>(uri:string, provider:TComponentProvider<ParamsType>, defaultRoute?:boolean):this
	addRoute<ParamsType>(uri:string, providerOrRoute:TComponentProvider<ParamsType>|IRoute<ParamsType>, defaultRoute = false):this {
		log.debug(`Adding route for uri ${uri}`)
		let
			route:IRoute<ParamsType> = isRoute(providerOrRoute) ? providerOrRoute : {
				defaultRoute,
				provider: providerOrRoute,
					uri
			}
		
		this.routes.set(uri,route)
		
		if (route.defaultRoute) {
			this.setDefaultRoute(route.uri)
		}
		
		return this
	}
	
	/**
	 * Add many routes at once
	 *
	 * @param routeMap
	 */
	addRoutes(routeMap:TRouteMap) {
		Object
			.keys(routeMap)
			.forEach(path => this.addRoute(path,routeMap[path] as any))
		
		return this
	}
	
	reloadRoutes(routeMap:TRouteMap) {
		const
			{route} = this
		
		this.routes.clear()
		
		Object
			.keys(routeMap)
			.forEach(path => this.addRoute(path,routeMap[path] as any))
		
		if (route) {
			log.info(`Updating current route`)
			this.setURI(route.uri,route.params)
		}
		
		return this
	}
	
	/**
	 * On URI change event handler
	 *
	 * @param uriProvider
	 * @param uri
	 * @param params
	 */
	private onURIChange = (uriProvider:IRouteURIProvider,uri:string,params:any) => {
		this.setURI(uri,params)
	}
	
	
	/**
	 * Set the URI provider
	 *
	 * @param uriProvider
	 */
	setURIProvider(uriProvider:IRouteURIProvider) {
		if (this.uriProvider) {
			this.uriProvider.removeListener(this.onURIChange)
		}
		
		this.uriProvider = uriProvider
		
		if (uriProvider) {
			uriProvider.addListener(this.onURIChange)
			
			const
				{
					uri,
					params
				} = uriProvider.getLocation()
			
			this.setURI(uri,params)
		}
		
		
		
		
		
		return this
	}
	
	
	
	
	/**
	 * Simple path matcher taking into account path vars
	 *
	 * @param route
	 * @param uri
	 * @returns {boolean}
	 */
	private matchRouteToURI(route:IRoute<any>,uri:string) {
		const
			uriParts = getValue(() => uri.split('/'),[]),
			pathParts = getValue(() => route.uri.split('/'),[])
		
		if (uriParts.length !== pathParts.length)
			return false
		
		for (let i = 0; i < uriParts.length;i++) {
			const
				uriPart = uriParts[i],
				pathPart = pathParts[i]
			
			if (!pathPart.startsWith(':') && uriPart !== pathPart)
				return false
		}
		
		return true
		
	}
	
	
	/**
	 * Extract path params
	 *
	 * @param path
	 * @param uri
	 * @returns {{}}
	 */
	private extractPathParams(path:string,uri:string):any {
		const
			uriParts = getValue(() => uri.split('/'),[]),
			pathParts = getValue(() => path.split('/'),[]),
			pathParams = {}
		
		for (let i = 0; i < uriParts.length;i++) {
			const
				uriPart = uriParts[i],
				pathPart = pathParts[i] || ''
			
			if (pathPart.startsWith(':'))
				pathParams[pathPart.substring(1)] = decodeURIComponent(uriPart)
		}
		
		return pathParams
	}
	
	/**
	 * Set the URI - triggering a route change
	 *
	 * @param uri
	 * @param params
	 */
	setURI(uri:string,params:any = {}) {
		let
			route = this.routes.find(it => this.matchRouteToURI(it,uri))
		
		if (!route)
			route = this.routes.find(it => it.defaultRoute)
		
		// IF ROUTE THEN EXTRACT ADDITIONAL params from path
		if (route) {
			params = cloneObjectShallow(params,this.extractPathParams(route.uri,uri))
		}
		
		this.route = !route ? null : cloneObjectShallow(route,{
			uri,
			params
		}) as any
		
		this.emit(RouterEvent.RouteChanged,this,this.route)
		
		return this
	}
	
	
	/**
	 * Get the current route
	 *
	 * @returns {IRouteInstance<any>}
	 */
	getRoute() {
		return this.route
	}
	
}


