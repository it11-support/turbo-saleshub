import { StateCreator } from 'zustand'

type SetState<T> = Parameters<StateCreator<T>>[0]

export const withLoading = async <T extends { loading: boolean }, R>(
  set: SetState<T>,
  fn: () => Promise<R>,
  onError?: (err: unknown) => void
): Promise<R> => {
  set((state) => ({
    ...state,
    loading: true,
  }))

  try {
    return await fn()
  } catch (err) {
    onError?.(err)
    throw err
  } finally {
    set((state) => ({
      ...state,
      loading: false,
    }))
  }
}

type NumberLike = string | number | bigint | null | undefined
type IdComparable = { id?: NumberLike }

const toNumber = (value: NumberLike): number => Number(value)

export const sameId = (a: NumberLike, b: NumberLike): boolean => toNumber(a) === toNumber(b)

export const updateItemInArray = <T extends IdComparable>(
  list: T[],
  id: NumberLike,
  updated: T
): T[] => list.map((item) => (sameId(item.id, id) ? updated : item))

export const removeItemFromArray = <T extends IdComparable>(list: T[], id: NumberLike): T[] =>
  list.filter((item) => !sameId(item.id, id))

export const addItemToArray = <T>(list: T[], item: T): T[] => [...list, item]

export const unwrapData = <T>(res: unknown): T => {
  const payload = (res as { data?: unknown })?.data ?? res

  return (
    (payload as { data?: T })?.data ??
    (payload as { category?: T })?.category ??
    (payload as { status?: T })?.status ??
    (payload as T)
  )
}

export const jsonBody = (data: unknown, method: string = 'POST') => ({
  method,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data),
})
