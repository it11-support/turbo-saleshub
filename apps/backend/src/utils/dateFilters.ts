import dayjs from 'dayjs';

export interface DateRangeFilterOptions {
  field?: string;
  startOfDay?: boolean;
  endOfDay?: boolean;
}

export const buildDateRangeFilter = (
  dates: string[] | undefined,
  options: DateRangeFilterOptions = {}
): Record<string, any>[] | undefined => {
  if (!Array.isArray(dates) || dates.length === 0) {
    return undefined;
  }

  const { field = 'visit_date', startOfDay = true, endOfDay = true } = options;
  const [start, end] = dates;
  const filters: Record<string, any>[] = [];

  if (start && dayjs(start).isValid()) {
    const gteValue = startOfDay ? dayjs(start).startOf('day').toISOString() : dayjs(start).toISOString();
    filters.push({ [field]: { gte: gteValue } });
  }

  if (end && dayjs(end).isValid()) {
    const lteValue = endOfDay ? dayjs(end).endOf('day').toISOString() : dayjs(end).toISOString();
    filters.push({ [field]: { lte: lteValue } });
  }

  return filters.length > 0 ? filters : undefined;
};
