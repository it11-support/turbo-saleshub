import { EBadgeVariant, VisitStatus } from '@saleshub-tsm/types'

export const variantOptions = [
  { label: 'Info', value: EBadgeVariant.INFO },
  { label: 'Warning', value: EBadgeVariant.WARNING },
  { label: 'Success', value: EBadgeVariant.SUCCESS },
  { label: 'Danger', value: EBadgeVariant.DANGER },
  { label: 'Secondary', value: EBadgeVariant.SECONDARY },
]

export const variantColors: Record<string, string> = {
  info: 'var(--primary-color)',
  warning: 'var(--yellow-500)',
  success: 'var(--green-500)',
  danger: 'var(--red-500)',
  secondary: 'var(--text-color-secondary)',
}

export const ICON_OPTIONS = [
  // basic states
  { label: 'Pending', value: 'pi pi-clock' },
  { label: 'In Progress', value: 'pi pi-spinner' },
  { label: 'Completed', value: 'pi pi-check' },
  { label: 'Closed', value: 'pi pi-times' },

  // communication / waiting
  { label: 'Waiting Response', value: 'pi pi-hourglass' },
  { label: 'Contacted', value: 'pi pi-phone' },
  { label: 'Message Sent', value: 'pi pi-envelope' },

  // attention
  { label: 'Warning', value: 'pi pi-exclamation-triangle' },
  { label: 'Information', value: 'pi pi-info-circle' },

  // control state
  { label: 'Paused', value: 'pi pi-pause' },
  { label: 'Stopped', value: 'pi pi-stop' },
  { label: 'Locked', value: 'pi pi-lock' },
  { label: 'Cancelled', value: 'pi pi-ban' },

  // retry / process
  { label: 'Retrying', value: 'pi pi-refresh' },
  { label: 'Syncing', value: 'pi pi-sync' },

  // business context
  { label: 'Deal', value: 'pi pi-dollar' },
  { label: 'Assigned', value: 'pi pi-user' },
]

export const CHART_COLORS = {
  blue: '#3B82F6',
  blueLight: 'rgba(59, 130, 246, 0.18)',
  green: '#22C55E',
  greenLight: 'rgba(34, 197, 94, 0.15)',
  orange: '#F97316',
  orangeLight: 'rgba(249, 115, 22, 0.1)',
  red: '#EF4444',
  redLight: 'rgba(239, 68, 68, 0.1)',
  gray: '#6B7280',
  grayLight: 'rgba(107, 114, 128, 0.1)',
  purple: '#A855F7',
  purpleLight: 'rgba(168, 85, 247, 0.1)',
  primary: '#2563EB',
  primaryLight: 'rgba(37, 99, 235, 0.15)',
  success: '#16A34A',
  danger: '#DC2626',
}

export const CHART_DEFAULTS = {
  tension: 0.4,
  borderWidth: 3,
  pointRadius: 3,
  pointHoverRadius: 5,
  pointBorderWidth: 2,
  fill: true,
  cubicInterpolationMode: 'monotone' as const,
}

export const STATUS_COLORS = {
  [VisitStatus.Completed]: 'var(--green-500)',
  [VisitStatus.Planned]: 'var(--orange-500)',
  [VisitStatus.Pending]: 'var(--orange-500)',
  [VisitStatus.Cancelled]: 'var(--red-500)',
  [VisitStatus.Missed]: 'var(--red-500)',
  [VisitStatus.Ongoing]: 'var(--green-500)',
}

export const ITEM_RANGE_CATEGORIES = [
  '01-10',
  '11-20',
  '21-30',
  '31-40',
  '41-50',
  '51-60',
  '61-70',
  '71-80',
  '81-90',
  '91-100',
  '>100',
]

export const CARD_RADIUS = '12px'
export const CARD_PADDING = '1rem'
export const CARD_BODY_PADDING = '0.5rem'

export const PER_PAGE = 10
export const CUSTOMER_INSIGHT_PERIODS = [1, 3, 6, 9, 12] as const

export const DEFAULT_DATE_FORMAT = 'dd MMMM yyyy'
export const DEFAULT_DATETIME_FORMAT = 'dd MMMM yyyy HH:mm'
export const DEFAULT_DATETIME_SECONDS_FORMAT = 'dd MMMM yyyy HH:mm:ss'

export const API_ENDPOINTS = {
  SALES_PERSONS: 'sales-persons',
  CUSTOMERS: 'customers',
  VISITS: 'visits',
  VISIT_SCHEDULES: 'visit-schedules',
  PRODUCTS: 'products',
  ORDERS: 'orders',
  REPORTS: 'reports',
  DASHBOARD: 'dashboard',
  ACTIVITY_LOG: 'activity-log',
} as const

export const STOCK_STATUS_OPTIONS = [
  {
    label: 'Available',
    value: 'AVAILABLE',
    icon: 'pi pi-check-circle',
    color: 'text-green-500',
  },
  {
    label: 'Low',
    value: 'LOW',
    icon: 'pi pi-exclamation-triangle',
    color: 'text-orange-500',
  },
  {
    label: 'Empty',
    value: 'OUT_OF_STOCK',
    icon: 'pi pi-times-circle',
    color: 'text-red-500',
  },
]

export const QUERY_KEYS = {
  DASHBOARD: 'dashboard',
  CUSTOMERS: 'customers',
  VISITS: 'visits',
  VISIT_SCHEDULES: 'visit-schedules',
  PRODUCTS: 'products',
  SALES_PERSONS: 'sales-persons',
  ACTIVITY_LOG: 'activity-log',
} as const

export const MONTH_SHORT = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
]

export const MONTH_LONG = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]
