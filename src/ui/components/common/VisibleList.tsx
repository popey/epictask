// Imports
import * as React from 'react'
import {List} from 'immutable'
import * as Radium from 'radium'
import { PureRender } from 'ui/components/common/PureRender'
import { ThemedStyles, createThemedStyles, getTheme } from 'shared/themes/ThemeManager'
import { isNumber, isNil, isFunction, shallowEquals } from "shared/util/ObjectUtil"

// Constants
const
	log = getLogger(__filename),
	Resizable = require('react-component-resizable')

const baseStyles = createStyles({
	root: [ FlexColumn,FlexScale, PositionRelative, {
		
	}],
	list: [FlexScale,Fill,PositionRelative,{
		display: 'block',
		overflowY: 'auto',
		overflowX: 'hidden',
		
		content: [FillWidth,PositionRelative,{
			
		}]
	}]
})



export type TItems = Array<any>|List<any>

export type TItemHeightFn = (items:TItems,item:any,index:number) => number

/**
 * IVisibleListProps
 */
export interface IVisibleListProps extends React.HTMLAttributes<any> {
	
	items:TItems
	itemKeyProperty?:string
	itemKeyFn?:(items:TItems, item, index:number) => string
	itemCount:number
	itemHeight?:number|TItemHeightFn
	itemRenderer:(items:any, index:number,style:any,key:any) => React.ReactElement<any>
	initialItemsPerPage?:number
}

/**
 * IVisibleListState
 */
export interface IVisibleListState {
	theme?:any
	styles?:any
	width?:number
	height?:number
	lastItems?:TItems
	rootElement?:any
	listElement?:any
	itemsPerPage?:number
	startIndex?:number
	endIndex?:number
	scrollTop?:number
	currentItems?:any
	itemCache?:any
	itemHeights?:List<number>
	itemHeightMin?:number
	itemHeightTotal?:number
	itemOffsets?:List<number>
}

/**
 * VisibleList
 *
 * @class VisibleList
 * @constructor
 **/


// If you have a specific theme key you want to
// merge provide it as the second param

@Radium
export class VisibleList extends React.Component<IVisibleListProps,IVisibleListState> {
	
	static defaultProps = {
		initialItemsPerPage: 20
	}
	
	constructor(props,context) {
		super(props,context)
		this.state = {scrollTop: 0}
	}
	
	private getItemHeight = (items,item,index) => {
		const
			{itemHeight} = this.props
		
		return isFunction(itemHeight) ?
			itemHeight(items,item,index) :
			itemHeight
	}
	
	private getItemHeights(items) {
		const heights =
			items.map((item,index) => this.getItemHeight(items,item,index))
		
		return Array.isArray(heights) ? List<number>(heights) : heights
	}
	
	/**
	 * Recalculate the state,
	 * should be split into 2 different updates,
	 *
	 * 1.  Container Size
	 * 2.  Content/Scroll
	 *
	 * @param props
	 */
	private updateState = (props = this.props) => {
		const
			{state = {}} = this,
			{items,itemHeight} = props,
			itemsChanged = items !== this.props.items
		
		log.info(`ITEMS CHANGED changed`,itemsChanged)
		
			
		
		// ITEM HEIGHTS
		const
			heightState = {} as any
		
		let
			itemCache = (!itemsChanged && state.itemCache) ? state.itemCache : {}
		
		if (itemHeight && (itemsChanged || !state.itemOffsets || !state.itemHeightTotal)) {
			// Reset the item cache if the src items have changed
			
				
			
			let
				itemHeights = this.getItemHeights(items),
				itemHeightMin = -1,
				itemHeightTotal = 0,
				itemOffsets = Array(itemHeights.size)
				
			itemHeights.forEach((nextHeight, index) => {
				if (nextHeight > -1 && (itemHeightMin === -1 || nextHeight < itemHeightMin))
					itemHeightMin = nextHeight
				
				itemOffsets[index] = itemHeightTotal
				itemHeightTotal += nextHeight
			})
			
			assign(heightState,{
				itemOffsets: List<number>(itemOffsets),
				itemHeightMin,
				itemHeightTotal,
				itemHeights,
				startIndex: 0,
				endIndex: 0
			})
		}
			
		this.setState(assign({
			styles: createThemedStyles(baseStyles,[]),
			theme: getTheme(),
			itemCache
		},heightState),() => this.updateItems(props))
	}
	
	
	updateItems = (props = this.props) => {
		const
			{state = {}} = this,
			{itemCount,itemHeight} = props,
			{height,width,rootElement,itemOffsets,itemHeightMin} = state

		if (!height || !width || !rootElement) {
			log.debug(`Height/width not set yet `,height,width,rootElement)
			return
		}

		let
			scrollTop = state.scrollTop || 0,
			itemsPerPage = state.itemsPerPage || props.initialItemsPerPage,
			startIndex = 0,
			endIndex = itemCount

		// If item height is omitted then eventually everything is rendered / simply hidden when not in viewport
		if (itemHeight && itemHeightMin > 0) {
			itemsPerPage = Math.ceil(height / itemHeightMin)

			const
				visibleIndex = Math.max(0, itemOffsets.findIndex(offset => offset + itemHeightMin >= scrollTop) || 0)

			startIndex = Math.max(0, visibleIndex - itemsPerPage)
			endIndex = Math.min(itemCount, visibleIndex + itemsPerPage + itemsPerPage)
		}
			
		log.debug(`Start`,startIndex,'end',endIndex)

		this.setState({
			startIndex,
			endIndex,
			itemsPerPage
		})
	}
	
