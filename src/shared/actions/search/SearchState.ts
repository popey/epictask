/**
 * State Holder
 */
import {List,Record,Map} from 'immutable'
import {ActionMessage} from 'typedux'
import {RegisterModel} from 'shared/Registry'





export enum SearchType {
	Issue = 1,
	Repo,
	AvailableRepo,
	Milestone,
	Label
}


export enum SearchSource {
	Issue = 1,
	Repo,
	GitHub,
	AvailableRepo,
	Milestone,
	Label
}

export const SearchTypeSourceMap = {
	[SearchType.Issue]: [SearchSource.Issue],
	[SearchType.Repo]: [SearchSource.Repo,SearchSource.GitHub],
	[SearchType.AvailableRepo]: [SearchSource.AvailableRepo],
	[SearchType.Label]: [SearchSource.Label],
	[SearchType.Milestone]: [SearchSource.Milestone]
}

export const SearchSourceTypeMap = {
	[SearchSource.Issue]:SearchType.Issue,
	[SearchSource.Repo]:SearchType.Repo,
	[SearchSource.GitHub]:SearchType.Repo,
	[SearchSource.AvailableRepo]:SearchType.AvailableRepo,
	[SearchSource.Milestone]:SearchType.Milestone,
	[SearchSource.Label]:SearchType.Label

}

@RegisterModel
export class SearchItem {

	static fromJS(o:any) {
		return new SearchItem(o)
	}

	id:string|number
	type:SearchType
	score:number
	value:any
	
	
	constructor(id:string|number,type:SearchType,value,score:number)
	constructor(obj:any)
	constructor(idOrObject:any, type:SearchType = null,value = null,score:number = 1) {
		if (_.isNumber(idOrObject) || _.isString(idOrObject)) {
			Object.assign(this, {
				id: idOrObject,
				type,
				score,
				value
			})
		} else {
			Object.assign(this, idOrObject)
		}

	}
}

/**
 * Search Result
 */
@RegisterModel
export class SearchResult {

	static fromJS(o:any) {
		if (o && o instanceof SearchResult)
			return o
		
		return new SearchResult(o)
	}

	items:SearchItem[]
	type:SearchType
	source:SearchSource
	dataId:string
	searchId:string

	constructor(searchId:string,items:SearchItem[],type:SearchType, source:SearchSource,count:number,total:number)
	constructor(obj:any)
	constructor(
		searchIdOrObject:any,
		items:SearchItem[] = [],
		type:SearchType = null,
		source:SearchSource = null,
		public count:number = -1,
		public total:number = -1
	) {
		if (_.isString(searchIdOrObject)) {
			Object.assign(this,{
				searchId: searchIdOrObject,
				items,
				type,
				source
			})
		} else {
			const obj = searchIdOrObject,
				baseItems = (obj.items && Array.isArray(obj.items) || List.isList(obj.items)) ?
					_.toJS(obj.items) :
					[]

			const newItems = baseItems.map(item => SearchItem.fromJS(item))

			Object.assign(this,obj,{items:newItems})
		}

		this.dataId = this.dataId || `${this.searchId}-${this.source}`
	}

}

