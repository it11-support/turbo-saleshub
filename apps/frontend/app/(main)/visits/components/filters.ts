import { format } from 'date-fns'
import {
  parseAsBoolean,
  parseAsInteger,
  parseAsIsoDateTime,
  parseAsNativeArrayOf,
  parseAsString,
} from 'nuqs'

export const parseAsDateOnly = {
  ...parseAsIsoDateTime,

  serialize: (value: Date) => format(value, 'yyyy-MM-dd'),
}

export const visitFilters = {
  page: parseAsInteger.withDefault(1),
  limit: parseAsInteger.withDefault(10),

  salesPersonId: parseAsInteger.withDefault(undefined as unknown as number),

  status: parseAsString,
  needFollowUp: parseAsBoolean.withDefault(false),

  // ✅ Date range
  dates: parseAsNativeArrayOf(parseAsDateOnly).withDefault([]),

  // ✅ Sort (multi sort PrimeReact)
  sort: parseAsString.withDefault(''),
  order: parseAsInteger.withDefault(-1),
}
