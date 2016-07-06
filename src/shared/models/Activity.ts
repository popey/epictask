

import {
	AttributeDescriptor,
	ModelDescriptor,
	Repo as TSRepo,
	DefaultModel
} from 'typestore'


export enum ActivityType {
	RepoSync = 1
}

@ModelDescriptor()
export class Activity extends DefaultModel {



	@AttributeDescriptor({primaryKey:true})
	id:string

	@AttributeDescriptor()
	type:ActivityType

	@AttributeDescriptor()
	timestamp:number

	@AttributeDescriptor()
	objectId:string

	message:string

	constructor(props = {}) {
		super()
		Object.assign(this,props)
	}


}

export class ActivityStore extends TSRepo<Activity> {
	constructor() {
		super(ActivityStore, Activity)
	}

}