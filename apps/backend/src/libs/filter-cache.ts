import { cacheGet, cacheSet } from '@/libs/cache.js'

export const getCachedFilterOptions = async <T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl = 3600
): Promise<T> => {
  const cached = await cacheGet<T>(key)

  if (cached) {
    return cached
  }

  const data = await fetcher()

  await cacheSet(
    key,
    data,
    ttl
  )

  return data
}
