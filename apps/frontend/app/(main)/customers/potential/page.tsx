'use client'

import CustomerCell from '../../components/customer/CustomerCell'
import NavButton from '../components/NavButton'
import { ICustomer, IResPaginated } from '@saleshub-tsm/types'
import { useRouter } from 'next/navigation'
import { parseAsArrayOf, parseAsBoolean, parseAsInteger, parseAsString, useQueryStates } from 'nuqs'
import { Button } from 'primereact/button'
import { Column } from 'primereact/column'
import { DataTable } from 'primereact/datatable'
import { Dialog } from 'primereact/dialog'
import { Dropdown } from 'primereact/dropdown'
import { InputText } from 'primereact/inputtext'
import { MultiSelect } from 'primereact/multiselect'
import { useState } from 'react'
import { preload } from 'swr'

import { useDebouncedFilter } from '@/hooks/useDebouncedFilter'
import { useFetch } from '@/hooks/useFetch'
import { useAuth } from '@/layout/context/AuthContext'
import { useGlobalToast } from '@/layout/context/ToastContext'
import useIsMobile from '@/layout/mobile/useIsMobile'
import { $api, createUrl, fetcher } from '@/lib/api'
import { parseAsSortMeta } from '@/lib/sortOptionParser'
import { useCustomerStore } from '@/stores/customers'

interface ICustomerMeta {
  groupNames: string[]
  userNameOpts: {
    id: number
    name: string
  }[]
  subGroupNames: string[]
}

