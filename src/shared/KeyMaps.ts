
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
	Space,
	Find,
	View1,
	View2,
	SetAssignee,
	SetMilestone,
	AddLabels,
	CreateComment
}

export const Global = {
	[CommonKeys.New]: ['command+n','ctrl+n'],
	[CommonKeys.Edit]: ['command+e','ctrl+e'],
	[CommonKeys.MoveUp]: 'up',
	[CommonKeys.MoveDown]: 'down',
	[CommonKeys.MoveLeft]: 'left',
	[CommonKeys.MoveRight]: 'right',
	[CommonKeys.MoveUpSelect]: 'shift+up',
	[CommonKeys.MoveDownSelect]: 'shift+down',
	[CommonKeys.Enter]: 'enter',
	[CommonKeys.Escape]: 'esc',
	[CommonKeys.Find]: 'command+f',
	[CommonKeys.View1]: 'command+1',
	[CommonKeys.View2]: 'command+2',
	[CommonKeys.Space]: 'space',
	[CommonKeys.Delete]: ['del','backspace'],
	[CommonKeys.SetAssignee]: ['alt+a','a'],
	[CommonKeys.SetMilestone]: ['alt+m','m'],
	[CommonKeys.AddLabels]: ['alt+t','t'],
	[CommonKeys.CreateComment]: ['alt+c','c']

}

export const App = Object.assign({},Global,{

})

export const Main = Object.assign({},Global,{

})