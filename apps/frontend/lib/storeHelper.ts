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
