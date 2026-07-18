'use client'

import NavButton from '../customers/components/NavButton'
import { DataTableSortMeta, INotification, IResPaginated } from '@saleshub-tsm/types'
import { formatDate } from 'date-fns'
import { useRouter } from 'next/navigation'
import { parseAsInteger, parseAsString, useQueryStates } from 'nuqs'
import { Button } from 'primereact/button'
import { Column } from 'primereact/column'
import { DataTable } from 'primereact/datatable'
import { Dialog } from 'primereact/dialog'
import { InputText } from 'primereact/inputtext'
import { SelectButton } from 'primereact/selectbutton'
import { useEffect, useState } from 'react'
import { mutate } from 'swr'

import { useDebounce } from '@/hooks/useDebounce'
import { useFetch } from '@/hooks/useFetch'
import { useAuth } from '@/layout/context/AuthContext'
import { $api, createUrl } from '@/lib/api'

const NotificationPage = () => {
  const { user } = useAuth()
  const router = useRouter()
  const [selectedNotification, setSelectedNotification] = useState<INotification | null>(null)
  const [visible, setVisible] = useState(false)
  const [filters, setFilters] = useQueryStates(
    {
      page: parseAsInteger.withDefault(1),
      limit: parseAsInteger.withDefault(10),
      search: parseAsString.withDefault(''),
      status: parseAsString,
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
    userId: Number(user?.id),
    status: filters.status,
    sort: filters.sort,
    order: filters.order,
  }

  const {
    data: notificationData,
    isValidating,
    mutate: notificationMutate,
  } = useFetch<IResPaginated<INotification>>('notifications', payload, { enabled: !!user?.id })

  const { items } = notificationData?.data ?? {}
  const totalRecords = notificationData?.data.totalRecords ?? 0

  const options = [
    { label: 'All', value: 'all', icon: 'pi pi-inbox' },
    { label: 'Read', value: 'read', icon: 'pi pi-check' },
    { label: 'Unread', value: 'unread', icon: 'pi pi-envelope' },
  ]

  const updateReadStatus = async (id: number | bigint) => {
    try {
      const url = createUrl(`notifications/${id}/read`)
      await $api(url, { method: 'PUT' })
      await notificationMutate()
      mutate(
        createUrl('notifications/unread', {
          userId: Number(user?.id),
        })
      )
    } catch (error) {
      console.error(error)
    }
  }

  const handleClose = async () => {
    setVisible(false)
    if (!selectedNotification?.is_read) {
      await updateReadStatus(selectedNotification?.id ?? 0)
    }
    setSelectedNotification(null)
  }
  const messageTemplateBody = (data: INotification) => {
    return (
      <div style={{ whiteSpace: 'pre-line' }}>
        <div>{data.message}</div>
      </div>
    )
  }

  return (
    <div className="card p-4">
      <NavButton />
      <h5>Notifications</h5>
      <div className="col-12">
        <h5 className="mb-3">Filter</h5>
        <div className="col-12 flex flex-column md:flex-row gap-2 align-items-stretch md:align-items-center pl-0">
          <SelectButton
            value={filters.status ?? 'all'}
            options={options}
            onChange={(e) => setFilters({ status: e.value, page: 1 })}
            allowEmpty={false}
            itemTemplate={(option) => (
              <div className="flex align-items-center">
                <i className={option.icon}></i>
                <span className="ml-2">{option.label}</span>
              </div>
            )}
          />

          <div className="p-inputgroup w-20rem">
            <InputText
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              placeholder="Search..."
              className="p-2"
            />

            {localSearch && (
              <Button icon="pi pi-times" severity="danger" onClick={() => setLocalSearch('')} />
            )}
          </div>
        </div>
      </div>
      <DataTable
        value={items}
        rowClassName={(row) => (!row.is_read ? 'bg-red-50 cursor-pointer' : 'cursor-pointer')}
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
        onRowClick={(e) => {
          setSelectedNotification(e.data as INotification)
          setVisible(true)
        }}
        selectionMode={'single'}
        dataKey="id"
        loading={isValidating}
        emptyMessage="No notifications found."
        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
        currentPageReportTemplate="Showing {first} to {last} of {totalRecords} entries"
        rowsPerPageOptions={[10, 25, 50]}
      >
        <Column field="title" header="Title" sortable />
        <Column field="type" header="Type" sortable />
        <Column field="message" header="Message" body={messageTemplateBody} sortable />
        <Column
          field="created_at"
          header="Date"
          body={(row) => formatDate(row.created_at, 'dd/MM/yyyy HH:mm')}
          sortable
        />
      </DataTable>

      <Dialog
        dismissableMask
        header={selectedNotification?.title}
        visible={visible}
        onHide={handleClose}
        style={{ width: '30rem' }}
        footer={
          <div className="flex justify-content-start">
            <Button
              label="Close"
              icon="pi pi-times"
              className="p-button-sm p-button-outlined"
              severity="danger"
              onClick={handleClose}
            />
            {selectedNotification?.action_url && (
              <Button
                type="button"
                label="View Details"
                className="p-button-sm p-button-outlined"
                onClick={() => {
                  handleClose()
                  router.push(selectedNotification?.action_url as string)
                }}
              />
            )}
          </div>
        }
      >
        <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.5' }}>
          {selectedNotification?.message}
        </div>
      </Dialog>
    </div>
  )
}

export default NotificationPage
