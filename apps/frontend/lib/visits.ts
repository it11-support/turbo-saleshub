import { formatDate } from 'date-fns'

export type VisitPayloadFilters = {
  page: number
  limit: number
  dates?: Date[] | null
  salesPersonId?: number | null
  status?: string | null
  needFollowUp?: boolean | null
  sort?: string | null
  order?: number | null
}

export const getVisitDetailUrl = (
  visit: { id: number | bigint; status?: string },
  fromUrl: string
) => {
  const visitId = Number(visit.id)
  const path = visit.status === 'Ongoing' ? `/visits/${visitId}` : `/visits/details/${visitId}`
  return `${path}?from=${encodeURIComponent(fromUrl)}`
}

export const getVisitStatusMeta = (status?: string) => {
  if (status === 'Completed') {
    return { colorClass: 'text-green-500', icon: 'pi pi-check' }
  }

  if (status === 'Missed') {
    return { colorClass: 'text-red-500', icon: 'pi pi-times' }
  }

  return { colorClass: 'text-orange-500', icon: 'pi pi-clock' }
}

export const buildVisitPayload = (filters: VisitPayloadFilters, salesPersonId?: number) => ({
  page: filters.page,
  per_page: filters.limit,
  dates: filters.dates?.map((date) => formatDate(date, 'yyyy-MM-dd')) ?? [],
  salesPersonId: filters.salesPersonId ?? salesPersonId,
  status: filters.status,
  needFollowUp: filters.needFollowUp,
  sort: filters.sort,
  order: filters.order,
})
