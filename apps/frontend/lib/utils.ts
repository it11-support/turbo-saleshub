import { TRevenueSummary } from '@saleshub-tsm/types'
import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const calculateGrowth = (current: number, last: number): TRevenueSummary => {
  const diff = current - last
  const growthPercent = last !== 0 ? (diff / last) * 100 : 0

  return {
    current: Number(current),
    last: Number(last),
    diff: Number(diff.toFixed(2)),
    growthPercent: Number(growthPercent.toFixed(2)),
  }
}
