import {
	FinderRequest
} from 'typestore'

import { PouchDBRepo,PouchDBMangoFinder} from 'typestore-plugin-pouchdb'
import { User } from "epic-models"

/**
 * Repository for accessing repos
 */
export class UserStoreImpl extends PouchDBRepo<User>  {
	constructor() {
		super(UserStoreImpl,User)
	}
	
	
	@PouchDBMangoFinder({
		single:true,
		indexFields: ['attrs.login'],
		selector:{
			selector: (login:string) => ({login})
		}
	})
	findByLogin(login:string):Promise<User> {
		return null
	}
	
	/**
	 * Find all users who contribute to a repo
	 *
	 * @param request
	 * @param repoIds
	 * @returns {Promise<User[]>}
	 */
	@PouchDBMangoFinder({
		indexFields: ['repoId'],
		selector: (...repoIds:number[]) => ({
			$or: repoIds.map(repoId => ({
				repoIds: {
					$elemMatch:{
						$eq: repoId
					}
				}
			}))
		})
	})
	findByRepoId(request:FinderRequest,...repoIds:number[]):Promise<User[]> {
		return null
	}
	
	@PouchDBMangoFinder({
		all:true,
		includeDocs:false
	})
	findAll():Promise<number[]> {
		return null
	}
	
	
}
