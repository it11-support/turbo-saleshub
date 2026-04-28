import { IUser } from '../user'

export interface IActivityLog {
  id: number | bigint
  user_id?: number | bigint
  user: IUser
  username?: string
  action_type: string
  description: string
  status: string
  request_path: string
  created_at: Date
}
