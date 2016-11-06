/**
 * Created by jglanz on 6/14/16.
 */
// Imports
import { createStructuredSelector } from "reselect"
import { List } from "immutable"
import { connect } from "react-redux"
import { Issue, AvailableRepo, Repo, User, Label } from "epic-models"
import { LabelFieldEditor, MilestoneSelect, AssigneeSelect, MarkdownEditor } from "epic-ui-components/fields"
import { Icon, RepoName, getGithubErrorText, FileDrop, PureRender } from "epic-ui-components/common"
import { DialogRoot, createSaveCancelActions } from "epic-ui-components/layout/dialog"
import { MenuItem, SelectField, TextField } from "material-ui"
import { cloneObject, getValue, canAssignIssue, canCreateIssue } from "epic-global"
import {
	repoIdPredicate,
	enabledAvailableReposSelector,
	appUserSelector,
	getUIActions,
	getIssueActions
} from "epic-typedux"
import {
	ThemedStyles,
	makeThemeFontSize,
	FlexColumn,
	FlexAuto,
	FlexRowCenter,
	FillHeight,
	IThemedAttributes
} from "epic-styles"
import { CommandType, ContainerNames, getCommandManager } from "epic-command-manager"
import { CommandComponent, CommandRoot, CommandContainerBuilder } from "epic-command-manager-ui"
import { cloneObjectShallow } from "../../../epic-global/ObjectUtil"


const
	log = getLogger(__filename),
	{ Style } = Radium

// DEBUG
log.setOverrideLevel(LogLevel.DEBUG)

const baseStyles = (topStyles, theme, palette) => {
	const
		{
			accent,
			warn,
			text,
			secondary
		} = palette,
		
		rowStyle = [ FlexRow, FlexAuto, FlexAlignStart, FillWidth, makePaddingRem(0, 1) ]
	
	return {
		dialog: [ {
			minHeight: 500,
			minWidth: 500
		} ],
		root: [ FlexColumn, FlexAuto ],
		
		actions: [ FlexRowCenter, FillHeight ],
		
		
		titleBar: [ {
			label: [ FlexRowCenter, {
				fontSize: rem(1.6),
				
				repo: [ makePaddingRem(0, 0.6, 0, 0), {} ],
				
				number: [ {
					paddingTop: rem(0.3),
					fontSize: rem(1.4),
					fontWeight: 100,
					color: text.secondary
				} ]
			} ]
		} ],
		
		
		input: [ {
			padding: '0.3rem 1rem',
			fontWeight: 400,
			
			floatingLabel: [ {
				left: rem(1)
			} ],
			
			floatingLabelFocus: [ {
				transform: 'perspective(1px) scale(0.75) translate3d(-10px, -40px, 0px)'
			} ],
			
			underlineFocus: [ {
				width: 'auto',
				left: 10,
				right: 10
			} ]
			
		} ],
		
		
		form: [ FlexScale, FlexColumn, FillWidth, {
			
			title: [ {
				flex: '1 0 50%',
				padding: "1rem 0",
				height: 72
			} ],
			
			repo: [ FlexScale, {
				height: 50,
				margin: "1.1rem 0 1.1rem 0.5rem",
				padding: "1rem 0",
				menu: [ {
					transform: 'translate(0,-30%)'
				} ],
				list: [ {
					padding: '0 0 0 0 !important'
				} ],
				item: [ FlexRow, makeFlexAlign('center', 'flex-start'), {
					label: [ FlexScale, Ellipsis, {
						fontSize: makeThemeFontSize(1.2),
						padding: '0 0 0 1rem'
					} ]
				} ]
			} ],
			
			
			milestone: [ FlexScale, {
				height: 50,
				margin: "1.1rem 0 1.1rem 0.5rem",
				padding: "1rem 0",
				menu: [ {
					transform: 'translate(0,-30%)'
				} ],
				list: [ {
					padding: '0 0 0 0 !important'
				} ],
				item: [ FlexRow, makeFlexAlign('center', 'flex-start'), {
					label: [ FlexScale, Ellipsis, {
						fontSize: makeThemeFontSize(1.2),
						padding: '0 0 0 1rem'
					} ]
				} ]
			} ],
			
			assignee: [ FlexScale, {
				height: 50,
				margin: "1.1rem 0 1.1rem 0rem",
				padding: "1rem 0",
				menu: [ {
					transform: 'translate(0,-30%)'
				} ],
				list: [ {
					padding: '0 0 0 0 !important'
				} ],
				item: [ FlexRow, makeFlexAlign('center', 'flex-start'), {
					label: [ FlexScale, Ellipsis, {
						padding: '0 0 0 1rem'
					} ]
				} ],
				
				avatar: [ FlexRow, makeFlexAlign('center', 'flex-start'), {
					label: {
						fontWeight: 500,
					},
					avatar: {
						height: 22,
						width: 22,
					}
					
				} ]
			} ],
			
			row1: [ ...rowStyle, { overflow: 'visible' } ],
			row2: [ ...rowStyle, { marginBottom: rem(0.8) } ],
			row3: [ ...rowStyle, {} ],
			
			editor: [ FlexScale, FillWidth ]
			
		} ],
		
		
	}
}


