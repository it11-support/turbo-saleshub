export const PER_PAGE = 10
export const CUSTOMER_INSIGHT_PERIODS = [1, 3, 6, 9, 12] as const;

export const DATE_FORMATS = {
  DEFAULT: 'YYYY-MM-DD',
  DATETIME: 'YYYY-MM-DD HH:mm:ss',
  TIME: 'HH:mm:ss',
} as const

export const LIMITS = {
  DEFAULT: 5000,
  IMAGE_READ: 3000,
  WINDOW_MS: 15 * 60 * 1000,
} as const

export const SORT_KEYS = {
  CREATED_AT: 'created_at',
  UPDATED_AT: 'updated_at',
  DOC_DATE: 'DocDate',
  CARD_CODE: 'CardCode',
  SLICE_CODE: 'SlpCode',
} as const

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_PER_PAGE: 10,
  MAX_PER_PAGE: 100,
} as const

export const STATUS = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
  PENDING: 'PENDING',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
} as const

export const VISIT_STATUS = {
  PLANNED: 'PLANNED',
  ONGOING: 'ONGOING',
  COMPLETED: 'COMPLETED',
  PENDING: 'PENDING',
  CANCELLED: 'CANCELLED',
  MISSED: 'MISSED',
} as const

export const FOLLOW_UP_TYPES = {
  FEEDBACK: 'FEEDBACK',
  FOLLOW_UP: 'FOLLOW_UP',
  STATUS_UPDATE: 'STATUS_UPDATE',
} as const

export const CONCERN_STATUSES = {
  OPEN: 'OPEN',
  IN_PROGRESS: 'IN_PROGRESS',
  RESOLVED: 'RESOLVED',
  CLOSED: 'CLOSED',
} as const
