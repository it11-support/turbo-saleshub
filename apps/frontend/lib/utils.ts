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

export const getGrowthInfo = (
  current: number,
  previous: number
): {
  growthPercent: number
  diff: number
  isPositive: boolean
  arrow: string
} => {
  if (!previous) {
    return {
      growthPercent: current > 0 ? 100 : 0,
      diff: current,
      isPositive: current > 0,
      arrow: current > 0 ? '▲' : '▼',
    }
  }

  const growth = ((current - previous) / previous) * 100
  const diff = current - previous
  const isPositive = growth >= 0

  return {
    growthPercent: Number(growth.toFixed(2)),
    diff: Number(diff.toFixed(2)),
    isPositive,
    arrow: isPositive ? '▲' : '▼',
  }
}

export const formatGrowthPercent = (value: number, decimals = 2): string => {
  return `${value.toFixed(decimals)} %`
}

export const isPositiveGrowth = (value: number): boolean => {
  return value > 0
}

export const getGrowthColor = (value: number): string => {
  return value > 0 ? 'text-green-500' : value < 0 ? 'text-red-500' : 'text-gray-500'
}

export const getGrowthBorderColor = (value: number): string => {
  return value > 0 ? 'var(--green-500)' : value < 0 ? 'var(--red-500)' : 'var(--gray-500)'
}