/**
 * IIssueEditDialogProps
 */
export interface IIssueEditDialogProps extends IThemedAttributes {
	saveError?:any
	editingIssue?:Issue
	availableRepos?:List<AvailableRepo>
	user?:User
	saving?:boolean
}

export interface IIssueEditDialogState {
	availableRepo?:AvailableRepo
	titleValue?:string
	bodyValue?:string
	labels?:Label[]
	
	repoMenuItems?:any[]
	
	mdEditor?:MarkdownEditor
}

/**
 * IssueEditDialog
 *
 * @class IssueEditDialog
 * @constructor
 **/


@connect(createStructuredSelector({
	user: appUserSelector,
	//editingIssue: editingIssueSelector,
	availableRepos: enabledAvailableReposSelector,
	// saving: issueSavingSelector,
	// saveError: issueSaveErrorSelector
	
}))
@CommandComponent()
@ThemedStyles(baseStyles, 'dialog', 'issueEditDialog', 'form')
@PureRender
export class IssueEditDialog extends React.Component<IIssueEditDialogProps,IIssueEditDialogState> {
	
	
	
	
	commandItems = (builder:CommandContainerBuilder) =>
		builder
			.command(CommandType.Container,
				'Save Comment',
				(cmd, event) => this.onSave(event),
				"CommandOrControl+Enter")
			.command(CommandType.Container,
				'Close Dialog',
				this.hide,
				"Escape")
			
			.make()
	
	
	commandComponentId = ContainerNames.IssueEditDialog
	
	
	/**
	 * Hide/close the window
	 */
	private hide = () => {
		const
			windowId = getWindowId()
		
		if (windowId)
			getUIActions().closeWindow(windowId)
	}
	
	/**
	 * On cancel - call hide
	 */
	private onCancel = this.hide
	
	/**
	 * On save - send to actions with child window id
	 *
	 * @param event
	 */
	private onSave = async (event) => {
		!this.props.saving &&
		await getIssueActions().saveIssue(
			cloneObjectShallow(this.props.editingIssue, this.textInputState())
		)
		
		getUIActions().closeWindow(getWindowId())
	}
	
	
	private textInputState = () => ({
		title: this.state.titleValue,
		body: this.state.bodyValue
	})
	
	private updateIssueState = (newIssueProps) => {}
	// getIssueActions().setEditingIssue(
	// 	new Issue(Object.assign(
	// 		{},
	// 		this.props.editingIssue,
	// 		this.textInputState(),
	// 		newIssueProps
	// 	))
	// )
	
	
	/**
	 * On body change, just update the state
	 *
	 * @param value
	 */
	private onMarkdownChange = (value) => {
		log.debug('markdown change', value)
		this.setState({ bodyValue: value })
	}
	
	/**
	 * Set md editor ref
	 *
	 * @param mdEditor
	 */
	private setMarkdownEditor = (mdEditor:MarkdownEditor) => {
		this.setState({ mdEditor })
	}
	
	
	/**
	 * Title change
	 *
	 * @param event
	 * @param value
	 */
	onTitleChange = (event, value) => {
		log.debug(`Title change`,value)
		this.setState({ titleValue: value })
	}
	
	/**
	 * Repo Change
	 *
	 * @param event
	 * @param index
	 * @param value
	 */
	onRepoChange = (event, index, value) => {
		const editingIssue = new Issue(assign({}, this.props.editingIssue, this.textInputState()))
		editingIssue.repoId = value
		
		//getIssueActions().setEditingIssue(editingIssue)
	}
	
	onMilestoneChange = (milestone) => {
		this.updateIssueState({ milestone })
		
	}
	
