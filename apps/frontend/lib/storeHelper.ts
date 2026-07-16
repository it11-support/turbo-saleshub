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

type IdComparable = { id?: any }

const toNumber = (value: any): number => Number(value)

export const sameId = (a: any, b: any): boolean => toNumber(a) === toNumber(b)

export const updateItemInArray = <T extends IdComparable>(list: T[], id: any, updated: T): T[] =>
  list.map((item) => (sameId(item.id, id) ? updated : item))

export const removeItemFromArray = <T extends IdComparable>(list: T[], id: any): T[] =>
  list.filter((item) => !sameId(item.id, id))

export const addItemToArray = <T>(list: T[], item: T): T[] => [...list, item]

export const unwrapData = (res: any): any => {
  const payload = res?.data ?? res
  return payload?.data ?? payload?.category ?? payload?.status ?? payload
}

export const jsonBody = (data: unknown, method: string = 'POST') => ({
  method,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data),
})
