import { useDebounce } from './useDebounce'
import { useEffect, useState } from 'react'

type UseDebouncedFilterOptions = {
  value: string
  setValue: (updater: Record<string, any>) => void
  delay?: number
  key?: string
  resetPage?: boolean
  clearToNull?: boolean
}

export const useDebouncedFilter = ({
  value,
  setValue,
  delay = 400,
  key = 'search',
  resetPage = true,
  clearToNull = false,
}: UseDebouncedFilterOptions) => {
  const [local, setLocal] = useState(value)
  const debounced = useDebounce(local, delay)

  // Push debounced local value ke query/store
  useEffect(() => {
    if (debounced !== value) {
      setValue({
        [key]: clearToNull ? debounced || null : debounced,
        ...(resetPage ? { page: 1 } : {}),
      })
    }
  }, [debounced])

  // Sync balik jika value berubah eksternal (clear button, URL change, dll)
  useEffect(() => {
    setLocal(value)
  }, [value])

  return { local, setLocal }
}
