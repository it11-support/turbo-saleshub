import { $api } from '@/lib/api'

export const fetcher = (url: string) => $api(url)
