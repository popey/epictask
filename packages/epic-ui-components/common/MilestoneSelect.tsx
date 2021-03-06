// Imports

import { connect } from "react-redux"
import { List } from "immutable"
import { PureRender} from "./PureRender"
import {LabelChip } from "./LabelChip"
import { shallowEquals, cloneObjectShallow } from "epic-global"
import { createStructuredSelector } from "reselect"
import { ThemedStyles, IThemedAttributes } from "epic-styles"
import { Milestone } from "epic-models"
import { SelectField} from "./SelectField"
import { milestonesSelector } from "epic-typedux"
import filterProps from "react-valid-props"
import { getValue } from "typeguard"

// Constants
const log = getLogger(__filename)

const baseStyles = (topStyles,theme,palette) => ({
	root: [ FlexColumn, FlexAuto, {} ],
	
	label: [{
		paddingTop: rem(1)
	}],
	
	labelChip: [{
		//height: '3rem',
		//borderRadius: '1.5rem',
		//height: '2.4rem',
		
		// text: [FlexScale,Ellipsis,{
		// 	flexShrink: 1,
		// 	fontWeight: 700,
		// 	fontSize: rem(1.5),
		// }]
	}]
})


/**
 * IMilestoneSelectProps
 */
export interface IMilestoneSelectProps extends IThemedAttributes {
	iconStyle?:any
	milestones?:List<Milestone>
	milestone:Milestone
	onItemSelected: (milestone:Milestone) => any
	repoId:number
}

/**
 * IMilestoneSelectState
 */
export interface IMilestoneSelectState {
	items:ISelectFieldItem[]
}

/**
 * MilestoneSelect
 *
 * @class MilestoneSelect
 * @constructor
 **/

@connect(createStructuredSelector({
	milestones: milestonesSelector
}),null,null,{withRef:true})

// If you have a specific theme key you want to
// merge provide it as the second param
@ThemedStyles(baseStyles)
@PureRender
export class MilestoneSelect extends React.Component<IMilestoneSelectProps,IMilestoneSelectState> {
	
	static NoMilestone = {
		key: null,
		value: Milestone.EmptyMilestone,
		content: <LabelChip
			styles={{
				backgroundColor: 'white',
				//border: `${convertRem(0.1)}px solid black`
			}}
			showIcon
			label={cloneObjectShallow(Milestone.EmptyMilestone,{color: 'ffffff'})} />
	}
	
	static defaultProps = {
		underlineShow: true
	}
	
	
	/**
	 * Create menu items
	 *
	 * @param props
	 * @returns {any[]}
	 */
	makeItems(props) {
		
		const
			{
				styles,
				milestones,
				repoId
			} = props
			
			
			
		
		
		
		return [MilestoneSelect.NoMilestone,...milestones
			.filter(it => !repoId || it.repoId === repoId)
			.map(milestone => ({
				key: milestone.id,
				value: milestone,
				content: <LabelChip showIcon label={milestone} />,
				contentText: milestone.title
			})).toArray() as ISelectFieldItem[]]
	}
	
	/**
	 * Create items and required elements
	 *
	 * @param props
	 */
	private updateState = (props = this.props) => {
		this.setState({
			items: this.makeItems(props)
		})
	}
	
	/**
	 * On change, notify
	 *
	 * @param item
	 */
	private onItemSelected = (item:ISelectFieldItem) => {
			this.props.onItemSelected(item && item.value as Milestone)
	}
	
	/**
	 * On mount always create items
	 */
	componentWillMount = this.updateState
	
	/**
	 * On new props - update items if required
	 *
	 * @param nextProps
	 * @param nextContext
	 */
	componentWillReceiveProps(nextProps:IMilestoneSelectProps, nextContext:any):void {
		if (!shallowEquals(this.props,nextProps,'milestones','milestone','repoId'))
			this.updateState(nextProps)
	}
	
	/**
	 * Render the select
	 *
	 * @returns {any}
	 */
	render() {
		const
			{milestone } = this.props,
			{items} = this.state,
			
			milestoneId = getValue(() => milestone.id,null),
			value = items.find(it => it && milestoneId  === it.key)
		
		
		//labelStyle={styles.form.milestone.item.label}
		return <SelectField
			{...filterProps(this.props)}
			placeholder={this.props.placeholder || 'Not milestoned'}
			value={value}
			items={items}
			onItemSelected={this.onItemSelected}
		>
			
		</SelectField>
	}
	
}