const PotentialCustomerPage = () => {
  const isMobile = useIsMobile(768)
  const { isAdmin } = useAuth()
  const router = useRouter()
  const [showImportModal, setShowImportModal] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [selectedUser, setSelectedUser] = useState<string | null>(null)
  // Ambil setter dari store untuk metadata dropdown
  const { setGroupNames, setUserNames } = useCustomerStore()

  // 1. Nuqs Query States (Source of Truth untuk Filter)
  const [filters, setFilters] = useQueryStates(
    {
      page: parseAsInteger.withDefault(1),
      limit: parseAsInteger.withDefault(10),
      search: parseAsString.withDefault(''),
      groups: parseAsArrayOf(parseAsString).withDefault([]),
      userIds: parseAsArrayOf(parseAsString).withDefault([]),
      isNewCustomer: parseAsBoolean.withDefault(true),
      sort: parseAsSortMeta.withDefault([]),
    },
    { shallow: true, history: 'replace' }
  )

  // 2. Handle Search Local (Solusi Blinking/Teks Terhapus)
  const { local: localSearch, setLocal: setLocalSearch } = useDebouncedFilter({
    value: filters.search,
    setValue: setFilters,
  })

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
    ...(filters.userIds.length > 0 ? { userIds: filters.userIds } : {}),
  }

  const { data, isValidating, mutate } = useFetch<IResPaginated<ICustomer, ICustomerMeta>>(
    'customers/potential',
    payload,
    {
      onSuccess: (res) => {
        if (res.groupNames) setGroupNames(res.groupNames)
        if (res.userNameOpts) {
          setUserNames(res.userNameOpts.map((u) => u.name))
        }
      },
    }
  )

  const [isUploading, setIsUploading] = useState(false)
  const { showToast } = useGlobalToast()

  // 5. Data Mapping untuk UI
  const customers = data?.data?.items || []
  const totalRecords = data?.data?.totalRecords || 0
  const totalPages = data?.data?.totalPages || 0
  const groupOptions = data?.groupNames?.map((name: string) => ({ label: name, value: name })) || []
  const userNameOptions =
    data?.userNameOpts?.map((user) => ({
      label: user.name,
      value: String(user.id),
    })) || []

  // 6. Table Templates & Headers (Logika tetap sama)
  const rowClass = (data: ICustomer) =>
    `cursor-pointer ${data.NonActive === 'Y' ? 'bg-gray-700' : ''}`
  const statusTemplate = (data: ICustomer) => (
    <span>{data.NonActive === 'Y' ? 'Inactive' : 'Active'}</span>
  )

  const preloadCustomers = (page: number) => {
    const cacheKey = createUrl('customers', { ...payload, page })
    preload(cacheKey, fetcher)
  }

  const headers = [
    { field: 'CardName', header: 'Name', sortable: true },
    { field: 'GroupName', header: 'Group', sortable: true, hideOnMobile: true },
    { field: 'subgroup.IndDesc', header: 'Subgroup', sortable: true },
    { field: 'user.name', header: 'User', sortable: true, hideOnMobile: true },
    { field: 'NonActive', header: 'Status', sortable: true, body: statusTemplate },
  ]
  const visibleHeaders = isMobile ? headers.filter((h) => !h.hideOnMobile) : headers

  const downloadCsvTemplate = () => {
    const headers = ['Nama', 'Alamat', 'Segment', 'Kota']

    const csv = headers.join(',') + '\n'

    const blob = new Blob([csv], {
      type: 'text/csv;charset=utf-8;',
    })

    const url = URL.createObjectURL(blob)

    const link = document.createElement('a')
    link.href = url
    link.download = 'potential-customer-template.csv'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    URL.revokeObjectURL(url)
  }

  const uploadCsv = async () => {
    if (!selectedFile) {
      showToast({
        severity: 'warn',
        summary: 'File not selected',
        detail: 'Please select a CSV file first',
      })
      return
    }

    if (!selectedUser) {
      showToast({ severity: 'warn', summary: 'User not selected', detail: 'Please assign a user' })
      return
    }

    setIsUploading(true)

    try {
      const form = new FormData()

      form.append('file', selectedFile)
      form.append('userId', selectedUser)

      const res = await $api<{ imported: number; errors: string[]; status: 'FAILED' | 'SUCCESS' }>(
        '/customers/potential/import',
        {
          method: 'POST',
          body: form,
        }
      )

      setShowImportModal(false)
      setSelectedFile(null)
      setSelectedUser(null)
      mutate()

      if (res.errors?.length > 0) {
        showToast({
          severity: 'warn',
          summary: `Imported ${res.imported} rows`,
          detail: `${res.errors.length} rows failed: ${res.errors.slice(0, 5).join(', ')}`,
          sticky: true,
        })
      } else {
        showToast({
          severity: 'success',
          summary: 'Import Successful',
          detail: `${res.imported} customers imported successfully`,
        })
      }
    } catch (err) {
      showToast({
        severity: 'error',
        summary: 'Import Failed',
        detail: err instanceof Error ? err.message : 'Something went wrong',
      })
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="card p-4">
      <NavButton />
      <h5>Potential Customer</h5>

      {/* Tambah button Import disini */}

      <div className=" pt-3 mb-1">
        <Button
          type="button"
          label="Import Customer Data"
          icon="pi pi-upload"
          className="p-button-sm border-round-md p-button-outlined"
          onClick={() => setShowImportModal(true)}
        />
      </div>

      <div className="grid my-3 gap-1">
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
            inputId="group-filter"
            value={filters.groups}
            onChange={(e) => setFilters({ groups: e.value, page: 1 })}
            options={groupOptions}
            placeholder="Select group"
            className="w-full"
          />
        </div>

        {isAdmin && (
          <div className="col-12 sm:col-6 md:col-3">
            <MultiSelect
              inputId="user-filter"
              value={filters.userIds}
              onChange={(e) => setFilters({ userIds: e.value, page: 1 })}
              options={userNameOptions}
              optionLabel="label"
              optionValue="value"
              placeholder="Select user"
              className="w-full"
            />
          </div>
        )}
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
        onRowClick={(e) => router.push(`/customers/${e.data.id}`)}
        rowsPerPageOptions={[10, 20, 25, 50]}
        pt={{
          paginator: {
            pageButton: () => ({
              onMouseEnter: async (e: React.MouseEvent<HTMLButtonElement>) => {
                const text = e.currentTarget.textContent
                if (text) {
                  const pageNumber = parseInt(text, 10)
                  preloadCustomers(pageNumber)
                }
              },
            }),
            firstPageButton: () => ({
              onMouseEnter: () => preloadCustomers(1),
            }),
            prevPageButton: () => ({
              onMouseEnter: () => preloadCustomers(filters.page - 1),
            }),
            nextPageButton: () => ({
              onMouseEnter: () => preloadCustomers(filters.page + 1),
            }),
            lastPageButton: () => ({
              onMouseEnter: () => preloadCustomers(totalPages),
            }),
          },
        }}
      >
        {visibleHeaders.map((col) => {
          if (col.field === 'CardName') {
            return (
              <Column
                key={col.field}
                {...col}
                body={(rowData) => <CustomerCell rowData={rowData} />}
              />
            )
          }
          return <Column key={col.field} {...col} />
        })}
      </DataTable>
      {/* Import Modal */}
      <Dialog
        header="Import Potential Customer"
        visible={showImportModal}
        onHide={() => setShowImportModal(false)}
        className="border-round-xl"
        modal
        dismissableMask
        style={{ width: '550px' }}
      >
        <div className="flex flex-column gap-4">
          {/* Download template */}
          <div>
            <div className="font-medium mb-2">1. Download Template</div>

            <Button
              label="Download Template"
              icon="pi pi-download"
              className="p-button-sm border-round-md"
              outlined
              onClick={downloadCsvTemplate}
            />
          </div>

          {/* Upload CSV */}
          <div>
            <div className="font-medium mb-2">2. Upload Customer Data</div>

            <div className="flex align-items-center gap-2">
              <input
                type="file"
                accept=".csv"
                id="customer-csv"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]

                  if (file) {
                    setSelectedFile(file)
                  }
                }}
              />

              <label
                htmlFor="customer-csv"
                className="p-button p-button-sm p-button-outlined border-round-md cursor-pointer"
              >
                <i className="pi pi-upload mr-2" />
                Choose CSV
              </label>

              {/* selected file */}
              {selectedFile && <span className="text-sm">{selectedFile.name}</span>}
            </div>
          </div>

          {/* Select user */}
          <div>
            <div className="font-medium mb-2">3. Assign to User</div>

            <Dropdown
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.value)}
              options={userNameOptions}
              optionLabel="label"
              optionValue="value"
              placeholder="Select Username"
              className="w-full"
              filter
            />
          </div>

          {/* Footer */}
          <div className="flex justify-content-end gap-2 pt-2">
            <Button
              label="Cancel"
              icon="pi pi-times"
              severity="secondary"
              outlined
              className="p-button-sm"
              onClick={() => setShowImportModal(false)}
            />

            <Button
              label="Upload"
              icon="pi pi-upload"
              className="p-button-sm"
              disabled={!selectedFile || !selectedUser || isUploading}
              loading={isUploading}
              onClick={uploadCsv}
            />
          </div>
        </div>
      </Dialog>
    </div>
  )
}

export default PotentialCustomerPage
