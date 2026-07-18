'use client'

import VisitDataTable, { SalesVisit } from '../components/visits/VisitDataTable'
import NavButton from '../customers/components/NavButton'
import { visitFilters } from '../visits/components/filters'
import { EFollowUpStatus, IResPaginated, IResSingle, ISalesPerson } from '@saleshub-tsm/types'
import Link from 'next/link'
import { createSerializer, useQueryStates } from 'nuqs'
import { Calendar } from 'primereact/calendar'
import { Dropdown } from 'primereact/dropdown'

import { useFetch } from '@/hooks/useFetch'
import { useAuth } from '@/layout/context/AuthContext'
import { buildVisitPayload } from '@/lib/visits'

const FollowUpsPage = () => {
  const { user, isAdmin } = useAuth()

  const salesPersonId = Number(user?.sales_person?.id)
  const [filters, setFilters] = useQueryStates(visitFilters)

  const { data: salesPersonData } = useFetch<IResSingle<ISalesPerson>>(
    'sales-persons',
    { withFilterUser: false },
    {
      enabled: isAdmin,
    }
  )

  const salesPersons = salesPersonData?.data || []

  const serialize = createSerializer(visitFilters)

  const payload = buildVisitPayload(filters, salesPersonId)

  const fromUrl = `follow-ups${serialize(filters)}`

  const { data: followups, isValidating } = useFetch<IResPaginated<SalesVisit>>(
    'follow-ups',
    payload
  )

  const data = followups?.data.items || []
  const totalRecords = followups?.data.totalRecords || 0
  const totalPages = followups?.data.totalPages || 0

  const followUpsBodyTemplate = (
    rowData: SalesVisit,
    { preloadVisit }: { preloadVisit: (visit: SalesVisit['visits']) => void }
  ) => {
    const visitItems = rowData.visits?.visit_items

    if (!visitItems?.length) return

    const closedStatuses: string[] = [EFollowUpStatus.Done, EFollowUpStatus.Closed]

    const allConcerns = visitItems.flatMap((item) => item.visit_item_concerns || [])

    if (!allConcerns.length || rowData.status !== 'Completed') return

    let openIssuesCount = 0

    const statusCounts = allConcerns.reduce(
      (acc, concern) => {
        const followUps = concern.follow_ups

        const activeStatusObj =
          followUps && followUps.length > 0 ? followUps[0]?.concern_status : concern.status

        const statusName = activeStatusObj?.status
        const statusLevel = activeStatusObj?.level || 'info'
        const statusIcon = activeStatusObj?.icon || 'pi pi-circle' // Fallback jika icon kosong

        if (statusName) {
          if (!acc[statusName]) {
            acc[statusName] = { count: 0, level: statusLevel, icon: statusIcon }
          }

          acc[statusName].count += 1

          if (!closedStatuses.includes(statusName as EFollowUpStatus)) {
            openIssuesCount++
          }
        }
        return acc
      },
      {} as Record<string, { count: number; level: string; icon: string }>
    )

    const sortedStatuses = Object.entries(statusCounts).sort(([statusA], [statusB]) => {
      const isAClosed = closedStatuses.includes(statusA as EFollowUpStatus)
      const isBClosed = closedStatuses.includes(statusB as EFollowUpStatus)

      if (!isAClosed && isBClosed) return -1
      if (isAClosed && !isBClosed) return 1
      return statusA.localeCompare(statusB)
    })

    // 2. Pemetaan warna berbasis string level database
    const getStatusColorClass = (level: string) => {
      switch (level) {
        case 'warning':
          return 'text-yellow-600 font-medium'
        case 'success':
          return 'text-green-600 font-medium'
        case 'danger':
          return 'text-red-500 font-medium'
        default:
          return 'text-blue-600 font-medium'
      }
    }

    return (
      <Link
        href={`/visits/issues/${Number(rowData.visits.id)}?from=${encodeURIComponent(fromUrl)}`}
        className="no-underline"
        prefetch={false}
        onMouseEnter={() => preloadVisit(rowData.visits)}
      >
        <div className="flex flex-column gap-1 cursor-pointer text-sm text-gray-600 hover:text-yellow-600 transition-colors">
          {/* Total Isu Terbuka */}
          <div className="flex align-items-center gap-2 mb-1">
            <i className="pi pi-exclamation-triangle text-yellow-500"></i>
            <span className="font-semibold">
              {openIssuesCount} Open Issue{openIssuesCount > 1 && 's'}
            </span>
          </div>

          {/* Rincian Status Tunggal per Item Lengkap dengan Warna & Icon Dinamis */}
          <div className="pl-4 flex flex-column gap-1 text-xs">
            {sortedStatuses.map(([statusName, data]) => (
              <div
                key={statusName}
                className={`flex align-items-center gap-1.5 capitalize ${getStatusColorClass(
                  data.level
                )}`}
              >
                <span>
                  {data.count} {statusName.toLowerCase()}
                </span>
              </div>
            ))}
          </div>
        </div>
      </Link>
    )
  }

  return (
    <div className="card p-4">
      <NavButton />
      <h5>Follow Ups</h5>
      <div className="col-12">
        <h5 className="mb-3">Filter</h5>

        <div className="grid">
          {/* Status */}
          <div className="col-12 md:col-3">
            <Calendar
              value={filters.dates}
              onChange={(e) => {
                const value = e.value as (Date | null)[] | null

                const clean = value?.filter((d): d is Date => d instanceof Date)

                setFilters({
                  dates: clean?.length ? clean : undefined,
                  page: 1,
                })
              }}
              onClearButtonClick={() => {
                setFilters({
                  dates: null,
                  page: 1,
                })
              }}
              selectionMode="range"
              readOnlyInput
              className="w-full"
              showButtonBar
              placeholder="Select Visit Date Range"
            />
          </div>

          {/* Sales Person */}
          {isAdmin && (
            <div className="col-12 md:col-3">
              <Dropdown
                value={filters.salesPersonId}
                options={salesPersons
                  .filter((sp) => sp.user)
                  .map((sp: ISalesPerson) => ({
                    label: sp.SlpName,
                    value: Number(sp.id),
                  }))}
                onChange={(e) => setFilters({ salesPersonId: e.value ?? null, page: 1 })}
                placeholder="Select Sales Person"
                className="w-full"
                showClear
              />
            </div>
          )}
        </div>
      </div>
      <VisitDataTable
        data={data}
        loading={isValidating}
        totalRecords={totalRecords}
        totalPages={totalPages}
        filters={filters}
        setFilters={setFilters}
        payload={payload}
        fromUrl={fromUrl}
        endpoint="follow-ups"
        followUpsBodyTemplate={followUpsBodyTemplate}
      />
    </div>
  )
}

export default FollowUpsPage
