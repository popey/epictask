// /**
//  * Created by jglanz on 7/19/16.
//  */
// // Imports
// import { List } from "immutable"
// import { connect } from "react-redux"
// import { PureRender, Icon, IssueLabelsAndMilestones } from "epic-ui-components"
// import {
// 	IssueSortableFields,
// 	IssueGroupByFields,
// 	IssueGroupByNames,
// 	IssueSortableFieldNames,
// 	IIssueGroup,
// 	Milestone, Label, Issue, User
// } from "epic-models"
// import { createStructuredSelector } from "reselect"
// import {
// 	ThemedStyles,
// 	FlexAuto,
// 	FillWidth,
// 	FlexRowCenter,
// 	Ellipsis,
// 	FlexScale,
// 	rem,
// 	FlexColumn,
// 	makeFlexAlign
// } from "epic-styles"

// import { getValue } from "epic-global"
// import { getUIActions, getIssueActions } from "epic-typedux/provider"
// import IssuesPanelController from "./IssuesPanelController"
// import { getIssuesPanelSelector } from "./IssuesPanelController"
// import { assigneesSelector, milestonesSelector, labelsSelector } from "epic-typedux/selectors"
//
//
// const
// 	log = getLogger(__filename)
//
// //DEBUG
// //log.setOverrideLevel(LogLevel.DEBUG)
//
//
// // Styles
// function baseStyles(topStyles, theme, palette) {
// 	return {
// 		root: [ makeTransition([ 'max-height', 'height', 'opacity' ]), FlexAuto, FillWidth, {
// 			padding: '0.5rem 0rem 0.5rem 1rem',
// 			height: 'auto',
//
// 			empty: [ {
// 				padding: 0,
// 				maxHeight: 0,
// 			} ]
// 		} ],
//
// 		filters: [ FlexRowCenter, FillWidth, {
//
// 			none: [ FlexScale, {
// 				fontWeight: 400,
// 				fontSize: themeFontSize(1.2)
// 			} ],
// 			labels: [ FlexScale, {
// 				flexWrap: 'wrap',
// 				label: [ {
// 					margin: '0.5rem 1rem 0.5rem 0'
// 				} ]
// 			} ],
//
// 			// Right side controls & stats
// 			controls: [ FlexColumn, makeFlexAlign('flex-end', 'center'), {
// 				groupBy: [ FlexAuto, FlexRowCenter, {
// 					padding: '0.2rem 0 0.2rem 1.4rem',
// 					borderRadius: '0.3rem',
// 					margin: '0 0.2rem 0 0',
// 					boxShadow: '0.1rem 0.1rem 0.1rem rgba(0,0,0,0.4)'
// 				} ],
// 				stats: [ Ellipsis, {
// 					margin: '1rem 1rem 0.5rem 1rem',
// 					fontSize: rem(1),
// 					fontWeight: 300
// 				} ]
// 			} ]
//
// 		} ],
//
// 		list: {
// 			item: {
//
// 				text: [ FlexRowCenter, FillWidth, {
// 					value: {
// 						width: 300,
// 					},
// 					primary: [ FlexAuto, Ellipsis, {
// 						padding: '0 0 0 1rem',
// 						fontWeight: 700,
// 						flexGrow: 1
// 					} ],
// 					secondary: [ FlexScale, Ellipsis, {
// 						fontWeight: 300
// 					} ],
// 					spacer: [ FlexScale ],
// 					icon: [ FlexAuto, {
// 						width: 18
// 					} ]
// 				} ]
// 			}
//
// 		}
// 	}
// }
//
// /**
//  * IIssueFiltersProps
//  */
// export interface IIssueFiltersProps extends React.HTMLAttributes<any> {
// 	theme?:any
// 	styles?:any
// 	unfilteredIssueIds?:number[]
// 	issues?:Issue[],
// 	issuesGrouped?:IIssueGroup[],
// 	issueCriteria?:IIssueCriteria
//
// 	issueFilterLabels?:List<Label>
// 	issueFilterMilestones?:List<Milestone>
//
// 	labels?:List<Label>
// 	milestones?:List<Milestone>
// 	assignees?:List<User>
//
// 	viewController:IssuesPanelController
// }
//
//
// /**
//  * IssueFilters
//  *
//  * @class IssueFilters
//  * @constructor
//  **/
//
// @connect(() => createStructuredSelector({
// 	issueCriteria: getIssuesPanelSelector(selectors => selectors.criteriaSelector),
// 	issueFilterLabels: getIssuesPanelSelector(selectors => selectors.issueFilterLabelsSelector),
// 	issueFilterMilestones: getIssuesPanelSelector(selectors => selectors.issueFilterMilestonesSelector),
// 	labels: labelsSelector,
// 	milestones: milestonesSelector,
// 	assignees: assigneesSelector
// }), null, null, { withRef: true })
// @ThemedStyles(baseStyles, 'issueFilters')
// @PureRender
// export class IssueFilters extends React.Component<IIssueFiltersProps,any> {
//
// 	get uiActions() {
// 		return getUIActions()
// 	}
//
// 	get issueActions() {
// 		return getIssueActions()
// 	}
//
// 	private get viewController() {
// 		return this.props.viewController
// 	}
//
// 	/**
// 	 * Event handlers
// 	 */
// 	onSortDirectionChanged = () => this.viewController.toggleSortByDirection()
//
// 	/**
// 	 * Group by direction change
// 	 */
// 	onGroupByDirectionChanged = () => this.viewController.toggleGroupByDirection()
//
// 	/**
// 	 * Remove a label/milestone filter
// 	 *
// 	 * @param item
// 	 * @param index
// 	 */
// 	onRemoveItemFromFilter = (item:Label|Milestone, index:number) => {
// 		if (Label.isLabel(item))
// 			this.viewController.toggleIssueFilterLabel(item)
// 		else
// 			this.viewController.toggleIssueFilterMilestone(item)
// 	}
//
//
// 	onClearFilters = () => {
// 		this.viewController.clearFilters()
// 	}
//
// 	/**
// 	 * Toggle the inclusion of closed issues
// 	 */
// 	onToggleIncludeClosed = () => this.viewController.includeClosedIssues(
// 		!this.props.issueCriteria.includeClosed
// 	)
//
// 	makeOnMilestoneSelected(milestone:Milestone) {
// 		return (event) => {
// 			log.info('Milestone toggled', event)
// 			this.viewController.toggleIssueFilterMilestone(milestone)
// 		}
// 	}
//
// 	makeOnLabelSelected(label:Label) {
// 		return (event) => {
// 			log.info('Label selected', event)
// 			this.viewController.toggleIssueFilterLabel(label)
// 		}
// 	}
//
// 	makeOnSortBySelected(field:string) {
// 		return (event) => {
// 			log.info('Sort by selected', event)
// 			this.viewController.setSortByField(field)
// 		}
// 	}
//
// 	makeOnGroupBySelected(field:string) {
// 		return (event) => {
// 			log.info('Group by selected', event)
// 			this.viewController.setGroupBy(field)
// 		}
// 	}
//
// 	/**
// 	 * Render all label items
// 	 *
// 	 * @returns {any[]}
// 	 */
// 	renderLabelItems() {
//
//
// 		const
// 			{
// 				theme,
// 				styles,
// 				issueCriteria,
// 				labels,
// 			} = this.props,
// 			{ palette } = theme
//
// 		return labels.map(label => {
// 			const
// 				backgroundColor = `#${label.color}`,
// 				color = TinyColor.mostReadable(backgroundColor, [
// 					palette.text.primary,
// 					palette.alternateText.primary
// 				]).toString(),
// 				labelStyle = mergeStyles(styles.list.item, {
// 					cursor: 'pointer',
// 					backgroundColor,
// 					color
// 				}),
// 				selected = issueCriteria.labelIds && issueCriteria.labelIds.includes(label.id)
//
// 			const primaryText = <div style={makeStyle(
// 					styles.list.item.text,
// 					styles.list.item.text.value
// 				)}>
// 				<Icon
// 					style={{
// 						opacity: selected ? 1 : 0
// 					}}
// 					iconSet='fa'
// 					iconName='check-circle'/>
// 				<div style={makeStyle(styles.list.item.text.primary,{
// 					color:labelStyle.color
// 				})}>
// 					{label.name}
// 				</div>
// 				<div style={styles.list.item.text.spacer}/>
// 			</div>
//
//
// 			return <MenuItem
// 				onTouchTap={this.makeOnLabelSelected(label)}
// 				style={labelStyle}
// 				primaryText={primaryText}
// 			/>
// 		})
// 	}
//
//
// 	/**
// 	 * Render milestone items
// 	 *
// 	 * @returns {any[]}
// 	 */
// 	renderMilestoneItems() {
//
//
// 		const {
// 			theme,
// 			styles,
// 			issueCriteria,
// 			milestones,
// 		} = this.props
//
// 		const { palette } = theme
//
// 		return milestones.map(milestone => {
//
// 			const
// 				selected = issueCriteria.milestoneIds && issueCriteria.milestoneIds.includes(milestone.id),
// 				primaryText = <div style={makeStyle(
// 					styles.list.item.text,
// 					styles.list.item.text.value
// 				)}>
// 					<div>
// 						<Icon
// 							style={{
// 								opacity: selected ? 1 : 0
// 							}}
// 							iconSet='fa'
// 							iconName='check-circle'/>
// 					</div>
// 					<div style={styles.list.item.text.primary}>
// 						{milestone.title}
// 					</div>
//
// 					<div style={styles.list.item.text.secondary}>
// 						{milestone.due_on ? moment(milestone.due_on).fromNow() : 'No Due Date'}
// 					</div>
// 				</div>
//
// 			return <MenuItem
// 				onTouchTap={this.makeOnMilestoneSelected(milestone)}
// 				style={styles.list.item}
// 				primaryText={primaryText}/>
//
// 		})
// 	}
//
// 	/**
// 	 * Render milestone items
// 	 *
// 	 * @returns {any[]}
// 	 */
// 	renderSortByItems() {
//
//
// 		const
// 			{
// 				theme,
// 				styles,
// 				issueCriteria
// 			} = this.props,
// 			issueSort = issueCriteria.sort,
//
// 			fields = IssueSortableFields,
//
// 			fieldNames = IssueSortableFieldNames,
// 			sortedField = issueSort.fields[ 0 ],
// 			{ palette } = theme
//
// 		return (fields).map((field, index) => {
//
// 			const
// 				selected = field === sortedField,
// 				fieldName = fieldNames[ index ]
//
// 			const primaryText = <div style={makeStyle(
// 					styles.list.item.text,
// 					styles.list.item.text.value
// 				)}>
// 				<div>
// 					<Icon
// 						style={{
// 							opacity: selected ? 1 : 0
// 						}}
// 						iconSet='fa'
// 						iconName='check-circle'/>
// 				</div>
// 				<div style={styles.list.item.text.primary}>
// 					{fieldName}
// 				</div>
//
// 				<div style={styles.list.item.text.spacer}/>
//
// 			</div>
//
// 			return <MenuItem
// 				onTouchTap={this.makeOnSortBySelected(field)}
// 				style={styles.list.item}
// 				primaryText={primaryText}/>
//
// 		})
// 	}
//
//
// 	/**
// 	 * Group By Menu Items
// 	 */
// 	renderGroupByItems() {
// 		const
// 			{
// 				theme,
// 				styles,
// 				issueCriteria
// 			} = this.props,
// 			issueSort = issueCriteria.sort
//
// 		const fields = IssueGroupByFields
// 		const fieldNames = IssueGroupByNames
// 		const groupBy = issueSort.groupBy
// 		const { palette } = theme
//
// 		return (fields).map((field, index) => {
//
// 			const
// 				selected = field === groupBy,
// 				fieldName = fieldNames[ index ]
//
// 			const primaryText = <div style={makeStyle(
// 					styles.list.item.text,
// 					styles.list.item.text.value
// 				)}>
// 				<div>
// 					<Icon
// 						style={{
// 							opacity: selected ? 1 : 0
// 						}}
// 						iconSet='fa'
// 						iconName='check-circle'/>
// 				</div>
// 				<div style={styles.list.item.text.primary}>
// 					{fieldName}
// 				</div>
//
// 				<div style={styles.list.item.text.spacer}/>
//
// 			</div>
//
// 			return <MenuItem
// 				onTouchTap={this.makeOnGroupBySelected(field)}
// 				style={styles.list.item}
// 				primaryText={primaryText}/>
//
// 		})
// 	}
//
// 	/**
// 	 * Render filters
// 	 *
// 	 * @returns {any}
// 	 */
// 	render() {
//
// 		const
// 			{
// 				theme,
// 				styles,
// 				issues = [],
// 				unfilteredIssueIds = [],
// 				issuesGrouped = [],
// 				issueCriteria,
// 				issueFilterMilestones,
// 				issueFilterLabels,
// 				labels,
// 				milestones,
// 			} = this.props,
// 			issueSort = issueCriteria.sort,
//
//
// 			isGrouped = issueSort.groupBy !== 'none',
// 			hasFilters =
// 				getValue(() => issueCriteria.labelIds.length, 0) +
// 				getValue(() => issueCriteria.milestoneIds.length, 0) > 0
//
//
// 		log.debug('Issue filter, has filters', hasFilters, 'labels', issueFilterLabels, 'milestones', issueFilterMilestones)
//
// 		// LABEL
// 		const labelMenuItemText = <div style={styles.list.item.text}>
// 			<div>
// 				<Icon style={styles.list.item.text.icon}
// 				      iconSet='octicon'
// 				      iconName='tag'/>
// 			</div>
// 			<div style={styles.list.item.text.primary}>
// 				Labels
// 			</div>
// 			<div style={styles.list.item.text.spacer}/>
// 			<div style={styles.list.item.text.icon}>
// 				<SvgArrowRight style={{display:'block'}}/>
// 			</div>
// 		</div>
//
// 		// MILESTONE
// 		const milestoneMenuItemText = <div style={styles.list.item.text}>
// 			<div>
// 				<Icon style={styles.list.item.text.icon}
// 				      iconSet='octicon'
// 				      iconName='milestone'/>
// 			</div>
// 			<div style={styles.list.item.text.primary}>
// 				Milestones
// 			</div>
// 			<div style={styles.list.item.text.spacer}/>
// 			<div style={styles.list.item.text.icon}>
// 				<SvgArrowRight style={{display:'block'}}/>
// 			</div>
// 		</div>
//
//
// 		// SORT ORDER
// 		let isAscending = issueSort.direction === 'asc'
// 		const sortOrderMenuItemText = <div style={styles.list.item.text}>
// 			<div>
// 				<Icon style={makeStyle(styles.list.item.text.icon,{
// 					fontSize: 12
// 				})} iconSet='fa' iconName={isAscending ? 'chevron-up' : 'chevron-down'}/>
// 			</div>
// 			<div style={styles.list.item.text.primary}>
// 				Issues in {isAscending ? 'Ascending' : 'Descending'} Order
// 			</div>
// 			<div style={styles.list.item.text.spacer}/>
// 		</div>
//
// 		// SORT BY
// 		const sortByMenuItemText = <div style={styles.list.item.text}>
// 			<div>
// 				<Icon style={styles.list.item.text.icon} iconSet='fa' iconName='sort'/>
// 			</div>
// 			<div style={styles.list.item.text.primary}>
// 				Sort by
// 			</div>
// 			<div style={styles.list.item.text.spacer}/>
// 			<div style={styles.list.item.text.icon}>
// 				<SvgArrowRight style={{display:'block'}}/>
// 			</div>
// 		</div>
//
//
// 		// GROUP BY DIRECTION
// 		isAscending = issueSort.groupByDirection === 'asc'
// 		const groupByDirectionMenuItemText = <div style={styles.list.item.text}>
// 			<div>
// 				<Icon style={makeStyle(styles.list.item.text.icon,{
// 					fontSize: 12
// 				})} iconSet='fa' iconName={isAscending ? 'chevron-up' : 'chevron-down'}/>
// 			</div>
// 			<div style={styles.list.item.text.primary}>
// 				Group are in {isAscending ? 'Ascending' : 'Descending'} Order
// 			</div>
// 			<div style={styles.list.item.text.spacer}/>
// 		</div>
//
// 		// GROUP BY
// 		const groupByMenuItemText = <div style={styles.list.item.text}>
// 			<div>
// 				<Icon style={styles.list.item.text.icon}
// 				      iconSet='fa'
// 				      iconName='group'/>
// 			</div>
// 			<div style={styles.list.item.text.primary}>
// 				Group by
// 			</div>
// 			<div style={styles.list.item.text.spacer}/>
// 			<div style={styles.list.item.text.icon}>
// 				<SvgArrowRight style={{display:'block'}}/>
// 			</div>
// 		</div>
//
// 		// INCLUDE CLOSED
//
// 		const includeClosedMenuItemText = <div style={styles.list.item.text}>
// 			<div>
// 				<Icon style={makeStyle(styles.list.item.text.icon,{
// 					fontSize: 12
// 				})} iconSet='fa' iconName={issueCriteria.includeClosed ? 'check-circle-o' : 'circle-thin'}/>
// 			</div>
// 			<div style={styles.list.item.text.primary}>
// 				Issues Closed Issues
// 			</div>
// 			<div style={styles.list.item.text.spacer}/>
// 		</div>
//
//
// 		const filterIconStyle:any = { height: 24, padding: 0 }
// 		if (hasFilters && !isGrouped)
// 			filterIconStyle.color = theme.issueFilters.hasFiltersColor
//
//
// 		/* Filter menu */
// 		const filterMenu = <IconMenu
// 			iconButtonElement={<IconButton style={filterIconStyle} iconStyle={filterIconStyle}><SvgFilterIcon /></IconButton>}
// 			style={filterIconStyle}
// 			listStyle={theme.list}>
//
// 			{hasFilters &&
// 			// CLEAR FILTERS
// 			<MenuItem primaryText={'Clear Filters'}
// 			          listStyle={theme.list}
// 			          onTouchTap={this.onClearFilters}/>
// 			}
//
// 			{/* SORT ORDER */}
// 			<MenuItem primaryText={sortOrderMenuItemText}
// 			          listStyle={theme.list}
// 			          onTouchTap={this.onSortDirectionChanged}/>
//
// 			{/* SORT BY */}
// 			<MenuItem primaryText={sortByMenuItemText}
// 			          listStyle={theme.list}
// 			          menuItems={this.renderSortByItems()}/>
//
// 			<Divider />
//
// 			{/* SORT ORDER */}
// 			{ issueSort.groupBy !== 'none' &&
// 			<MenuItem primaryText={groupByDirectionMenuItemText}
// 			          listStyle={theme.list}
// 			          onTouchTap={this.onGroupByDirectionChanged}/>
// 			}
//
// 			{/* GROUP BY */}
// 			<MenuItem primaryText={groupByMenuItemText}
// 			          listStyle={theme.list}
// 			          menuItems={this.renderGroupByItems()}
// 			/>
//
// 			<Divider />
//
// 			{/* LABELS */}
// 			<MenuItem primaryText={labelMenuItemText}
// 			          listStyle={theme.list}
// 			          menuItems={this.renderLabelItems()}/>
//
// 			{/* MILESTONES */}
// 			<MenuItem primaryText={milestoneMenuItemText}
// 			          menuItems={this.renderMilestoneItems()}/>
//
// 			{/* TOGGLE INCLUDE CLOSED */}
// 			<MenuItem primaryText={includeClosedMenuItemText}
// 			          listStyle={theme.list}
// 			          onTouchTap={this.onToggleIncludeClosed}/>
// 		</IconMenu>
//
//
// 		// ASSEMBLE
// 		return <div
// 			style={[
// 				styles.root,
// 				// IF EMPTY / HIDE
// 				//issueSort.groupBy === 'none' && !hasFilters && styles.root.empty
// 			]}>
//
// 			<div style={styles.filters}>
//
// 				{!hasFilters ?
// 					<div style={styles.filters.none}>no filters</div> :
// 					<IssueLabelsAndMilestones
// 						style={styles.filters.labels}
// 						labelStyle={styles.filters.labels.label}
// 						onRemove={this.onRemoveItemFromFilter}
// 						showIcon
// 						labels={issueFilterLabels.toArray()}
// 						milestones={issueFilterMilestones.toArray()}
// 					/>
// 				}
//
// 				{/* SPACER to fill empty if any */}
// 				<div style={styles.filters.controls}>
// 					{isGrouped ?
// 						<div style={styles.filters.controls.groupBy}>
// 							{issueSort.groupBy}
// 							{filterMenu}
// 						</div> :
// 						filterMenu}
//
// 					<div style={styles.filters.controls.stats}>
// 						{isGrouped && `${issuesGrouped.length} Groups with `}
// 						{issues.size} Issues
// 						{hasFilters && ` of ${unfilteredIssueIds.size} Issues`}
// 					</div>
//
// 				</div>
//
// 			</div>
//
//
// 		</div>
// 	}
//
// }