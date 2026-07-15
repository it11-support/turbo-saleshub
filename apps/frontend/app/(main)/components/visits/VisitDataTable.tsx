'use client'

import { fetcher } from '../../lib'
import { IVisit } from '@saleshub-tsm/types'
import type { ISalesVisitRule } from '@saleshub-tsm/types'
import { formatDate } from 'date-fns'
import { useRouter } from 'next/navigation'
import { Button } from 'primereact/button'
import { Column } from 'primereact/column'
import { DataTable, DataTableSortMeta } from 'primereact/datatable'
import { preload } from 'swr'

import { createUrl } from '@/lib/api'
import { getVisitDetailUrl, getVisitStatusMeta } from '@/lib/visits'

export type SalesVisit = {
  customer_id: number
  id: number
  is_virtual: boolean
  max_items_per_visit: number
  rule: ISalesVisitRule
  sales_person_id: number
  status: string
  visits: IVisit
  visit_date: string
  roles?: {
    role?: string
  }
}

type VisitFilters = {
  page: number
  limit: number
  sort?: string | null
  order?: number | null
}

type SetVisitFilters = (
  values: Partial<VisitFilters>,
  options?: { history?: 'push' | 'replace'; shallow?: boolean }
) => void

type FollowUpsTemplateHelpers = {
  preloadVisit: (visit: IVisit) => void
}

type VisitDataTableProps = {
  data: SalesVisit[]
  loading: boolean
  totalRecords: number
  totalPages: number
  filters: VisitFilters
  setFilters: SetVisitFilters
  payload: Record<string, unknown>
  fromUrl: string
  endpoint: 'visits' | 'follow-ups'
  followUpsBodyTemplate: (rowData: SalesVisit, helpers: FollowUpsTemplateHelpers) => React.ReactNode
}

const VisitDataTable = (props: VisitDataTableProps) => {
  const {
    data,
    loading,
    totalRecords,
    totalPages,
    filters,
    setFilters,
    payload,
    fromUrl,
    endpoint,
    followUpsBodyTemplate,
  } = props

  const router = useRouter()

  const preloadPage = (targetPage: number) => {
    if (targetPage < 1 || targetPage > totalPages) return

    const cacheKey = createUrl(endpoint, { ...payload, page: targetPage })
    preload(cacheKey, fetcher)
  }

  const preloadVisit = (visit: IVisit) => {
    const cacheKey =
      visit.status === 'Ongoing'
        ? createUrl(`visit/${visit.id}`)
        : createUrl(`visit/${visit.id}/details`)

    preload(cacheKey, fetcher)
    preload(createUrl('concern-categories/statuses'), fetcher)
  }

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

  const statusBodyTemplate = (rowData: SalesVisit) => {
    const { colorClass, icon } = getVisitStatusMeta(rowData.status)

    return (
      <span className={`flex align-items-center gap-2 ${colorClass}`}>
        <i className={icon}></i>
        {rowData.status}
      </span>
    )
  }

  const handleClickEdit = (visit: IVisit) => {
    router.push(getVisitDetailUrl(visit, fromUrl))
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
          { field: filters.sort ?? '', order: filters.order as DataTableSortMeta['order'] },
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
        loading={loading}
        emptyMessage="No visit found"
        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
        currentPageReportTemplate="Showing {first} to {last} of {totalRecords} entries"
        rowsPerPageOptions={[10, 20, 25, 50]}
        pt={{
          paginator: {
            pageButton: () => ({
              onMouseEnter: async (e: React.MouseEvent<HTMLButtonElement>) => {
                const text = e.currentTarget.textContent
                if (text) preloadPage(parseInt(text, 10))
              },
            }),
            firstPageButton: () => ({
              onMouseEnter: () => preloadPage(1),
            }),
            prevPageButton: () => ({
              onMouseEnter: () => preloadPage(filters.page - 1),
            }),
            nextPageButton: () => ({
              onMouseEnter: () => preloadPage(filters.page + 1),
            }),
            lastPageButton: () => ({
              onMouseEnter: () => preloadPage(totalPages),
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
        <Column
          header="Follow Ups"
          body={(rowData) => followUpsBodyTemplate(rowData, { preloadVisit })}
        />
        <Column
          field="visits.status"
          header="Visit Status"
          sortField="status"
          body={statusBodyTemplate}
          sortable
        />

        <Column
          header="Action"
          body={(rowData: SalesVisit) => {
            const isAdmin = rowData.roles?.role === 'admin'
            const isOngoing = rowData.status === 'Ongoing'

            return (
              <Button
                onClick={() => handleClickEdit(rowData.visits)}
                disabled={isAdmin}
                className={`p-button-text p-button-plain p-button-sm ${
                  isAdmin ? 'p-disabled' : ''
                }`}
                onMouseEnter={() => preloadVisit(rowData.visits)}
              >
                {isOngoing ? 'Continue' : 'View Details'}
                <i className={`pi ${isOngoing ? 'pi-pencil' : 'pi-eye'} py-1 ml-2`}></i>
              </Button>
            )
          }}
        />
      </DataTable>
    </div>
  )
}

export default VisitDataTable
