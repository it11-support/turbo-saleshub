'use client'

import { fetcher } from '../lib'
import { getClass, segmentToStars } from './components/functions'
import NavButton from './components/NavButton'
import { DataTableSortMeta, ICustomer } from '@saleshub-tsm/types'
import {
  parseAsArrayOf,
  parseAsBoolean,
  parseAsInteger,
  parseAsJson,
  parseAsString,
  useQueryStates,
} from 'nuqs'
import { Button } from 'primereact/button'
import { Checkbox } from 'primereact/checkbox'
import { Column } from 'primereact/column'
import { DataTable } from 'primereact/datatable'
import { InputText } from 'primereact/inputtext'
import { MultiSelect } from 'primereact/multiselect'
import { Rating } from 'primereact/rating'
import { Slider } from 'primereact/slider'
import { useEffect, useState } from 'react'
import useSWR from 'swr'

import { useDebounce } from '@/hooks/useDebounce'
import { useAuth } from '@/layout/context/AuthContext'
import useIsMobile from '@/layout/mobile/useIsMobile'
import { createUrl } from '@/lib/api'
import { useCustomerStore } from '@/stores/customers'

export default function CustomerTable() {
  const isMobile = useIsMobile(768)
  const { isAdmin } = useAuth()

  // Ambil setter dari store untuk metadata dropdown
  const { setGroupNames, setSalesPersonNames, setSubGroupNames } = useCustomerStore()

  // 1. Nuqs Query States (Source of Truth untuk Filter)
  const [filters, setFilters] = useQueryStates(
    {
      page: parseAsInteger.withDefault(1),
      limit: parseAsInteger.withDefault(10),
      search: parseAsString.withDefault(''),
      groups: parseAsArrayOf(parseAsString).withDefault([]),
      subgroups: parseAsArrayOf(parseAsString).withDefault([]),
      salesPersons: parseAsArrayOf(parseAsString).withDefault([]),
      loyaltyLevel: parseAsArrayOf(parseAsString).withDefault([]),
      itemCount: parseAsInteger.withDefault(0),
      isNewCustomer: parseAsBoolean.withDefault(false),
      sort: parseAsJson<DataTableSortMeta[]>((value) => value as DataTableSortMeta[]).withDefault(
        []
      ),
    },
    { shallow: true, history: 'replace' }
  )

  // 2. Handle Search Local (Solusi Blinking/Teks Terhapus)
  const [localSearch, setLocalSearch] = useState(filters.search)
  const debouncedLocalSearch = useDebounce(localSearch, 400)
  const [localItemCount, setLocalItemCount] = useState(filters.itemCount)

  // Update URL hanya saat debounced search berubah
  useEffect(() => {
    setFilters({ search: debouncedLocalSearch, page: 1 })
  }, [debouncedLocalSearch])

  // Sinkronisasi balik jika URL berubah eksternal (misal: tombol clear)
  useEffect(() => {
    setLocalSearch(filters.search)
  }, [filters.search])

  useEffect(() => {
    setLocalItemCount(filters.itemCount)
  }, [filters.itemCount])
  const payload = {
    page: filters.page,
    per_page: filters.limit,
    sort_options: JSON.stringify(
      filters.sort.map((meta) => ({
        key: meta.field,
        order: meta.order === 1 ? 'asc' : 'desc',
      }))
    ),
    ...(filters.search ? { search: filters.search } : {}),
    ...(filters.groups.length > 0 ? { groups: filters.groups } : {}),
    ...(filters.subgroups.length > 0 ? { subgroups: filters.subgroups } : {}),
    ...(filters.salesPersons.length > 0 ? { salesPersons: filters.salesPersons } : {}),
    ...(filters.loyaltyLevel.length > 0 ? { loyaltyLevel: filters.loyaltyLevel } : {}),
    ...(filters.itemCount > 0 ? { itemCount: filters.itemCount } : {}),
    ...(filters.isNewCustomer ? { isNewCustomer: filters.isNewCustomer } : {}),
  }

  const apiUrl = createUrl('customers', payload)
  const { data, isValidating } = useSWR(apiUrl, fetcher, {
    keepPreviousData: true,
    revalidateOnFocus: false,
    onSuccess: (res) => {
      if (res.groupNames) setGroupNames(res.groupNames)
      if (res.salesPersonNames) setSalesPersonNames(res.salesPersonNames)
      if (res.subGroupNames) setSubGroupNames(res.subGroupNames)
    },
  })

  // 5. Data Mapping untuk UI
  const customers = data?.data?.items || []
  const totalRecords = data?.data?.totalRecords || 0

  const groupOptions = data?.groupNames?.map((name: string) => ({ label: name, value: name })) || []
  const subGroupOptions =
    data?.subGroupNames?.map((name: string) => ({ label: name, value: name })) || []
  const salesPersonOptions =
    data?.salesPersonNames?.map((name: string) => ({ label: name, value: name })) || []

  useEffect(() => {
    console.log(customers)
  }, [customers])

  const loyaltyLevelOptions = [
    { label: 'VIP', value: 'VIP' },
    { label: 'LOYAL', value: 'LOYAL' },
    { label: 'POTENTIAL', value: 'POTENTIAL' },
    { label: 'AT_RISK', value: 'AT_RISK' },
    { label: 'LOST', value: 'LOST' },
  ]

  // 6. Table Templates & Headers (Logika tetap sama)
  const rowClass = (data: ICustomer) =>
    `cursor-pointer ${data.NonActive === 'Y' ? 'bg-gray-700' : ''}`
  const statusTemplate = (data: ICustomer) => (
    <span>{data.NonActive === 'Y' ? 'Inactive' : 'Active'}</span>
  )
  const segmentTemplate = (row: ICustomer) => (
    <Rating
      value={segmentToStars(row.rfm?.segment)}
      readOnly
      cancel={false}
      className={getClass(row.rfm?.segment)}
    />
  )

  const headers = [
    { field: 'CardName', header: 'Name', sortable: true },
    {
      field: 'rfm.segment',
      header: 'Loyalty Level',
      sortable: true,
      body: segmentTemplate,
      sortField: 'rfm.rfmScore',
    },
    { field: 'GroupName', header: 'Group', sortable: true, hideOnMobile: true },
    { field: 'subgroup.IndDesc', header: 'Subgroup', sortable: true },
    { field: 'sales_person.SlpName', header: 'Sales Person', sortable: true, hideOnMobile: true },
    { field: 'NonActive', header: 'Status', sortable: true, body: statusTemplate },
  ]
  const visibleHeaders = isMobile ? headers.filter((h) => !h.hideOnMobile) : headers

  return (
    <div className="card p-4">
      <NavButton />
      <h5>Customer List</h5>
      <div className="grid my-4 gap-1">
        <div className="col-12 sm:col-6 md:col-3">
          <div className="p-inputgroup flex-1">
            <InputText
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              placeholder="Search..."
              className="w-full"
            />
            {localSearch && (
              <Button
                icon="pi pi-times"
                className="p-button-danger"
                onClick={() => setLocalSearch('')}
              />
            )}
          </div>
        </div>

        <div className="col-12 sm:col-6 md:col-3">
          <MultiSelect
            value={filters.groups}
            onChange={(e) => setFilters({ groups: e.value, page: 1 })}
            options={groupOptions}
            placeholder="Select group"
            className="w-full"
          />
        </div>

        <div className="col-12 sm:col-6 md:col-3">
          <MultiSelect
            value={filters.subgroups}
            onChange={(e) => setFilters({ subgroups: e.value, page: 1 })}
            options={subGroupOptions}
            placeholder="Select subgroup"
            className="w-full"
          />
        </div>

        {isAdmin && (
          <div className="col-12 sm:col-6 md:col-3">
            <MultiSelect
              value={filters.salesPersons}
              onChange={(e) => setFilters({ salesPersons: e.value, page: 1 })}
              options={salesPersonOptions}
              placeholder="Select sales person"
              className="w-full"
            />
          </div>
        )}

        <div className="col-12 sm:col-6 md:col-3">
          <MultiSelect
            value={filters.loyaltyLevel}
            onChange={(e) => setFilters({ loyaltyLevel: e.value, page: 1 })}
            options={loyaltyLevelOptions}
            placeholder="Loyalty Levels"
            className="w-full"
          />
        </div>

        <div className="col-12 sm:col-6 md:col-3">
          <h6>Item Count &gt; {localItemCount}</h6>
          <Slider
            // Gunakan state lokal agar gerakan slider 60fps
            value={localItemCount}
            // onChange: HANYA update angka di layar (sangat ringan)
            onChange={(e) => {
              setLocalItemCount(e.value as number)
            }}
            // onSlideEnd: BARU update URL/SWR (setelah dilepas)
            onSlideEnd={(e) => {
              const val = e.value as number
              // Ini yang memicu fetch API & update URL
              setFilters({ itemCount: val, page: 1 })
            }}
            // step={10}
            className="w-full"
          />
        </div>

        <div className="col-12 sm:col-6 md:col-3 flex align-items-center">
          <Checkbox
            inputId="newCustomer"
            checked={filters.isNewCustomer}
            onChange={(e) => setFilters({ isNewCustomer: !!e.checked })}
          />
          <label htmlFor="newCustomer" className="ml-2">
            New Customer
          </label>
        </div>
      </div>

      <DataTable
        value={customers}
        paginator
        lazy
        rows={filters.limit}
        first={(filters.page - 1) * filters.limit}
        totalRecords={totalRecords}
        multiSortMeta={filters.sort}
        sortMode="multiple"
        onPage={(e) => setFilters({ page: (e.page ?? 0) + 1, limit: e.rows })}
        onSort={(e) => setFilters({ sort: e.multiSortMeta })}
        loading={isValidating}
        rowClassName={rowClass}
        onRowClick={(e) => (window.location.href = `/customers/${e.data.id}`)}
        rowsPerPageOptions={[10, 20, 25, 50]}
      >
        {visibleHeaders.map((col) => (
          <Column key={col.field} {...col} />
        ))}
      </DataTable>
    </div>
  )
}
