'use client'

import NavButton from '../customers/components/NavButton'
import { fetcher } from '../lib'
import { visitFilters } from '../visits/components/filters'
import {
  DataTableSortMeta,
  EFollowUpStatus,
  IResPaginated,
  IResSingle,
  ISalesPerson,
  ISalesVisitRule,
  IVisit,
} from '@saleshub-tsm/types'
import { formatDate } from 'date-fns'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useQueryStates } from 'nuqs'
import { Button } from 'primereact/button'
import { Calendar } from 'primereact/calendar'
import { Column } from 'primereact/column'
import { DataTable } from 'primereact/datatable'
import { Dropdown } from 'primereact/dropdown'
import useSWR from 'swr'

import { useAuth } from '@/layout/context/AuthContext'
import { createUrl } from '@/lib/api'

type SalesVisit = {
  customer_id: number
  id: number
  is_virtual: boolean
  max_items_per_visit: number
  rule: ISalesVisitRule
  sales_person_id: number
  status: string
  visits: IVisit
  visit_date: string
}

const FollowUpsPage = () => {
  const { user, isAdmin } = useAuth()
  const router = useRouter()

  const salesPersonId = Number(user?.sales_person?.id)
  const [filters, setFilters] = useQueryStates(visitFilters)
  const apiSalesPerson = createUrl('sales-persons', { withFilterUser: false })

  const { data: salesPersonData } = useSWR<IResSingle<ISalesPerson>>(
    isAdmin ? apiSalesPerson : null,
    fetcher,
    {
      keepPreviousData: true,
      revalidateOnFocus: false,
    }
  )

  const salesPersons = salesPersonData?.data || []

  const payload = {
    page: filters.page,
    per_page: filters.limit,
    dates: filters.dates?.map((date) => formatDate(date, 'yyyy-MM-dd')) ?? [],
    salesPersonId: filters.salesPersonId ?? salesPersonId,
    status: filters.status,
    needFollowUp: filters.needFollowUp,
    sort: filters.sort,
    order: filters.order,
  }

  const apiFollowupUrl = createUrl('follow-ups', payload)

  const { data: followups, isValidating } = useSWR<IResPaginated<IVisit>>(apiFollowupUrl, fetcher, {
    revalidateOnFocus: false,
  })

  const data = followups?.data.items || []
  const totalRecords = followups?.data.totalRecords || 0

  const visitDateTemplate = (rowData: SalesVisit) => {
    return (
      <div className="flex flex-column justify-content-center align-items-start font-semibold">
        <p className="text-muted">{formatDate(rowData.visit_date, 'MMM do, yyyy')}</p>
        <p className="text-muted">
          {rowData.visits?.start_at ? formatDate(rowData.visits.start_at, 'HH:mm') : ''}{' '}
          {rowData.visits?.end_at && ` - ${formatDate(rowData.visits.end_at, 'HH:mm')}`}
        </p>
      </div>
    )
  }
  const followUpsBodyTemplate = (rowData: SalesVisit) => {
    const visitItems = rowData.visits?.visit_items

    if (!visitItems?.length) return

    const closedStatuses: string[] = [EFollowUpStatus.Done, EFollowUpStatus.Closed]

    const allConcerns = visitItems.flatMap((item) => item.visit_item_concerns || [])

    if (!allConcerns.length || rowData.status !== 'Completed') return

    let openIssuesCount = 0

    const statusCounts = allConcerns.reduce((acc, concern) => {
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
    }, {} as Record<string, { count: number; level: string; icon: string }>)

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
      <Link href={`/visits/issues/${Number(rowData.visits.id)}`} className="no-underline">
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

  const statusBodyTemplate = (rowData: SalesVisit) => {
    const statusColor =
      rowData.status === 'Completed'
        ? 'text-green-500'
        : rowData.status === 'Missed'
        ? 'text-red-500'
        : 'text-orange-500'

    const statusIcon =
      rowData.status === 'Completed'
        ? 'pi pi-check'
        : rowData.status === 'Missed'
        ? 'pi pi-times'
        : 'pi pi-clock'

    return (
      <span className={`flex align-items-center gap-2 ${statusColor}`}>
        <i className={statusIcon}></i>
        {rowData.status}
      </span>
    )
  }

  const handleClickEdit = (data: IVisit) => {
    if (data.status === 'Ongoing') {
      router.push(`/visits/${data.id}`)
      return
    }
    router.push(`/visits/details/${data.id}`)
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
      <div className="mt-3">
        <DataTable
          value={data}
          paginator
          lazy
          rows={filters.limit}
          first={(filters.page - 1) * filters.limit}
          totalRecords={totalRecords}
          sortMode="multiple"
          multiSortMeta={[
            { field: filters.sort, order: filters.order as DataTableSortMeta['order'] },
          ]}
          onPage={(e) => {
            setFilters({ page: Number(e.page) + 1, limit: e.rows })
          }}
          onSort={(e) => {
            const sortMeta = e.multiSortMeta?.[0]
            if (sortMeta) {
              setFilters(
                {
                  sort: sortMeta.field,
                  order: sortMeta.order,
                  page: 1,
                },
                { history: 'replace', shallow: true }
              )
            }
          }}
          dataKey="id"
          loading={isValidating}
          emptyMessage="No visit found"
          paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
          currentPageReportTemplate="Showing {first} to {last} of {totalRecords} entries"
          rowsPerPageOptions={[10, 25, 50]}
        >
          <Column field="visit_date" header="Visit Date" sortable body={visitDateTemplate} />
          <Column
            field="visits.customer.CardName"
            header="Customer"
            sortField="customer.CardName"
            sortable
          />

          <Column field="visits.notes" header="Visit Notes" sortField="notes" sortable />
          <Column header="Follow Ups" body={(rowData) => followUpsBodyTemplate(rowData)} />
          <Column
            field="visits.status"
            header="Visit Status"
            sortField="status"
            body={statusBodyTemplate}
            sortable
          />

          <Column
            header="Action"
            body={(rowData) => {
              const isAdmin = rowData.roles?.role === 'admin'
              const isOnGoing = rowData.status === 'Ongoing'
              return (
                <>
                  {isOnGoing ? (
                    <Button
                      onClick={() => handleClickEdit(rowData)}
                      disabled={isAdmin}
                      className={`p-button-text p-button-plain p-button-sm ${
                        isAdmin ? 'p-disabled' : ''
                      }`}
                    >
                      Continue<i className="pi pi-pencil py-1 ml-2"></i>
                    </Button>
                  ) : (
                    <Button
                      onClick={() => handleClickEdit(rowData)}
                      disabled={isAdmin}
                      className={`p-button-text p-button-plain p-button-sm ${
                        isAdmin ? 'p-disabled' : ''
                      }`}
                    >
                      View Details <i className="pi pi-eye py-1 ml-2"></i>
                    </Button>
                  )}
                </>
              )
            }}
          />
        </DataTable>
      </div>
    </div>
  )
}

export default FollowUpsPage
