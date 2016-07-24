import {
	ModelDescriptor,
	AttributeDescriptor,
	DefaultModel,
	Repo as TSRepo
} from 'typestore'

import {PouchDBMangoFinder} from 'typestore-plugin-pouchdb'
import {RegisterModel} from 'shared/Registry'



@RegisterModel
@ModelDescriptor()
export class Label extends DefaultModel {

	static isLabel(o:any):o is Label {
		return o.url && o.name && !o.id
	}

	/**
	 * Revive from JS/JSON
	 *
	 * @param o
	 */
	static fromJS = (o:any) => new Label(o)

	@AttributeDescriptor({primaryKey:true})
	url: string

	@AttributeDescriptor({index:{name:'repoId'}})
	repoId:number

	@AttributeDescriptor({index:{name:'labelName'}})
	name: string;

	@AttributeDescriptor()
	color: string;

	constructor(props = {}) {
		super()
		Object.assign(this,props)
	}
}

export class LabelStore extends TSRepo<Label> {
	constructor() {
		super(LabelStore,Label)
	}

	/**
	 * Find all labels in provided repo ids
	 * @param repoIds
	 * @returns {Label[]}
	 */
	@PouchDBMangoFinder({
		indexFields: ['repoId'],
		selector: (...repoIds:number[]) => ({
			$or: repoIds.map(repoId => ({repoId}))
		})
	})
	findByRepoId(...repoIds:number[]):Promise<Label[]> {
		return null
	}

	@PouchDBMangoFinder({
		includeDocs: false,
		indexFields: ['repoId'],
		selector: (...repoIds) => ({
			$or: repoIds.map(repoId => ({repoId}))
		})
	})
	findUrlsByRepoId(...repoIds:number[]):Promise<string[]> {
		return null
	}



}