	onAssigneeChange = (assignee) => {
		this.updateIssueState({ assignee })
	}
	
	onLabelsChanged = (newLabels:Label[]) => {
		const { editingIssue } = this.props
		
		if (editingIssue) {
			this.updateIssueState({ labels: newLabels })
		}
	}
	
	
	/**
	 * Create repo menu items
	 *
	 * @param availableRepos
	 * @param s
	 * @returns {any[]}
	 */
	makeRepoMenuItems(availableRepos:List<AvailableRepo>, s) {
		
		const makeRepoLabel = (availRepoItem) => (
			<div style={s.form.repo.item}>
				<Icon iconSet='octicon' iconName='repo'/>
				<RepoName repo={availRepoItem.repo} style={s.form.repo.item.label}/>
			
			</div>
		)
		
		return availableRepos.map(availRepoItem => (
			<MenuItem key={availRepoItem.repoId}
			          className='issueEditDialogFormMenuItem'
			          value={availRepoItem.repoId}
			          style={s.menuItem}
			          primaryText={makeRepoLabel(availRepoItem)}
			/>
		))
	}
	
	/**
	 * Create a new state for dialog
	 *
	 * @param props
	 * @returns {{availableRepo: any, bodyValue: any, titleValue: any, repoMenuItems: any[], milestoneMenuItems: (any[]|any), assigneeMenuItems: any}}
	 */
	getNewState(props:IIssueEditDialogProps) {
		const
			{ styles, editingIssue, open } = props,
			repoId = editingIssue && editingIssue.repoId
		
		let
			{ availableRepos } = props
		
		const
			newState = {
				repoMenuItems: this.makeRepoMenuItems(availableRepos, styles)
			}
		
		if (!editingIssue)
			return newState as any
		
		let
			labels = Array<Label>()
		
		if (editingIssue.id > 0) {
			availableRepos = availableRepos.filter(item => item.repoId === repoId) as List<AvailableRepo>
		} else {
			availableRepos = availableRepos.filter(it => canCreateIssue(it.repo)) as List<AvailableRepo>
		}
		
		
		// SET REPO LABELS, MILESTONES, COLLABS
		if (editingIssue.repoId) {
			let
				availRepo = availableRepos.find(it => it.id === editingIssue.repoId)
			
			labels = !availRepo ? [] : availRepo.labels
		}
		
		let
			bodyValue = getValue(() => this.state.bodyValue,_.get(editingIssue, 'body', '')),
			titleValue = getValue(() => this.state.titleValue)
		
		if (!bodyValue || !bodyValue.length)
			bodyValue = _.get(editingIssue, 'body', '')
		
		if (!titleValue || !titleValue.length)
			titleValue = _.get(editingIssue, 'title', '')
				
		
		return Object.assign(newState,{
			availableRepo: editingIssue && availableRepos.find(repoIdPredicate(editingIssue)),
			bodyValue,
			titleValue,
			labels
		})
	}
	
	
	// /**
	//  * Should update
	//  *
	//  * @param nextProps
	//  * @param nextState
	//  * @returns {boolean}
	//  */
	// shouldComponentUpdate(nextProps:IIssueEditDialogProps, nextState:IIssueEditDialogState) {
	// 	return !shallowEquals(this.state, nextState, 'availableRepo', 'labels', 'repoMenuItems') ||
	// 		!shallowEquals(this.props, nextProps, 'theme', 'styles', 'editingIssue', 'saving')
	// }
	//
	
	/**
	 * On prop update
	 *
	 * @param nextProps
	 */
	componentWillReceiveProps = (nextProps) => this.setState(this.getNewState(nextProps))
	
