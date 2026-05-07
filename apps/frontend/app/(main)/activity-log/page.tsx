'use client'
import NavButton from '../customers/components/NavButton'
import { fetcher } from '../lib'
import {
  DataTableSortMeta,
  IActivityLog,
  IResPaginated,
  IResSingle,
  ISalesPerson,
} from '@saleshub-tsm/types'
import { format, formatDate } from 'date-fns'
import {
  parseAsInteger,
  parseAsIsoDateTime,
  parseAsNativeArrayOf,
  parseAsString,
  useQueryStates,
} from 'nuqs'
import { Button } from 'primereact/button'
import { Calendar } from 'primereact/calendar'
import { Column } from 'primereact/column'
import { DataTable } from 'primereact/datatable'
import { Dropdown } from 'primereact/dropdown'
import { InputText } from 'primereact/inputtext'
import { useEffect, useState } from 'react'
import useSWR from 'swr'

import { useDebounce } from '@/hooks/useDebounce'
import { useAuth } from '@/layout/context/AuthContext'
import { createUrl } from '@/lib/api'

export const parseAsDateOnly = {
  ...parseAsIsoDateTime,

  serialize: (value: Date) => format(value, 'yyyy-MM-dd'),
}
const ActivityLogPage = () => {
  const { isAdmin, user } = useAuth()

  const [filters, setFilters] = useQueryStates(
    {
      page: parseAsInteger.withDefault(1),
      limit: parseAsInteger.withDefault(10),
      search: parseAsString.withDefault(''),
      salesPersonId: parseAsInteger,
      type: parseAsString,
      dates: parseAsNativeArrayOf(parseAsDateOnly).withDefault([]),
      sort: parseAsString.withDefault(''),
      order: parseAsInteger.withDefault(1),
    },
    { shallow: true, history: 'replace' }
  )

  const [localSearch, setLocalSearch] = useState(filters.search)
  const debouncedSearch = useDebounce(localSearch, 400)

  useEffect(() => {
    setFilters({ search: debouncedSearch, page: 1 })
  }, [debouncedSearch])

  const payload = {
    page: filters.page,
    per_page: filters.limit,
    search: filters.search,
    salesPersonId: filters.salesPersonId,
    type: filters.type,
    dates: filters.dates?.map((date) => formatDate(date, 'yyyy-MM-dd')) ?? [],
    sort: filters.sort,
    order: filters.order,
  }

  const logsApi = createUrl('activity-log', payload)

  const { data: activityLogs, isValidating } = useSWR<IResPaginated<IActivityLog>>(
    logsApi,
    fetcher,
    {
      keepPreviousData: true,
      revalidateOnFocus: false,
    }
  )

  const apiSalesPerson = createUrl('sales-persons', { withFilterUser: false })
  const { data: salesPersonData } = useSWR<IResSingle<ISalesPerson>>(apiSalesPerson, fetcher, {
    keepPreviousData: true,
    revalidateOnFocus: false,
  })

  const actionTypeUrl = createUrl('activity-log/action-types')

  const { data: actionTypes } = useSWR<IResSingle<{ action_type: string }>>(
    actionTypeUrl,
    fetcher,
    {
      keepPreviousData: true,
      revalidateOnFocus: false,
    }
  )

  useEffect(() => {
    if (!isAdmin && user?.sales_person?.id) {
      setFilters({
        salesPersonId: Number(user.sales_person.id),
      })
    }
  }, [isAdmin, user])

  const salesPersons = salesPersonData?.data
  const activityLogsData = activityLogs?.data
  const totalRecords = activityLogs?.data.totalRecords
  return (
    <div className="card p-4">
      <NavButton />
      <h5>Activity Log</h5>
      <div className="col-12">
        <h5 className="mb-3">Filter</h5>
        <div className="grid">
          {isAdmin && (
            <div className="col-12 md:col-3">
              <Dropdown
                value={filters.salesPersonId}
                options={salesPersons
                  ?.filter((sp) => sp.user)
                  .map((sp: ISalesPerson) => ({
                    label: sp.SlpName,
                    value: sp.id,
                  }))}
                onChange={(e) => {
                  setFilters({
                    salesPersonId: e.value ?? null,
                    page: 1,
                  })
                }}
                placeholder="Select Sales Person"
                className="w-full"
                showClear
              />
            </div>
          )}

          <div className="col-12 md:col-3">
            <Dropdown
              value={filters.type}
              options={actionTypes?.data?.map(({ action_type }) => ({
                label: action_type,
                value: action_type,
              }))}
              onChange={(e) => {
                setFilters({
                  type: e.value ?? null,
                  page: 1,
                })
              }}
              placeholder="Select Action Type"
              className="w-full"
              showClear
            />
          </div>

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
          <div className="col-12 md:col-3">
            <div className="p-inputgroup">
              <div className="p-inputgroup flex-1">
                <InputText
                  value={localSearch}
                  onChange={(e) => setLocalSearch(e.target.value)}
                  placeholder="Search..."
                  className="w-full"
                />
                {localSearch && (
                  <Button icon="pi pi-times" severity="danger" onClick={() => setLocalSearch('')} />
                )}
              </div>
            </div>
          </div>
        </div>
        <DataTable
          value={activityLogsData?.items ?? []}
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
                },
                { history: 'replace', shallow: true }
              )
            }
          }}
          dataKey="id"
          loading={isValidating}
          emptyMessage="Activity log not found"
          paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
          currentPageReportTemplate="Showing {first} to {last} of {totalRecords} entries"
          rowsPerPageOptions={[10, 25, 50]}
        >
          <Column
            field="user.name"
            header="Name"
            body={(row) => row.user?.name ?? row.username}
            sortable
          />
          <Column
            field="user.sales_person.SlpName"
            header="Sales Person Name"
            body={(row) => row.user?.sales_person?.SlpName ?? ''}
            sortable
          />
          <Column field="action_type" header="Action Type" sortable />
          <Column field="description" header="Description" sortable />
          <Column
            field="created_at"
            header="Date"
            body={(row) => formatDate(row.created_at, 'dd/MM/yyyy HH:mm')}
            sortable
          />
        </DataTable>
      </div>
    </div>
  )
}

export default ActivityLogPage
