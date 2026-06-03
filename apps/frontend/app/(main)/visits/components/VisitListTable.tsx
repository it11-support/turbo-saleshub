'use client'
import { visitFilters } from './filters'
import { fetcher } from '../../lib'
import {
  DataTableSortMeta,
  EFollowUpStatus,
  IResPaginated,
  ISalesVisitRule,
  IVisit,
  IVisitItemConcern,
} from '@saleshub-tsm/types'
import { formatDate } from 'date-fns'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createSerializer, useQueryStates } from 'nuqs'
import { Button } from 'primereact/button'
import { Column } from 'primereact/column'
import { DataTable } from 'primereact/datatable'
import useSWR, { preload } from 'swr'

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
const VisitListTable = () => {
  const [filters, setFilters] = useQueryStates(visitFilters)

  const router = useRouter()

  const serialize = createSerializer(visitFilters)
  const payload = {
    page: filters.page,
    per_page: filters.limit,
    dates: filters.dates?.map((date) => formatDate(date, 'yyyy-MM-dd')) ?? [],
    salesPersonId: filters.salesPersonId,
    status: filters.status,
    needFollowUp: filters.needFollowUp,
    sort: filters.sort,
    order: filters.order,
  }

  const visitsUrl = createUrl('visits', payload)

  const fromUrl = `visits${serialize(filters)}`

  const { data: visitData, isValidating } = useSWR<IResPaginated<IVisit>>(visitsUrl, fetcher, {
    keepPreviousData: true,
    revalidateOnFocus: false,
  })

  const data = visitData?.data.items || []
  const totalRecords = visitData?.data.totalRecords || 0
  const totalPages = visitData?.data.totalPages || 0

  const preloadVisits = (targetPage: number) => {
    const cacheKey = createUrl('visits', { ...payload, page: targetPage })
    preload(cacheKey, fetcher)
  }
  const visitDateTemplate = (rowData: SalesVisit) => {
    return (
      <div className="flex flex-column justify-content-center align-items-start font-semibold">
        <p className="text-muted">{formatDate(rowData.visit_date, 'MMM do, yyyy')}</p>
        <p className="text-muted">
          {formatDate(rowData.visits.start_at, 'HH:mm')}{' '}
          {rowData.visits.end_at && ` - ${formatDate(rowData.visits.end_at, 'HH:mm')}`}
        </p>
      </div>
    )
  }

  const followUpsBodyTemplate = (rowData: SalesVisit) => {
    const visitItems = rowData.visits?.visit_items
    if (!visitItems?.length) return

    // 1. Kumpulkan semua concern dari visit items
    const allConcerns = visitItems.flatMap((item) => item.visit_item_concerns || [])

    // 2. Fungsi untuk mengambil status paling akhir dari array follow_ups
    const getLatestStatus = (concern: IVisitItemConcern): EFollowUpStatus | null => {
      const followUps = concern.follow_ups || []
      if (followUps.length > 0) {
        // Mengambil data follow_up urutan paling terakhir (terbaru)
        const latestFollowUp = followUps[followUps.length - 1]
        return latestFollowUp.concern_status?.status as EFollowUpStatus
      }
      // Fallback jika tidak ada riwayat follow_ups
      return concern.status?.status as EFollowUpStatus
    }

    // 3. Kelompokkan data berdasarkan status terakhirnya
    const openIssues = allConcerns.filter((concern) => {
      const latestStatus = getLatestStatus(concern)
      return latestStatus && ![EFollowUpStatus.Done, EFollowUpStatus.Closed].includes(latestStatus)
    })

    const doneIssues = allConcerns.filter((concern) => {
      return getLatestStatus(concern) === EFollowUpStatus.Done
    })

    const closedIssues = allConcerns.filter((concern) => {
      return getLatestStatus(concern) === EFollowUpStatus.Closed
    })

    // 4. Validasi tampilan: jika tidak ada isu apa pun atau visit belum Completed, sembunyikan komponen
    const hasAnyIssue = openIssues.length > 0 || doneIssues.length > 0 || closedIssues.length > 0
    if (!hasAnyIssue || rowData.status !== 'Completed') return

    return (
      <Link
        href={`/visits/issues/${Number(rowData.visits.id)}?from=${encodeURIComponent(fromUrl)}`}
        className="no-underline"
        prefetch={false}
      >
        <div className="flex flex-column gap-2 cursor-pointer text-sm">
          {/* Tampilan jika ada Open Issues (Belum Done & Belum Closed) */}
          {openIssues.length > 0 && (
            <div className="flex align-items-center gap-2 text-gray-600 hover:text-yellow-600 transition-colors">
              <i className="pi pi-exclamation-triangle text-yellow-500"></i>
              <span className="font-medium">{openIssues.length} Open Issues</span>
            </div>
          )}

          {/* Tampilan jika ada Done Issues */}
          {doneIssues.length > 0 && (
            <div className="flex align-items-center gap-2 text-green-600 hover:text-green-700 transition-colors">
              <i className="pi pi-check-circle text-green-500"></i>
              <span className="font-medium">{doneIssues.length} Done</span>
            </div>
          )}

          {/* Tampilan jika ada Closed Issues */}
          {closedIssues.length > 0 && (
            <div className="flex align-items-center gap-2 text-red-600 hover:text-red-700 transition-colors">
              <i className="pi pi-times text-red-500"></i>
              <span className="font-medium">{closedIssues.length} Closed</span>
            </div>
          )}
        </div>
      </Link>
    )
  }

  const handleClickEdit = (data: IVisit) => {
    if (data.status === 'Ongoing') {
      router.push(`/visits/${data.id}?from=${encodeURIComponent(fromUrl)}`)
      return
    }
    router.push(`/visits/details/${data.id}?from=${encodeURIComponent(fromUrl)}`)
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

  return (
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
        rowsPerPageOptions={[10, 20, 25, 50]}
        pt={{
          paginator: {
            pageButton: () => ({
              onMouseEnter: async (e: React.MouseEvent<HTMLButtonElement>) => {
                const text = e.currentTarget.textContent
                if (text) {
                  const pageNumber = parseInt(text, 10)
                  preloadVisits(pageNumber)
                }
              },
            }),
            firstPageButton: () => ({
              onMouseEnter: () => preloadVisits(1),
            }),
            prevPageButton: () => ({
              onMouseEnter: () => preloadVisits(filters.page - 1),
            }),
            nextPageButton: () => ({
              onMouseEnter: () => preloadVisits(filters.page + 1),
            }),
            lastPageButton: () => ({
              onMouseEnter: () => preloadVisits(totalPages),
            }),
          },
        }}
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
  )
}

export default VisitListTable
