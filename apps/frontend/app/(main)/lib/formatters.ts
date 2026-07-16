import { format, parseISO } from 'date-fns'

import { formatDate } from '@/lib/dateUtils'

export const formatDateTime = (date?: string | Date | null, fallback = '-'): string => {
  return formatDate(date, { withTime: true, fallback })
}

export const formatDateTimeSeconds = (date?: string | Date | null, fallback = '-'): string => {
  return formatDate(date, { withTime: true, withSeconds: true, fallback })
}

export const isToday = (date?: string | Date | null): boolean => {
  if (!date) return false
  const parsed = typeof date === 'string' ? parseISO(date) : date
  const today = new Date()
  return (
    parsed.getDate() === today.getDate() &&
    parsed.getMonth() === today.getMonth() &&
    parsed.getFullYear() === today.getFullYear()
  )
}

export const isSameDay = (date1?: string | Date | null, date2?: string | Date | null): boolean => {
  if (!date1 || !date2) return false
  const parsed1 = typeof date1 === 'string' ? parseISO(date1) : date1
  const parsed2 = typeof date2 === 'string' ? parseISO(date2) : date2
  return (
    parsed1.getDate() === parsed2.getDate() &&
    parsed1.getMonth() === parsed2.getMonth() &&
    parsed1.getFullYear() === parsed2.getFullYear()
  )
}

export const getMonthName = (monthIndex: number, long = false): string => {
  return format(new Date(2000, monthIndex, 1), long ? 'MMMM' : 'MMM')
}

export const addMonths = (date: Date, months: number): Date => {
  const result = new Date(date)
  result.setMonth(result.getMonth() + months)
  return result
}

export const startOfMonth = (date: Date): Date => {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

export const endOfMonth = (date: Date): Date => {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0)
}