	/**
	 * On mount
	 */
	componentWillMount = () => this.setState(this.getNewState(this.props))
	
	
	/**
	 * On drop event handler
	 *
	 * @param data
	 */
	onDrop = (data:DataTransfer) => {
		const
			mde = getValue(() => this.state.mdEditor)
		
		mde.onDrop(data)
	}
	
	
	render() {
		
		const
			{ styles, palette, theme, open, user, saveError, saving } = this.props,
			{ labels, availableRepo } = this.state,
			repo = availableRepo && availableRepo.repo ? availableRepo.repo : {} as Repo
		
		let
			editingIssue:Issue = null
		
		if (!editingIssue) {
			editingIssue = this.props.editingIssue || new Issue()
				//return <div/>
		}
		
		const
			canAssign = canAssignIssue(repo),
			
			titleNode = <div style={makeStyle(styles.titleBar.label)}>
				{editingIssue.id ? <div style={styles.titleBar.label}>
					<RepoName repo={editingIssue.repo}
					          style={makeStyle(styles.titleBar.label,styles.titleBar.label.repo)}/>
					<span style={[styles.titleBar.label.number]}>#{editingIssue.number}</span>
				</div> : `CREATE`}
			</div>,
			
			titleActionNodes = createSaveCancelActions(theme, palette, this.onSave, this.onCancel)
		
		return <CommandRoot
			id={ContainerNames.IssueEditDialog}
			component={this}
			style={makeStyle(Fill)}>
			
			<DialogRoot
				titleMode='horizontal'
				titleNode={titleNode}
				titleActionNodes={titleActionNodes}
				saving={saving}
				styles={styles.dialog}
			>
				
				
				<FileDrop onFilesDropped={this.onDrop}
				          acceptedTypes={[/image/]}
				          dropEffect='all'
				          style={styles.form}>
					
					<div style={styles.form.row1}>
						<TextField defaultValue={this.state.titleValue || ''}
						           onChange={this.onTitleChange}
						           errorStyle={{transform: 'translate(0,1rem)'}}
						           errorText={getGithubErrorText(saveError,'title')}
						           hintText="TITLE"
						           hintStyle={makeStyle(styles.input.hint,{transform: 'translate(1.3rem,-1rem)'})}
						           style={styles.form.title}
						           inputStyle={styles.input}
						           underlineStyle={styles.input.underlineDisabled}
						           underlineDisabledStyle={styles.input.underlineDisabled}
						           underlineFocusStyle={styles.input.underlineFocus}
						           underlineShow={true}
						           fullWidth={true}
						           
						           autoFocus/>
						
					</div>
					<div style={styles.form.row2}>
						{/* REPO */}
						{!editingIssue.id &&
						
						<SelectField value={editingIssue.repoId}
						             style={makeStyle(styles.form.repo,styles.menu)}
						             inputStyle={styles.input}
						             labelStyle={styles.form.repo.item.label}
						             iconStyle={styles.menu}
						             onChange={this.onRepoChange}
						             underlineStyle={styles.input.underlineDisabled}
						             underlineDisabledStyle={styles.input.underlineDisabled}
						             underlineFocusStyle={styles.input.underlineFocus}
						             menuListStyle={makeStyle(styles.select.list)}
						             menuStyle={makeStyle(styles.menu,styles.form.repo.menu)}
						             underlineShow={true}
						             fullWidth={true}
						>
							
							{this.state.repoMenuItems}
						</SelectField>
						}
						{/* Only show assignee drop down if push permission */}
						{canAssign &&
						<AssigneeSelect
							style={makeStyle(styles.form.assignee,styles.menu)}
							assignee={editingIssue.assignee}
							repoId={editingIssue.repoId}
							underlineShow={true}
							onSelect={this.onAssigneeChange}/>
						}
						
						
						{/* MILESTONE */}
						<MilestoneSelect
							style={makeStyle(styles.form.milestone,styles.menu)}
							milestone={editingIssue.milestone}
							repoId={editingIssue.repoId}
							iconStyle={{top:8,right:-14}}
							underlineShow={true}
							onSelect={this.onMilestoneChange}
						/>
					
					
					</div>
					
					<LabelFieldEditor labels={editingIssue.labels || []}
					                  id="issueEditDialogLabels"
					                  hint="Labels"
					                  mode="normal"
					                  hintAlways={true}
					                  style={{marginBottom: rem(1.5)}}
					                  availableLabels={labels}
					                  onLabelsChanged={this.onLabelsChanged}
					                  onKeyDown={(event) => {
					                  	getCommandManager().handleKeyDown(event as any,true)
					                  }}
					                  chipStyle={makeMarginRem(1,0.5)}
					                  hintStyle={makeStyle(styles.input.hint,{left:10,bottom: 8})}
					/>
					
					<MarkdownEditor
						ref={this.setMarkdownEditor}
						autoFocus={false}
						onKeyDown={(event) => getCommandManager().handleKeyDown(event as any,true)}
						onChange={this.onMarkdownChange}
						
						defaultValue={_.get(editingIssue,'body','')}
						style={styles.form.editor}
					/>
				
				</FileDrop>
			
			</DialogRoot>
		</CommandRoot>
	}
	
}


export default IssueEditDialog