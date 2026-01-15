'use client'

import ProductImageUploader from './Components/ProductImageUploader'
import { DialogFooter, DialogHeader } from '../components/ui/dialog'
import { IProduct } from '@saleshub-tsm/types'
import { Button } from 'primereact/button'
import { Card } from 'primereact/card'
import { Checkbox } from 'primereact/checkbox'
import { Dialog } from 'primereact/dialog'
import { Divider } from 'primereact/divider'
import { Dropdown } from 'primereact/dropdown'
import { InputText } from 'primereact/inputtext'
import { Paginator } from 'primereact/paginator'
import { Toast } from 'primereact/toast'
import { useEffect, useRef, useState } from 'react'

import { useDebounce } from '@/hooks/useDebounce'
import { formatCurrency } from '@/lib/formatter'
import { useCustomerStore } from '@/stores/customers'
import { useProductDevelopmentStore } from '@/stores/product-development'
import { useProductsStore } from '@/stores/products'

interface PaginatorChangeEvent {
  first: number
  rows: number
  page: number
  pageCount: number
}

const ProductList = () => {
  const {
    data: products,
    loading,
    search,
    setSearch,
    fetchProducts,
    categories,
    setSelectedCategory,
    selectedCategory,
    total,
    page,
    totalPages,
    limit,
    setPage,
    setLimit,
  } = useProductsStore()

  const [visible, setVisible] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const toast = useRef<Toast>(null)

  const { fetchSubgroupOptions, subgroupOptions } = useCustomerStore()

  const {
    setActiveProduct,
    activeProduct,
    subgroupIds,
    setSubgroups,
    reset,
    sync,
    removeActiveProduct,
  } = useProductDevelopmentStore()

  const searchDebounced = useDebounce(search, 300)

  const first = (page - 1) * limit

  useEffect(() => {
    fetchSubgroupOptions()
  }, [])
  // Fetch products saat mount & saat page, limit, filter, search berubah
  useEffect(() => {
    fetchProducts()
  }, [page, limit, selectedCategory, searchDebounced])

  // Reset page ke 1 saat filter atau search berubah
  useEffect(() => {
    setPage(1)
  }, [selectedCategory, searchDebounced])

  // Handler paginator
  const onPageChange = (e: PaginatorChangeEvent) => {
    setLimit(e.rows)
    setPage(Math.floor(e.first / e.rows) + 1)
  }

  const handleRemove = async () => {
    await removeActiveProduct()
    setShowDeleteDialog(false)
    fetchProducts()
  }

  const onSetPriority = (item: IProduct) => {
    setActiveProduct(item)
    setVisible(true)
  }

  const syncProductDevelopment = async () => {
    if (!subgroupIds.length) {
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Please select at least one subgroup',
      })

      return
    }

    await sync()
    fetchProducts()
    setVisible(false)
  }
  const footer = (item: IProduct) => {
    if (item.product_developments?.length) {
      return (
        <div className="flex gap-2">
          <Button
            label="Update Priority"
            rounded
            severity="success"
            size="small"
            outlined
            onClick={() => onSetPriority(item)}
            icon="pi pi-star"
          />
          <Button
            label="Remove Priority"
            rounded
            severity="warning"
            size="small"
            outlined
            onClick={() => {
              setActiveProduct(item)
              setShowDeleteDialog(true)
            }}
            icon="pi pi-trash"
          />
        </div>
      )
    }

    return (
      <>
        <Button
          label="Set Priority"
          rounded
          severity="success"
          size="small"
          outlined
          onClick={() => onSetPriority(item)}
          icon="pi pi-star"
        />
      </>
    )
  }

  const dialogFooter = (
    <div>
      <Button
        label="Cancel"
        icon="pi pi-times"
        onClick={() => setVisible(false)}
        className="p-button-text"
        severity="danger"
      />
      <Button
        label="Save"
        icon="pi pi-save"
        onClick={syncProductDevelopment}
        autoFocus
        outlined
        severity="success"
      />
    </div>
  )

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
      <h5>Product List</h5>

      <div className="grid mb-4">
        <div className="col-12 md:col-3">
          <Dropdown
            value={selectedCategory}
            options={categories}
            onChange={(e) => setSelectedCategory(e.value)}
            placeholder="Select Category"
            className="w-full md:w-48"
          />
        </div>
        <div className="col-12 md:col-3">
          <InputText
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search..."
            className="w-full md:w-48"
          />
        </div>
      </div>

      {/* Product grid */}
      <div className="grid">
        {products.length === 0 && !loading && (
          <div className="col-12 text-center py-5">No products found</div>
        )}

        {products.map((item) => (
          <div className="col-12 lg:col-6 xl:col-6" key={item.ItemCode}>
            <Card
              footer={() => footer(item)}
              className="mb-3 p-3 h-[180px]"
              pt={{
                root: {
                  style: {
                    minHeight: '100%',
                  },
                },
              }}
            >
              <div className="flex items-start gap-4 h-full">
                {/* IMAGE */}
                <div className="w-[150px] h-[150px] flex-shrink-0 flex items-center justify-center ">
                  <ProductImageUploader
                    code={item.ItemCode}
                    alt={item.ItemName}
                    width={150}
                    height={150}
                  />
                </div>

                {/* TEXT */}
                <div className="flex flex-col items-start justify-start">
                  <div className="text-base leading-tight line-clamp-2">
                    <p className="font-semibold">{item.ItemName}</p>
                    <div className="mt-1 text-sm text-gray-500 mt-3">
                      <i className="pi pi-tags"></i> {item.ItmsGrpNam}
                    </div>
                    <div className="mt-1 text-sm font-semibold mt-3">
                      {formatCurrency(Number(item.HargaJualNormal), true, true)}
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        ))}
      </div>

      {/* Paginator */}
      {products.length > 0 && (
        <div className="mt-4">
          <Paginator
            className="paginator border-0"
            first={first}
            rows={limit}
            totalRecords={total} // total dari backend
            rowsPerPageOptions={[10, 20, 30]} // dropdown rows per page
            onPageChange={onPageChange}
            template="FirstPageLink PrevPageLink  PageLinks  NextPageLink  LastPageLink CurrentPageReport  RowsPerPageDropdown"
            currentPageReportTemplate={`Page ${page} of ${totalPages}`}
          />
        </div>
      )}
      <Toast ref={toast} position="top-right" />

      <Dialog
        modal
        blockScroll
        visible={visible}
        onHide={() => {
          reset()
          setVisible(false)
        }}
        style={{ width: '80%' }}
        header="Subgroups"
        footer={dialogFooter}
      >
        <DialogHeader className="mb-3">
          Set target subgroup for {activeProduct?.ItemName}
        </DialogHeader>

        <Divider />
        <div className="flex items-start gap-2 mb-3">
          <Checkbox
            checked={subgroupIds.length === subgroupOptions.length}
            onChange={(e) => {
              if (e.checked) {
                setSubgroups(subgroupOptions.map((sg) => sg.value))
              } else {
                setSubgroups([])
              }
            }}
            inputId="select-all"
          />
          <label htmlFor="select-all" className="cursor-pointer font-semibold">
            Select All
          </label>
        </div>
        <div className="grid">
          {subgroupOptions.map((sg) => (
            <div key={sg.value} className="col-12 md:col-4 flex items-center gap-2">
              <Checkbox
                checked={subgroupIds.includes(sg.value)}
                inputId={`sg-${sg.value}`}
                value={sg.value}
                onChange={(e) => {
                  const value = e.value as number

                  if (subgroupIds.includes(value)) {
                    setSubgroups(subgroupIds.filter((id) => id !== value)) // uncheck
                  } else {
                    setSubgroups([...subgroupIds, value]) // check
                  }
                }}
              />
              <label htmlFor={`sg-${sg.value}`} className="cursor-pointer">
                {sg.label}
              </label>
            </div>
          ))}
        </div>
        <DialogFooter></DialogFooter>
      </Dialog>
      <Dialog
        header="Confirm Delete"
        visible={showDeleteDialog}
        onHide={() => setShowDeleteDialog(false)}
        modal
        footer={
          <div className="flex justify-end gap-2">
            <Button label="Cancel" outlined onClick={() => setShowDeleteDialog(false)} />
            <Button label="Delete" severity="danger" onClick={handleRemove} />
          </div>
        }
      >
        <p>Remove this product from product development?</p>
      </Dialog>
    </div>
  )
}

export default ProductList
