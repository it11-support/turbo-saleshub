'use client'

import { ICustomer } from '@saleshub-tsm/types'
import { Button } from 'primereact/button'
import { Column } from 'primereact/column'
import { DataTable } from 'primereact/datatable'
import { InputText } from 'primereact/inputtext'
import { MultiSelect } from 'primereact/multiselect'
import { SelectButton } from 'primereact/selectbutton'
import { useEffect, useState } from 'react'

import { useDebounce } from '@/hooks/useDebounce'
import { useAuth } from '@/layout/context/AuthContext'
import useIsMobile from '@/layout/mobile/useIsMobile'
import { useCustomerStore } from '@/stores/customers'
import { Slider } from 'primereact/slider'

export default function CustomerTable() {
  const {
    customers,
    totalRecords,
    loading,
    page,
    limit,
    search,
    multiSortMeta,
    active,
    setActive,
    setPage,
    setLimit,
    setSearch,
    setMultiSortMeta,
    fetchCustomers,
    groupNames,
    setGroups,
    groups,
    subgroups,
    setSubgroups,
    subGroupNames,
    salesPersons,
    setSalesPersons,
    salesPersonNames,
    itemCount,
    setItemCount,
  } = useCustomerStore()

  const authStore = useAuth()
  const { isAdmin } = authStore

  const [value, setValue] = useState<string[]>(active ?? ['N'])

  const activeOptions = [
    { label: 'Active', value: 'N' },
    { label: 'Inactive', value: 'Y' },
  ]

  const groupOptions = groupNames.map((name) => ({ label: name, value: name }))
  const subGroupOptions = subGroupNames.map((name) => ({ label: name, value: name }))
  const salesPersonOptions = salesPersonNames.map((SlpName) => ({
    label: SlpName,
    value: SlpName,
  }))
  const debouncedSearch = useDebounce(search, 300)
  const debounceCountSlider = useDebounce(itemCount, 300)
  const isMobile = useIsMobile(768)

  useEffect(() => {
    if (Array.isArray(active)) {
      setValue(active)
    }
  }, [active])

  const handleChange = (e: { value: string[] }) => {
    setValue(e.value)
    setActive(e.value)
  }

  useEffect(() => {
    fetchCustomers()
  }, [page, limit, multiSortMeta, debouncedSearch, value, groups, salesPersons, subgroups, debounceCountSlider])

  const clearFilter = () => {
    setSearch('')
  }

  const rowClass = (data: ICustomer) => {
    const baseClass = 'cursor-pointer'
    const finalClass = data.NonActive === 'Y' ? `${baseClass} bg-gray-700` : baseClass
    return finalClass
  }

  const statusTemplate = (data: ICustomer) => {
    const status = data.NonActive === 'Y' ? 'Inactive' : 'Active'
    return <span>{status}</span>
  }

  const headers = [
    { field: 'CardName', header: 'Name', sortable: true },
    { field: 'GroupName', header: 'Group', sortable: true, hideOnMobile: true },
    { field: 'subgroup.IndDesc', header: 'Subgroup', sortable: true },
    { field: 'sales_person.SlpName', header: 'Sales Person', sortable: true, hideOnMobile: true },
    { field: 'NonActive', header: 'Status', sortable: true, body: statusTemplate },
  ]

  const visibleHeaders = isMobile ? headers.filter((h) => !h.hideOnMobile) : headers

  const rowClickHandler = (data: ICustomer) => {
    window.location.href = `/customers/${data.id}`
  }

  return (
    <div className="card p-4">
      <div className="flex justify-between mb-4 items-center">
        <Button
          label="Back"
          icon="pi pi-chevron-left"
          severity="danger"
          size="small"
          outlined
          onClick={() => history.back()}
        />
      </div>
      <h5>Customer List</h5>
      <div className="grid my-4">
        {/* Kolom 1: Input Search */}
        <div className="col-12 sm:col-6 md:col-2">
        <h6>Item Count &gt; {itemCount}</h6>
          <Slider value={itemCount} onChange={(e) => setItemCount(e.value as number)} step={10} className='ml-2' />
        </div>
        <div className="col-12 sm:col-6 md:col-2">
          <div className="p-inputgroup">
            <InputText
              id="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search..."
              className="w-full"
            />
            {search && (
              <i
                className="pi pi-times"
                onClick={clearFilter}
                style={{ cursor: 'pointer' }}
                title="Clear"
              />
            )}
          </div>
        </div>

        {/* Kolom 2: SelectButton */}

        {/* Kolom 3: MultiSelect */}
        <div className="col-12 sm:col-6 md:col-2">
          <MultiSelect
            value={groups}
            onChange={(e) => setGroups(e.value)}
            options={groupOptions}
            optionLabel="label"
            filter
            placeholder="Select group"
            maxSelectedLabels={3}
            className="w-full"
            style={{ minWidth: 'unset' }}
          />
        </div>
        <div className="col-12 sm:col-6 md:col-2">
          <MultiSelect
            value={subgroups}
            onChange={(e) => setSubgroups(e.value)}
            options={subGroupOptions}
            optionLabel="label"
            filter
            placeholder="Select subgroup"
            maxSelectedLabels={3}
            className="w-full"
            style={{ minWidth: 'unset' }}
          />
        </div>
        {isAdmin && (
          <div className="col-12 sm:col-6 md:col-2">
            <MultiSelect
              value={salesPersons}
              onChange={(e) => setSalesPersons(e.value)}
              options={salesPersonOptions}
              optionLabel="label"
              filter
              placeholder="Select sales person"
              maxSelectedLabels={3}
              className="w-full"
              style={{ minWidth: 'unset' }}
            />
          </div>
        )}
        <div className="col-12 sm:col-6 md:col-3">
          <div className="p-inputgroup">
            <SelectButton
              value={value}
              onChange={handleChange}
              optionLabel="label"
              options={activeOptions}
              multiple
              className="w-full"
            />
          </div>
        </div>
      </div>
      <DataTable
        value={customers}
        paginator
        lazy
        rows={limit}
        first={(page - 1) * limit}
        totalRecords={totalRecords}
        sortMode="multiple"
        multiSortMeta={multiSortMeta}
        onPage={(e) => {
          setPage((e.page ?? 0) + 1)
          setLimit(e.rows)
        }}
        rowHover
        rowClassName={rowClass}
        onSort={(e) => setMultiSortMeta(e.multiSortMeta || [])}
        dataKey="id"
        loading={loading}
        emptyMessage="Data customer tidak ditemukan"
        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
        currentPageReportTemplate="Showing {first} to {last} of {totalRecords} entries"
        onRowClick={(e) => {
          rowClickHandler(e.data as ICustomer)
        }}
        rowsPerPageOptions={[10, 20, 25, 50]}
      >
        {visibleHeaders.map((col) => (
          <Column
            key={col.field}
            field={col.field}
            header={col.header}
            sortable={col.sortable}
            body={col.body}
          />
        ))}
      </DataTable>
    </div>
  )
}
