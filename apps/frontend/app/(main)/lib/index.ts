import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export const cn = (...inputs: ClassValue[]) => {
  return twMerge(clsx(inputs))
}

export * from './fetcher'
export * from './visits'
export * from './chartOptions'
export * from './apiClient'
export * from './formatters'
