import { format, Locale, parseISO } from 'date-fns'
import { enUS as localeEn } from 'date-fns/locale'

type FormatDateOptions = {
  withTime?: boolean
  withSeconds?: boolean
  locale?: Locale
  fallback?: string
}

/**
 * Format date string / Date ke format lokal Indonesia (default)
 */
export const formatDate = (date?: string | Date | null, options?: FormatDateOptions): string => {
  if (!date) return options?.fallback ?? '-'

  const parsed = typeof date === 'string' ? parseISO(date) : date

  if (isNaN(parsed.getTime())) {
    return options?.fallback ?? '-'
  }

  const { withTime = false, withSeconds = false, locale = localeEn } = options || {}

  let pattern = 'dd MMMM yyyy'

  if (withTime && withSeconds) pattern = 'dd MMMM yyyy HH:mm:ss'
  else if (withTime) pattern = 'dd MMMM yyyy HH:mm'

  return format(parsed, pattern, { locale })
}

export const normalizeDateToUTC = (date: Date | null): Date | null => {
  if (!date) return null
  return new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
}
