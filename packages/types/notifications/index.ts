export interface INotification {
  id?: number | bigint
  user_id: number | bigint
  title: string
  message: string
  type: string
  action_url?: string
  is_read: boolean
  created_at: Date | string
}
