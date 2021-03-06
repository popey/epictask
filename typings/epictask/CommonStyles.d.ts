

declare namespace Styles {
	export const TinyColor:any,
		CSSHoverState:string,
		CSSActiveState:string,
		CSSFocusState:string,
		Transparent:string,
		Fill:any,
		FillWidth:any,
		FillHeight:any,
		FillWindow:any,
		Flex:any,
		FlexScale:any,
		FlexAuto:any,
		FlexRow:any,
		FlexRowCenter:any,
		FlexRowReverse:any,
		FlexColumn:any,
		FlexColumnReverse:any,
		FlexColumnCenter:any,
		FlexAlignCenter:any,
		FlexAlignStart:any,
		FlexAlignEnd:any,
		FlexNoWrap:any,
		FlexWrap:any,
		
		Ellipsis:any,
		PositionRelative:any,
		PositionAbsolute:any,
		FontBlack:any,
		OverflowHidden:any,
		OverflowAuto:any,
		rem:(val:number) => string,
		makeLinearGradient:(...colorStops:string[]) => string,
		makeBorderRem:(top?:number, right?:number, bottom?:number, left?:number) => any,
		makePaddingRem:(top?:number, right?:number, bottom?:number, left?:number) => any,
		makeMarginRem:(top?:number, right?:number, bottom?:number, left?:number) => any,
		createStyles:(styles:any, topStyles?:any, theme?, palette?) => any,
		convertRem:(val:number) => number,
		makeTransition:(props?:string[]|string, duration?, easing?:string) => any,
		makeAbsolute:(top?:number, left?:number) => any,
		makeStyle:(...styles) => any,
		mergeStyles:(...styles) => any,
		makeFlex:(flexGrow?:number, flexShrink?:number, flexBasis?:number|string) => any,
		makeFlexAlign:(alignItems:string, justifyContent?:string) => any,
		CursorPointer:any
}

declare function rem(val:number):string
declare function createStyles(styles:any, topStyles?:any, theme?, palette?)
declare function convertRem(val:number):number
declare function mergeStyles(...styles):any
declare function makeStyle(...styles):any

declare const TinyColor:any,
	CSSHoverState:string,
	CSSActiveState:string,
	CSSFocusState:string,
	Transparent:string,
	Fill:any,
	FillWidth:any,
	FillHeight:any,
	FillWindow:any,
	Flex:any,
	FlexScale:any,
	FlexAuto:any,
	FlexRow:any,
	FlexRowCenter:any,
	FlexRowReverse:any,
	FlexColumn:any,
	FlexColumnReverse:any,
	FlexColumnCenter:any,
	FlexAlignCenter:any,
	FlexAlignStart:any,
	FlexAlignEnd:any,
	FlexNoWrap:any,
	FlexWrap:any,
	
	Ellipsis:any,
	PositionRelative:any,
	PositionAbsolute:any,
	FontBlack:any,
	OverflowHidden:any,
	OverflowAuto:any,
	
	makeLinearGradient:(...colorStops:string[]) => string,
	makeBorderRem:(top?:number, right?:number, bottom?:number, left?:number) => any,
	makePaddingRem:(top?:number, right?:number, bottom?:number, left?:number) => any,
	makeMarginRem:(top?:number, right?:number, bottom?:number, left?:number) => any,
	
	makeTransition:(props?:string[]|string, duration?, easing?:string) => any,
	makeAbsolute:(top?:number, left?:number) => any,
	
	makeFlex:(flexGrow?:number, flexShrink?:number, flexBasis?:number|string) => any,
	makeFlexAlign:(alignItems:string, justifyContent?:string) => any,
	CursorPointer:any