	/**
	 * On scroll event is debounced
	 */
	private onScroll = _.debounce((event) => {
		const
			{scrollTop} = this.state.listElement,
			{itemHeightMin,height,startIndex,endIndex,scrollTop:currentScrollTop} = this.state

		if (isNumber(currentScrollTop)) {

			if (!height || !itemHeightMin)
				return

			const
				firstVisibleIndex = Math.max(0, Math.floor(scrollTop / itemHeightMin)),
				lastVisibleIndex = Math.max(0, Math.ceil((scrollTop + height) / itemHeightMin))

			if (firstVisibleIndex >= startIndex && lastVisibleIndex <= endIndex) {
				log.info(`Indexes`,firstVisibleIndex,lastVisibleIndex, `within start/end`,startIndex,endIndex)
				return
			}
		}

		this.setState({scrollTop},this.updateItems)

		
	},150)
	
	
	shouldComponentUpdate(nextProps:IVisibleListProps, nextState:IVisibleListState, nextContext:any):boolean {
		return !shallowEquals(this.props,nextProps,'items') || !shallowEquals(this.state,nextState,'startIndex','endIndex','height','scrollTop')
	}
	
	/**
	 * On resize
	 *
	 * @param width
	 * @param height
	 */
	private onResize = ({width,height}) => {
		log.info(`Container resized ${width}/${height}`)
		this.setState({width,height}, () => this.updateItems())
	}
	
	/**
	 * Ref setter for root element
	 *
	 * @param rootElement
	 */
	private setRootRef = (rootElement) => this.setState({rootElement}, () => this.onResize(rootElement.getDimensions()))
	
	private setListRef = (listElement) => this.setState({listElement},() => this.updateState())
	
	/**
	 * On mount
	 */
	componentWillMount() {
		this.updateState()
	}
	
	/**
	 * When next props are received
	 *
	 * @param nextProps
	 */
	componentWillReceiveProps(nextProps) {
		this.updateState(nextProps)
	}
	
	
	/**
	 * Extract an item key from an item
	 *
	 * @param items
	 * @param index
	 * @returns {number|string}
	 */
	getItemKey(items:TItems,index:number) {
		const
			{itemKeyProperty,itemKeyFn} = this.props,
			item = !items ? null : Array.isArray(items) ? items[index] : items.get(index)
		
		const itemId =
			itemKeyProperty ?
				_.get(item,itemKeyProperty,index) :
				itemKeyFn ?
					itemKeyFn(items,item,index) :
					index
		
		return isNil(itemId) ? index : itemId
	}
	
	/**
	 * On render
	 *
	 * @returns {any}
	 */
	render() {
		const
			{props,state = {}} = this,
			{itemRenderer,itemHeight,className} = props,
			items = props.items as any,
			{styles,startIndex,endIndex,itemCache,scrollTop,itemOffsets,itemHeights,itemHeightTotal,itemHeightMin} = state
		
		// let
		// 	contentHeight = itemHeightTotal//((items as any).size || (items as any).length) * itemHeightMin
		
		
		
		return <Resizable style={styles.root}
		                  ref={this.setRootRef}
		                  onResize={this.onResize}>
			<div style={[styles.list]} ref={this.setListRef} onScroll={this.onScroll} className={`visible-list ${className || ''}`} data-visible-list="true">
				
				{/* SCROLL ITEMS CONTAINER - total item height */}
				<div style={[styles.list.content,itemHeight && {height:isNaN(itemHeightTotal) ? 0 : itemHeightTotal}]}>
					
					{/*{items.map((item,index) => itemRenderer(items, index,{},index))}*/}
					{
						// ITEMS
						
						isNumber(startIndex) && isNumber(scrollTop) && ((itemHeight) ? items
						.slice(startIndex, endIndex)
						.map((item, index) => {
							index += startIndex
							
							const
								offset = itemOffsets.get(index),
								style = makeStyle(FillWidth,{
									position: 'absolute',
									top: !offset || isNaN(offset) ? 0 : offset,
									height: itemHeights.get(index)
								}),
								indexId = `${index}`,
								key = this.getItemKey(items,index)
							
							return itemCache[key] || (itemCache[key] = itemRenderer(items, index,style,key))
							//return itemRenderer(items, index,style,key)
							
						}) : items.map((item, index) => {
						const
							style = makeStyle(FillWidth,{
								position: 'relative'
							}),
							indexId = `${index}`,
							key = this.getItemKey(items,index)
						
							return itemCache[key] || (itemCache[key] = itemRenderer(items, index,style,key))
							//return itemRenderer(items, index,style,key)
					}))}
				</div>
			</div>
		</Resizable>
	}
	
}