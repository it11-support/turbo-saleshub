'use client'

import { IConcernCategory } from '@saleshub-tsm/types'
import { Button } from 'primereact/button'
import { Dialog } from 'primereact/dialog'
import { InputText } from 'primereact/inputtext'
import { InputTextarea } from 'primereact/inputtextarea'
import { useEffect, useState } from 'react'

import { useConcernStore } from '@/stores'

const SettingsPage = () => {
  const concernStore = useConcernStore()
  const {
    fetchConcernCategories,
    concernCategories,
    createCategory,
    updateCategory,
    deleteCategory,
  } = concernStore
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [data, setData] = useState<Pick<IConcernCategory, 'name' | 'description'>>({
    name: '',
    description: '',
  })
  const [editingCategoryId, setEditingCategoryId] = useState<number | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deletingCategoryId, setDeletingCategoryId] = useState<number | null>(null)

  const closeAddDialog = () => {
    setData({ name: '', description: '' })
    setEditingCategoryId(null)
    setShowAddDialog(false)
  }

  const openCreateDialog = () => {
    setEditingCategoryId(null)
    setData({ name: '', description: '' })
    setShowAddDialog(true)
  }

  const openEditDialog = (category: IConcernCategory) => {
    setEditingCategoryId(Number(category.id))
    setData({
      name: category.name ?? '',
      description: category.description ?? '',
    })
    setShowAddDialog(true)
  }

  const openDeleteDialog = (category: IConcernCategory) => {
    setDeletingCategoryId(Number(category.id))
    setShowDeleteDialog(true)
  }

  const closeDeleteDialog = () => {
    setDeletingCategoryId(null)
    setShowDeleteDialog(false)
  }
  useEffect(() => {
    fetchConcernCategories()
  }, [])

  const handleSaveCategory = async () => {
    if (editingCategoryId !== null) {
      await updateCategory(editingCategoryId, data)
    } else {
      await createCategory(data)
    }
    closeAddDialog()
  }

  const handleDeleteCategory = async () => {
    if (deletingCategoryId === null) return
    await deleteCategory(deletingCategoryId)
    closeDeleteDialog()
  }

  const footerContent = (
    <div>
      <Button
        label="Cancel"
        severity="danger"
        outlined
        icon="pi pi-times"
        onClick={closeAddDialog}
      />
      <Button
        severity="success"
        outlined
        label="Save"
        icon="pi pi-save"
        onClick={handleSaveCategory}
        autoFocus
      />
    </div>
  )

  const deleteFooterContent = (
    <div>
      <Button
        label="No"
        severity="danger"
        outlined
        icon="pi pi-times"
        onClick={closeDeleteDialog}
      />
      <Button
        severity="success"
        outlined
        label="Yes"
        icon="pi pi-trash"
        onClick={handleDeleteCategory}
        autoFocus
      />
    </div>
  )

  return (
    <>
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
        <h5>Settings</h5>
        <div className="grid p-2">
          <h6>Customer Concerns / Blocking Issue</h6>
          <div className="col-12">
            {/* Button add */}
            <Button
              label="Add New"
              icon="pi pi-plus"
              severity="success"
              size="small"
              onClick={openCreateDialog}
            />
          </div>
          <div className="col-12 lg:col-6">
            {/* Card */}
            {concernCategories.filter(Boolean).map((category) => (
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
                      label="Edit"
                      icon="pi pi-pencil"
                      size="small"
                      outlined
                      onClick={() => openEditDialog(category)}
                    />
                    <Button
                      label="Delete"
                      icon="pi pi-trash"
                      size="small"
                      severity="danger"
                      outlined
                      onClick={() => openDeleteDialog(category)}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <Dialog
        header={editingCategoryId !== null ? 'Edit Category' : 'Add New Category'}
        visible={showAddDialog}
        style={{ width: '25vw' }}
        onHide={closeAddDialog}
        footer={footerContent}
      >
        <div className="inline-flex flex-column gap-2 w-full my-2">
          <label htmlFor="name" className="text-primary-50 font-semibold">
            Category Name
          </label>
          <InputText
            id="name"
            value={data.name}
            onChange={(e) => setData({ ...data, name: e.target.value })}
            placeholder="Category name"
            aria-label="Category Name"
            className="bg-white-alpha-20 border-none p-3 text-primary-50"
          />
        </div>

        <div className="inline-flex flex-column gap-2 w-full my-2">
          <label htmlFor="description" className="text-primary-50 font-semibold">
            Description
          </label>
          <InputTextarea
            id="description"
            value={data.description}
            aria-label="Description"
            placeholder="Description"
            onChange={(e) => setData({ ...data, description: e.target.value })}
            className="bg-white-alpha-20 border-none p-3 text-primary-50"
          />
        </div>
      </Dialog>

      <Dialog
        header="Delete Category"
        visible={showDeleteDialog}
        style={{ width: '25vw' }}
        onHide={closeDeleteDialog}
        footer={deleteFooterContent}
      >
        <div className="inline-flex flex-column gap-2 w-full my-2">
          <p>Are you sure you want to delete this category?</p>
        </div>
      </Dialog>
    </>
  )
}

export default SettingsPage
