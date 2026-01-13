'use client'

import { IUser } from '@saleshub-tsm/types'
import { Button } from 'primereact/button'
import { Column } from 'primereact/column'
import { DataTable } from 'primereact/datatable'
import { Dialog } from 'primereact/dialog'
import { InputText } from 'primereact/inputtext'
import { MultiSelect } from 'primereact/multiselect'
import { useEffect, useRef, useState } from 'react'

import UserForm from '@/app/components/users/UserForm'
import { useDebounce } from '@/hooks/useDebounce'
import { useUserStore } from '@/stores/user'

export default function UserTable() {
  const {
    users,
    totalRecords,
    loading,
    page,
    limit,
    search,
    multiSortMeta,
    roles,
    setPage,
    setLimit,
    setSearch,
    setMultiSortMeta,
    fetchUsers,
    fetchRoles,
    fetchSalesPersons,
    selectedRoles,
    setSelectedRoles,
    salesPersons,
    updateUser,
    createUser,
    deleteUser,
  } = useUserStore()

  const [selectedUser, setSelectedUser] = useState<IUser | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const debouncedSearch = useDebounce(search, 300)

  const dialogRef = useRef(null)

  useEffect(() => {
    fetchUsers()
  }, [debouncedSearch])

  useEffect(() => {
    fetchUsers()
  }, [page, limit, multiSortMeta, selectedRoles])

  useEffect(() => {
    fetchRoles()
    fetchSalesPersons()
  }, [])

  useEffect(() => {})

  const clearFilter = () => {
    setSearch('')
  }

  const handleDelete = async (user: IUser) => {
    setShowDeleteModal(true)
    setSelectedUser(user)
  }

  const handleDeleteConfirm = async () => {
    await deleteUser(Number(selectedUser?.id)).then(() => {
      fetchUsers()
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
    { label: 'Admin', value: 'admin' },
    { label: 'Supervisor', value: 'spv' },
    { label: 'Sales', value: 'sales' },
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
        fetchUsers()
        fetchSalesPersons()
        setModalOpen(false)
      })
    } else {
      await createUser(data).then(() => {
        fetchUsers()
        setModalOpen(false)
      })
    }
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
        <div className="col-12 sm:col-6 md:col-2">
          <div className="p-inputgroup">
            <span className="p-input-icon-right">
              <InputText
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
            </span>
          </div>
        </div>
        <div className="col-12 sm:col-6 md:col-3">
          <MultiSelect
            value={selectedRoles}
            onChange={(e) => setSelectedRoles(e.value)}
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
        rows={limit}
        first={(page - 1) * limit}
        totalRecords={totalRecords}
        sortMode="multiple"
        multiSortMeta={multiSortMeta}
        onPage={(e) => {
          setPage((e.page ?? 0) + 1)
          setLimit(e.rows)
        }}
        onSort={(e) => setMultiSortMeta(e.multiSortMeta || [])}
        dataKey="id"
        loading={loading}
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
            return (
              <>
                <Button
                  onClick={() => handleClickEdit(rowData)}
                  disabled={isAdmin}
                  className={`p-button-text p-button-plain p-button-sm ${
                    isAdmin ? 'p-disabled' : ''
                  }`}
                >
                  <i className="pi pi-pencil py-1"></i>
                </Button>
                <Button
                  onClick={() => handleDelete(rowData)}
                  disabled={isAdmin}
                  className={`p-button-text p-button-plain p-button-sm ${
                    isAdmin ? 'p-disabled' : ''
                  }`}
                >
                  <i className="pi pi-trash py-1"></i>
                </Button>
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
