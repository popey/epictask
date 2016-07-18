import {
	ModelDescriptor,
	AttributeDescriptor,
	FinderDescriptor,
	DefaultModel,
	DefaultValue,
	Repo as TSRepo
} from 'typestore'

import {PouchDBFullTextFinder, PouchDBMangoFinder} from 'typestore-plugin-pouchdb'
import {User} from './User'
import {RegisterModel} from '../Registry'


@RegisterModel
@ModelDescriptor()
export class Milestone extends DefaultModel {

	/**
	 * Revive from JS/JSON
	 *
	 * @param o
	 */
	static fromJS = (o:any) => new Milestone(o)


	@AttributeDescriptor({primaryKey:true})
	id: number

	@AttributeDescriptor()
	repoId:number

	url: string
	html_url: string
	labels_url: string


	number: number
	state: string
	title: string
	description: string
	creator: User
	open_issues: number
	closed_issues: number
	created_at: Date
	updated_at: Date
	closed_at: Date
	due_on: Date

	constructor(props = {}) {
		super()
		Object.assign(this,props)
	}
}


export class MilestoneStore extends TSRepo<Milestone> {
	constructor() {
		super(MilestoneStore,Milestone)
	}

	/**
	 * Find all issues in provided repo ids
	 * @param repoIds
	 * @returns {Promise<Milestone[]>}
	 */
	@PouchDBMangoFinder({
		indexFields: ['repoId'],
		selector: (...repoIds:number[]) => ({
			$or: repoIds.map(repoId => ({repoId}))
		})
	})
	findByRepoId(...repoIds:number[]):Promise<Milestone[]> {
		return null
	}

	@PouchDBMangoFinder({
		includeDocs: false,
		indexFields: ['repoId'],
		selector: (...repoIds) => ({
			$or: repoIds.map(repoId => ({repoId}))
		})
	})
	findIdsByRepoId(...repoIds:number[]):Promise<number[]> {
		return null
	}

}


