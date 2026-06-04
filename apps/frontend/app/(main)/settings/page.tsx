'use client'

import NavButton from '../customers/components/NavButton'
import { fetcher } from '../lib'
import { EFollowUpStatus, IConcernCategory, IConcernStatus } from '@saleshub-tsm/types'
import { Button } from 'primereact/button'
import { Checkbox } from 'primereact/checkbox'
import { Dialog } from 'primereact/dialog'
import { Dropdown } from 'primereact/dropdown'
import { InputText } from 'primereact/inputtext'
import { InputTextarea } from 'primereact/inputtextarea'
import { useState } from 'react'
import useSWR from 'swr'

import { createUrl } from '@/lib/api'
import { ICON_OPTIONS, variantColors, variantOptions } from '@/lib/constants'
import { useConcernStore } from '@/stores'

const SettingsPage = () => {
  const concernStore = useConcernStore()
  const {
    createCategory,
    updateCategory,
    deleteCategory,
    createStatus,
    updateStatus,
    deleteStatus,
  } = concernStore

  const [modalType, setModalType] = useState<'category' | 'status' | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [showFormDialog, setShowFormDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  const statusUrl = createUrl(`concern-categories/statuses`)
  const { data: concernStatusesData } = useSWR(statusUrl, fetcher, {
    keepPreviousData: true,
    revalidateOnFocus: false,
  })

  const concernStatuses = concernStatusesData?.data?.concernStatuses ?? []

  const concernCategoriesUrl = createUrl('concern-categories')
  const { data: concernCategoriesData } = useSWR(concernCategoriesUrl, fetcher, {
    keepPreviousData: true,
    revalidateOnFocus: false,
  })

  const concernCategories = concernCategoriesData?.data?.concernCategories ?? []

  const [data, setData] = useState<Pick<IConcernCategory, 'name' | 'description'>>({
    name: '',
    description: '',
  })
  const [statusData, setStatusData] = useState<
    Partial<Pick<IConcernStatus, 'status' | 'level' | 'icon' | 'requires_action'>>
  >({
    status: '',
    level: undefined,
    icon: '',
    requires_action: false,
  })
  const [editingCategoryId, setEditingCategoryId] = useState<number | null>(null)
  const [editingStatusId, setEditingStatusId] = useState<number | null>(null)

  const itemTemplate = (option: (typeof variantOptions)[number]) => (
    <div className="flex align-items-center gap-2">
      <span
        style={{
          width: 12,
          height: 12,
          borderRadius: '50%',
          backgroundColor: variantColors[option.value],
          display: 'inline-block',
        }}
      />
      <span>{option.label}</span>
    </div>
  )

  const valueTemplate = (option: (typeof variantOptions)[number] | null) => {
    if (!option) return <span>Select Level</span>

    return (
      <div className="flex align-items-center h-1rem gap-2">
        <span
          style={{
            width: 12,
            height: 12,
            borderRadius: '50%',
            backgroundColor: variantColors[option.value],
            display: 'inline-block',
          }}
        />
        <span>{option.label}</span>
      </div>
    )
  }

  const openEditDialog = (category: IConcernCategory) => {
    setModalType('category')
    setEditingCategoryId(Number(category.id))

    setData({
      name: category.name ?? '',
      description: category.description ?? '',
    })

    setShowFormDialog(true)
  }

  const openEditStatusDialog = (status: IConcernStatus) => {
    setModalType('status')
    setEditingStatusId(Number(status.id))

    setStatusData({
      status: status.status ?? '',
      level: status.level ?? undefined,
      icon: status.icon ?? '',
      requires_action: status.requires_action ?? false,
    })

    setShowFormDialog(true)
  }

  const openDeleteDialog = (type: 'category' | 'status', id: number) => {
    setModalType(type)
    setDeletingId(id)
    setShowDeleteDialog(true)
  }

  const handleSave = async () => {
    if (modalType === 'category') {
      if (editingCategoryId) {
        await updateCategory(editingCategoryId, data)
      } else {
        await createCategory(data)
      }
    }

    if (modalType === 'status') {
      if (editingStatusId) {
        await updateStatus(editingStatusId, statusData)
      } else {
        if (!statusData.status) return
        await createStatus(statusData)
      }
    }

    setShowFormDialog(false)
  }

  const openAddDialog = (type: 'category' | 'status') => {
    setModalType(type)

    if (type === 'category') {
      setEditingCategoryId(null)
      setData({ name: '', description: '' })
    } else if (type === 'status') {
      setEditingStatusId(null)
      setStatusData({ status: undefined })
    }

    setShowFormDialog(true)
  }

  const handleDelete = async () => {
    if (!modalType) return
    if (modalType === 'category') {
      if (deletingId === null) return
      await deleteCategory(deletingId)
    }

    if (modalType === 'status') {
      if (deletingId === null) return
      await deleteStatus(deletingId)
    }

    setDeletingId(null)
    setShowDeleteDialog(false)
  }

  return (
    <>
      <div className="card p-4">
        <NavButton />
        <h5>Settings</h5>
        <div className="grid p-2">
          <h6>Concerns / Blocking Issue</h6>
          <div className="col-12">
            {/* Button add */}
            <Button
              label="Add New"
              icon="pi pi-plus"
              severity="success"
              size="small"
              onClick={() => openAddDialog('category')}
            />
          </div>
          <div className="col-12 lg:col-6">
            {/* Card */}
            {concernCategories.filter(Boolean).map((category: IConcernCategory) => (
              <div
                className="border-1 surface-border border-round p-2 mb-3 surface-50"
                key={Number(category.id)}
              >
                <div className="flex justify-between items-start gap-3">
                  <div className="flex flex-column gap-1">
                    <p className="m-0 font-semibold">{category.name}</p>
                    <p className="m-0 text-sm text-600">{category.description}</p>
                  </div>
                  <div className="flex align-items-center gap-2 ml-auto">
                    <Button
                      // label="Edit"
                      icon="pi pi-pencil"
                      size="small"
                      outlined
                      onClick={() => openEditDialog(category)}
                    />
                    <Button
                      // label="Delete"
                      icon="pi pi-trash"
                      size="small"
                      severity="danger"
                      outlined
                      onClick={() => openDeleteDialog('category', Number(category.id))}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid p-2">
          <h6>Status</h6>
          <div className="col-12">
            {/* Button add */}
            <Button
              label="Add New"
              icon="pi pi-plus"
              severity="success"
              size="small"
              onClick={() => openAddDialog('status')}
            />
          </div>
          <div className="col-12 lg:col-6">
            {/* Card */}
            {concernStatuses.filter(Boolean).map((status: IConcernStatus) => (
              <div
                className="border-1 surface-border border-round p-2 mb-3 surface-50"
                key={Number(status.id)}
              >
                <div className="flex justify-between items-start gap-3">
                  <div className="flex flex-column gap-1">
                    <p className="m-0 font-semibold">
                      <i
                        className={`${status.icon} m-1`}
                        style={{ color: status.level ? variantColors[status.level] : undefined }}
                      />{' '}
                      {status.status}
                    </p>

                    {status.requires_action && (
                      <span className="m-2 text-xs text-red-500 font-semibold">
                        Follow Up Required
                      </span>
                    )}
                  </div>
                  <div className="flex align-items-center gap-2 ml-auto">
                    <Button
                      icon="pi pi-pencil"
                      size="small"
                      outlined
                      onClick={() => openEditStatusDialog(status)}
                    />
                    <Button
                      // label="Delete"
                      icon="pi pi-trash"
                      size="small"
                      severity="danger"
                      outlined
                      onClick={() => openDeleteDialog('status', Number(status.id))}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <Dialog
        dismissableMask
        style={{ maxWidth: '480px' }}
        header={
          modalType === 'category'
            ? editingCategoryId
              ? 'Edit Category'
              : 'Add Category'
            : editingStatusId
              ? 'Edit Status'
              : 'Add Status'
        }
        visible={showFormDialog}
        onHide={() => {
          setShowFormDialog(false)
          setModalType(null)
        }}
        footer={
          <>
            <Button label="Cancel" outlined onClick={() => setShowFormDialog(false)} />
            <Button label="Save" icon="pi pi-save" onClick={handleSave} />
          </>
        }
      >
        {modalType === 'category' && (
          <>
            <div className="inline-flex flex-column gap-2 w-full my-2">
              <label htmlFor="name" className="text-primary-400 font-semibold">
                Category Name
              </label>
              <InputText
                id="name"
                value={data.name}
                onChange={(e) => setData({ ...data, name: e.target.value })}
                className="border p-3 text-primary-400"
              />
            </div>

            <div className="inline-flex flex-column gap-2 w-full my-2">
              <label htmlFor="decription" className="text-primary-400 font-semibold">
                Description
              </label>
              <InputTextarea
                id="decription"
                value={data.description}
                onChange={(e) => setData({ ...data, description: e.target.value })}
                className="border p-3 text-primary-400"
              />
            </div>
          </>
        )}

        {modalType === 'status' && (
          <>
            <div className="inline-flex flex-column gap-2 w-full my-2">
              <label htmlFor="status" className="text-primary-400 font-semibold">
                Status
              </label>
              <InputText
                id="status"
                value={statusData.status ?? ''}
                onChange={(e) =>
                  setStatusData({ ...statusData, status: e.target.value as EFollowUpStatus })
                }
                className="border p-3 text-primary-400"
              />
            </div>
            <div className="inline-flex flex-column gap-2 w-full my-2">
              <label htmlFor="level" className="text-primary-400 font-semibold">
                Level
              </label>
              <Dropdown
                inputId="level"
                value={statusData.level}
                options={variantOptions}
                onChange={(e) => setStatusData({ ...statusData, level: e.value })}
                placeholder="Select Level"
                itemTemplate={itemTemplate}
                valueTemplate={valueTemplate}
                className="w-full p-1"
              />
            </div>

            <div className="inline-flex flex-column gap-2 w-full my-2">
              <label htmlFor="icon" className="text-primary-400 font-semibold">
                Icon
              </label>
              <Dropdown
                inputId="icon"
                value={statusData.icon}
                options={ICON_OPTIONS}
                onChange={(e) => setStatusData({ ...statusData, icon: e.value })}
                itemTemplate={(icon) => (
                  <div className="flex align-items-center gap-2">
                    <i className={icon.value}></i>
                    <span>{icon.label}</span>
                  </div>
                )}
                valueTemplate={(option) => {
                  if (!option) {
                    return <div className="flex align-items-center text-500">Select Icon</div>
                  }

                  return (
                    <div className="flex align-items-center gap-2 h-1rem">
                      <i className={option.value}></i>
                      <span>{option.label}</span>
                    </div>
                  )
                }}
                optionValue="value"
                optionLabel="label"
                placeholder="Select Icon"
                className="w-full p-1"
              />
            </div>
            <div className="inline-flex flex-column gap-2 w-full my-2">
              <label htmlFor="requires_action" className="text-primary-400 font-semibold">
                Requires Action
              </label>
              <Checkbox
                inputId="requires_action"
                name="requires_action"
                value={statusData.requires_action}
                onChange={(e) => setStatusData({ ...statusData, requires_action: e.checked })}
                checked={!!statusData.requires_action}
              />
            </div>
          </>
        )}
      </Dialog>

      <Dialog
        header={`Delete ${modalType}`}
        visible={showDeleteDialog}
        onHide={() => {
          setShowDeleteDialog(false)
          setModalType(null)
        }}
        footer={
          <>
            <Button label="No" outlined onClick={() => setShowDeleteDialog(false)} />
            <Button label="Yes" severity="danger" onClick={handleDelete} />
          </>
        }
      >
        <p>Are you sure you want to delete this {modalType}?</p>
      </Dialog>
    </>
  )
}

export default SettingsPage
