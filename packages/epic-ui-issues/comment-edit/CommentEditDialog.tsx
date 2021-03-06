/**
 * Created by jglanz on 7/24/16.
 */
// Imports
import { getValue, cloneObjectShallow } from "epic-global"
import { ThemedStyles, IThemedAttributes } from "epic-styles"
import { Comment, Issue } from "epic-models"
import { getUIActions } from "epic-typedux"
import { MarkdownEditor, FileDrop, RepoLabel, Form } from "epic-ui-components/common"
import { createSaveCancelActions, DialogRoot } from "epic-ui-components/layout/dialog"

import { ViewRoot } from "epic-ui-components/layout"
import { CommentEditState } from "./CommentEditState"
import CommentEditController from "./CommentEditController"


// Constants
const
	log = getLogger(__filename)


/**
 * Add component styles
 */
function baseStyles(topStyles, theme, palette) {
	const
		{
			accent,
			warn,
			text,
			secondary
		} = palette
	
	return {
		root: [ FlexColumn, FlexAuto, {} ],
		
		titleBar: [ {
			label: [ FlexRowCenter, {
				fontSize: rem(1.6),
				
				repo: [ makePaddingRem(0, 0.6, 0, 0), {} ],
				
				number: [ {
					fontStyle: 'italic',
					paddingTop: rem(0.3),
					//fontSize: rem(1.5),
					fontWeight: 700,
					paddingRight: rem(0.5),
					color: text.secondary
				} ]
			} ],
			
			subTitle: [ Styles.FlexRow, Styles.makePaddingRem(0, 1.5, 0, 0), {
				textTransform: 'uppercase',
				fontSize: rem(1.6)
			} ]
		} ],
		
		form: [ FlexColumn, FlexScale, Fill, {
			
			editor: [ FlexScale ]
		} ]
	}
}

/**
 * IIssueCommentDialogProps
 */
export interface ICommentEditDialogProps extends IThemedAttributes, IViewRootProps<CommentEditController,CommentEditState> {
	saving?: boolean
	savingError?: Error
	
}

/**
 * IIssueCommentDialogState
 */
export interface ICommentEditDialogState {
	mdEditor?: MarkdownEditor
}

/**
 * IssueCommentDialog
 *
 * @class IssueCommentDialog
 * @constructor
 **/
@ViewRoot(CommentEditController, CommentEditState)
// If you have a specific theme key you want to
// merge provide it as the second param
@ThemedStyles(baseStyles, 'dialog')
export class CommentEditDialog extends React.Component<ICommentEditDialogProps,ICommentEditDialogState> {
	
	refs: any
	
	get form(): Form {
		return getValue(() => this.refs.form)
	}
	
	/**
	 * State
	 *
	 * @returns {CommentEditState}
	 */
	private get viewState(): CommentEditState {
		return getValue(() => this.props.viewState)
	}
	
	/**
	 * Get view controller
	 *
	 * @returns {CommentEditController}
	 */
	private get viewController(): CommentEditController {
		return getValue(() => this.props.viewController)
	}
	
	/**
	 * Get the comment being edited
	 *
	 * @returns {Comment}
	 */
	private get editingComment(): Comment {
		return getValue(() => this.viewState.editingComment, new Comment())
	}
	
	/**
	 * Get the parent issue
	 *
	 * @returns {Issue}
	 */
	private get issue(): Issue {
		return getValue(() => this.viewState.issue, new Issue())
	}
	
	
	/**
	 * on form valid
	 *
	 * @param values
	 */
	private onFormValid = (values: IFormFieldValue[]) => {
		log.debug(`onValid`, values)
	}
	
	/**
	 * On form invalid
	 *
	 * @param values
	 */
	private onFormInvalid = (values: IFormFieldValue[]) => {
		log.debug(`onInvalid`, values)
	}
	
	/**
	 * On submit when the form is valid
	 *
	 * @param form
	 * @param model
	 * @param values
	 */
	private onFormValidSubmit = (form: IForm, model: any, values: IFormFieldValue[]) => this.onSave()
	
	
	/**
	 * Hide and focus on issue panel
	 */
	private hide = () => {
		getUIActions().closeWindow()
	}
	
