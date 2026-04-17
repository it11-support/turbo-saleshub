'use client'

import NavButton from '../customers/components/NavButton'
import { fetcher } from '../lib'
import {
  DataTableSortMeta,
  IPaginatedData,
  IResPaginated,
  IResSingle,
  IRole,
  ISalesPerson,
  IUser,
} from '@saleshub-tsm/types'
import { parseAsArrayOf, parseAsInteger, parseAsString, useQueryStates } from 'nuqs'
import { Button } from 'primereact/button'
import { Column } from 'primereact/column'
import { DataTable } from 'primereact/datatable'
import { Dialog } from 'primereact/dialog'
import { InputText } from 'primereact/inputtext'
import { MultiSelect } from 'primereact/multiselect'
import { useEffect, useRef, useState } from 'react'
import useSWR from 'swr'

import UserForm from '@/app/components/users/UserForm'
import { useDebounce } from '@/hooks/useDebounce'
import { useAuth } from '@/layout/context/AuthContext'
import { createUrl } from '@/lib/api'
import { useUserStore } from '@/stores/user'

export default function UserTable() {
  const { updateUser, createUser, deleteUser } = useUserStore()

  const { user } = useAuth()

  const [selectedUser, setSelectedUser] = useState<IUser | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  const [filters, setFilters] = useQueryStates(
    {
      page: parseAsInteger.withDefault(1),
      limit: parseAsInteger.withDefault(10),
      search: parseAsString.withDefault(''),
      roles: parseAsArrayOf(parseAsString).withDefault([]),
      sort: parseAsString.withDefault(''),
      order: parseAsInteger.withDefault(1),
    },
    { shallow: true, history: 'replace' }
  )

  const dialogRef = useRef(null)

  const [localSearch, setLocalSearch] = useState(filters.search)
  const debouncedSearch = useDebounce(localSearch, 400)

  useEffect(() => {
    setFilters({ search: debouncedSearch, page: 1 })
  }, [debouncedSearch])

  const payload = {
    page: filters.page,
    per_page: filters.limit,
    search: filters.search,
    roles: filters.roles,
    sort: filters.sort,
    order: filters.order,
  }

  const apiUrlUser = createUrl('user', payload)
  const apiUrlRole = createUrl('roles')
  const apiSalesPerson = createUrl('sales-persons', { withFilterUser: false })

  const {
    data: userData,
    isValidating,
    mutate,
  } = useSWR<IResPaginated<IPaginatedData<IUser>>>(apiUrlUser, fetcher, {
    keepPreviousData: true,
    revalidateOnFocus: false,
  })

  const users = userData?.data?.items || []
  const totalRecords = userData?.data?.totalRecords || 0

  const { data: roleData } = useSWR<IResSingle<IRole>>(apiUrlRole, fetcher, {
    keepPreviousData: true,
    revalidateOnFocus: false,
  })

  const { data: salesPersonData, mutate: mutateSalesPerson } = useSWR<IResSingle<ISalesPerson>>(
    apiSalesPerson,
    fetcher,
    {
      keepPreviousData: true,
      revalidateOnFocus: false,
    }
  )

  const salesPersons = salesPersonData?.data || []

  const roles = roleData?.data || []

  const handleDelete = async (user: IUser) => {
    setShowDeleteModal(true)
    setSelectedUser(user)
  }

  const handleDeleteConfirm = async () => {
    await deleteUser(Number(selectedUser?.id)).then(() => {
      mutate()
      setShowDeleteModal(false)
    })
  }

  const roleTemplate = (data: IUser) => {
    const result = data.roles?.role.replace(/^./, function (char: string) {
      return char.toUpperCase()
    })
    return <span>{result}</span>
  }

  const roleOptions = [
    { label: 'ADMIN', value: 'admin' },
    { label: 'SUPERVISOR', value: 'spv' },
    { label: 'SALES', value: 'sales' },
  ]

  const handleClickEdit = (data: IUser) => {
    setSelectedUser(data)
    setModalOpen(true)
  }

  const handleSubmit = async (data: Partial<IUser>) => {
    if (data.confirm_password) {
      delete data.confirm_password
    }

    if (selectedUser) {
      const id = Number(selectedUser.id)
      await updateUser(id, data).then(() => {
        mutate()
        mutateSalesPerson()
        setModalOpen(false)
      })
    } else {
      await createUser(data).then(() => {
        mutate()
        setModalOpen(false)
      })
    }
  }

  return (
    <div className="card p-4">
      <NavButton />
      <h5>User List</h5>
      <div className="grid mb-2">
        <div className="col-12">
          <Button
            rounded
            text
            raised
            aria-label="Add User"
            severity="success"
            onClick={() => setModalOpen(true)}
          >
            <span className="p-button-icon pi pi-plus mr-2"></span>
            Add User
          </Button>
        </div>
        <div className="col-12 sm:col-6 md:col-3">
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
        <div className="col-12 sm:col-6 md:col-3">
          <MultiSelect
            value={filters.roles}
            onChange={(e) => setFilters({ roles: e.value })}
            options={roleOptions}
            optionLabel="label"
            placeholder="Select role"
            maxSelectedLabels={3}
            className="w-full"
            style={{ minWidth: 'unset' }}
          />
        </div>
      </div>
      <DataTable
        value={users}
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
        emptyMessage="Users not found"
        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
        currentPageReportTemplate="Showing {first} to {last} of {totalRecords} entries"
        rowsPerPageOptions={[10, 25, 50]}
      >
        <Column field="name" header="Name" sortable />
        <Column field="email" header="Email" sortable />
        <Column field="roles.role" header="Role" body={roleTemplate} sortable />
        <Column field="sales_person.SlpName" header="Sales Person" sortable />
        <Column
          header="Action"
          body={(rowData) => {
            const isAdmin = rowData.roles?.role === 'admin'
            const currentUser = user?.id === rowData.id

            return (
              <>
                <div className="flex align-items-center justify-content-center gap-2">
                  <Button
                    onClick={() => handleClickEdit(rowData)}
                    disabled={isAdmin && currentUser}
                    outlined
                    icon="pi pi-pencil"
                    className={`${isAdmin && currentUser ? 'p-disabled' : ''}`}
                  />
                  <Button
                    onClick={() => handleDelete(rowData)}
                    disabled={isAdmin && currentUser}
                    className={`${isAdmin && currentUser ? 'p-disabled' : ''}`}
                    icon="pi pi-trash"
                    severity="danger"
                    outlined
                  />
                </div>
              </>
            )
          }}
        />
      </DataTable>
      <div ref={dialogRef}>
        <Dialog
          header={selectedUser !== null ? 'Edit User' : 'Add User'}
          className={'w-full md:w-4 lg:w-4'}
          visible={modalOpen}
          modal
          dismissableMask={true}
          onHide={() => {
            setModalOpen(false)
            setSelectedUser(null)
          }}
        >
          <UserForm
            isEdit={selectedUser !== null}
            userData={selectedUser}
            onSubmit={handleSubmit}
            roles={roles}
            salesPersons={salesPersons}
          />
        </Dialog>
      </div>
      <Dialog
        header="Delete User"
        className={'w-full md:w-4 lg:w-4'}
        visible={showDeleteModal}
        modal
        dismissableMask={true}
        onHide={() => {
          setShowDeleteModal(false)
          setSelectedUser(null)
        }}
      >
        <div>
          <p>This will permanently delete {selectedUser?.name} ?</p>
          <div className="flex gap-2 ">
            <Button
              label="Delete"
              className="p-button-danger"
              onClick={() => handleDeleteConfirm()}
            />
            <Button
              label="Cancel"
              className="p-button-success"
              onClick={() => setShowDeleteModal(false)}
            />
          </div>
        </div>
      </Dialog>
    </div>
  )
}