	/**
	 * onSave
	 *
	 * @param event
	 */
	private onSave = (event = null) => this.viewController.save()
	
	
	/**
	 * On body change, just update the state
	 *
	 * @param value
	 */
	onMarkdownChange = (value) => {
		log.debug('markdown change', value)
		
		this.viewController.setEditingComment(
			cloneObjectShallow(this.editingComment, { body: value })
		)
	}
	
	/**
	 * Set md editor ref
	 *
	 * @param mdEditor
	 */
	private setMarkdownEditor = (mdEditor: MarkdownEditor) => {
		this.setState({ mdEditor })
	}
	
	/**
	 * On drop event handler
	 *
	 * @param data
	 */
	onDrop = (data: DataTransfer) => {
		try {
			const
				mde = getValue(() => this.state.mdEditor)
			
			if (!mde) {
				return log.warn(`MDE is null`)
			}
			mde.onDrop(data)
		} catch (err) {
			log.error(`drop failed`,err)
		}
	}
	
	
	/**
	 * Before mount update the state
	 */
	componentWillMount() {
		
		this.viewController.setMounted(
			true,
			this.props
		)
		
		
	}
	
	/**
	 * Update state with new props
	 *
	 * @param newProps
	 */
	componentWillReceiveProps(newProps) {
		
	}
	
	render() {
		const
			{ editingComment:comment, issue } = this,
			ready = this.viewState.ready
		
		if (!ready || !comment || !issue)
			return React.DOM.noscript()
		
		const
			{
				theme,
				palette,
				styles,
				saving
			} = this.props
		
		const
			
			subTitleNode = <div style={[Styles.FlexRowCenter,Styles.makePaddingRem(0.5,0,0,0)]}>
				{/*<span>Comment</span>&nbsp;&nbsp;*/}
				{/*<RepoLabel repo={issue.repo}*/}
				{/*style={makeStyle(styles.titleBar.label,styles.titleBar.label.repo)}/>*/}
				
				<div style={[Styles.Ellipsis,Styles.FlexScale]}>
					<span style={[styles.titleBar.label.number]}>#{issue.number}:</span>
					{issue.title}
				</div>
			</div>,
			// subTitleNode = <span key={issue.id} style={styles.title.issue}>
			// 		<span style={styles.title.issueNumber}>
			// 			#{issue.number}&nbsp;
			// 		</span>
			// 		<span style={styles.title.issueTitle}>
			// 			{issue.title}
			// 		</span>
			// 	</span>,
			titleActionNodes = createSaveCancelActions(theme, palette, this.onSave, this.hide),
			title = (comment.id ? `edit` : `create`) + ` comment`,
			rootStyle = makeStyle(Fill, FlexScale, FlexColumn)
		
		
		return <DialogRoot
			title={title}
			titleNode={title}
			subTitleNode={subTitleNode}
			titleActionNodes={titleActionNodes}
			saving={saving}
		>
			
			<Form
				id="issue-edit-form"
				ref="form"
				submitOnCmdCtrlEnter={true}
				onInvalid={this.onFormInvalid}
				onValid={this.onFormValid}
				onValidSubmit={this.onFormValidSubmit}
				styles={[FlexColumn,FlexScale]}>
				
				
				<FileDrop onFilesDropped={this.onDrop}
				          acceptedTypes={[/image/]}
				          dropEffect='all'
				          style={rootStyle}>
					
					
					<MarkdownEditor
						ref={this.setMarkdownEditor}
						autoFocus={true}
						
						onChange={this.onMarkdownChange}
						defaultValue={getValue(() => comment.body)}
						onKeyDown={getValue(() => this.form.onKeyDown)}
						style={styles.form.editor}
					/>
				
				
				</FileDrop>
			
			</Form>
		</DialogRoot>
		
	}
	
}

export default CommentEditDialog