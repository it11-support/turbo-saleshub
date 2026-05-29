'use client'

import ProductImageUploader from './Components/ProductImageUploader'
import CustomChip from '../components/custom/chip'
import NavButton from '../customers/components/NavButton'
import { fetcher } from '../lib'
import {
  EProductCategory,
  IProduct,
  IResPaginated,
  IResSingle,
  ISubGroup,
} from '@saleshub-tsm/types'
import { parseAsBoolean, parseAsInteger, parseAsString, useQueryStates } from 'nuqs'
import { Button } from 'primereact/button'
import { Card } from 'primereact/card'
import { Checkbox } from 'primereact/checkbox'
import { Dialog } from 'primereact/dialog'
import { Divider } from 'primereact/divider'
import { Dropdown } from 'primereact/dropdown'
import { Editor } from 'primereact/editor'
import { InputText } from 'primereact/inputtext'
import { Paginator } from 'primereact/paginator'
import { Toast } from 'primereact/toast'
import Quill from 'quill'
import { useEffect, useRef, useState } from 'react'
import useSWR from 'swr'

import { useDebounce } from '@/hooks/useDebounce'
import { useAuth } from '@/layout/context/AuthContext'
import { createUrl } from '@/lib/api'
import { formatCurrency } from '@/lib/formatter'
import { useProductDevelopmentStore } from '@/stores/product-development'
import { useProductsStore } from '@/stores/products'

interface PaginatorChangeEvent {
  first: number
  rows: number
  page: number
  pageCount: number
}

const ProductList = () => {
  const { updateProductInfo } = useProductsStore()

  const [visible, setVisible] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showInfoDialog, setShowInfoDialog] = useState(false)
  const [currentProductInfo, setCurrentProductInfo] = useState<string | null>('')

  const auth = useAuth()

  const toast = useRef<Toast>(null)
  const quillRef = useRef<Editor>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  const {
    setActiveProduct,
    activeProduct,
    subgroupIds,
    setSubgroups,
    reset,
    sync,
    removeActiveProduct,
  } = useProductDevelopmentStore()

  const [filters, setFilters] = useQueryStates(
    {
      page: parseAsInteger.withDefault(1),
      limit: parseAsInteger.withDefault(10),
      search: parseAsString.withDefault(''),
      category: parseAsInteger,
      distributor: parseAsBoolean.withDefault(false),
      productFocused: parseAsBoolean.withDefault(false),
      group: parseAsString,
    },
    { shallow: true, history: 'replace' }
  )

  const first = (filters.page - 1) * filters.limit
  const [localSearch, setLocalSearch] = useState(filters.search)
  const debouncedLocalSearch = useDebounce(localSearch, 400)

  useEffect(() => {
    if (debouncedLocalSearch !== filters.search) {
      setFilters({ search: debouncedLocalSearch || null, page: 1 })
    }
  }, [debouncedLocalSearch])

  const payload = {
    page: filters.page,
    limit: filters.limit,
    distributor: filters.distributor ? true : false,
    productFocused: filters.productFocused ? true : false,
    ...(filters.search && { search: filters.search }),
    ...(filters.category && { category: filters.category }),
    ...(filters.group && { group: filters.group }),
  }

  const apiUrl = createUrl('product', payload)
  const { data, isValidating, mutate } = useSWR<
    IResPaginated<IProduct> & {
      data: { categories?: { ItmsGrpCod: number; ItmsGrpNam: string }[] }
    }
  >(apiUrl, fetcher, {
    keepPreviousData: true,
    revalidateOnFocus: false,
  })

  const products = data?.data.items || []
  const categories = data?.data.categories || []
  const totalRecords = data?.data.totalRecords || 0
  const totalPages = data?.data.totalPages || 1

  const subGroupsApiUrl = createUrl('customers/subgroups')
  const { data: subgroupsData } = useSWR<IResSingle<ISubGroup>>(subGroupsApiUrl, fetcher)

  const subgroupsOptions = subgroupsData?.data || []
  // Group Options
  const groupOptions = [
    { label: 'Chemical', value: EProductCategory.CHEMICAL },
    { label: 'Butter', value: EProductCategory.BUTTER },
    { label: 'Tissue', value: EProductCategory.TISSUE },
    { label: 'Groceries', value: EProductCategory.GROCERIES },
  ]
  // Handler paginator
  const onPageChange = (e: PaginatorChangeEvent) => {
    setFilters({ page: Math.floor(e.first / e.rows) + 1, limit: e.rows })
  }

  const handleRemove = async () => {
    await removeActiveProduct()
    setShowDeleteDialog(false)
    mutate()
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
    mutate()
    setVisible(false)
  }

  const handleShowProductInfo = (item: IProduct) => {
    setActiveProduct(item)

    if (item.ProductInfo) {
      setCurrentProductInfo(item.ProductInfo)
    } else {
      setCurrentProductInfo(null)
    }
    setShowInfoDialog(true)
  }

  const onTextChange = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
    }

    timerRef.current = setTimeout(() => {
      const quill = quillRef.current ? quillRef.current.getQuill() : null

      if (quill) {
        const delta = quill.getContents()
        const deltaString = JSON.stringify(delta)

        setCurrentProductInfo(deltaString)
      }
    }, 500)
  }
  const onLoad = (quill: Quill) => {
    if (currentProductInfo) {
      try {
        const delta = JSON.parse(currentProductInfo)
        quill.setContents(delta)
      } catch (err) {
        console.error('Invalid JSON string:', err)
      }
    }
  }

  const footer = (item: IProduct) => {
    if (item.product_developments?.length) {
      return (
        <div className="flex flex-wrap gap-2 mt-2">
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
            label="Info"
            rounded
            severity="success"
            size="small"
            outlined
            onClick={() => handleShowProductInfo(item)}
            icon="pi pi-info-circle"
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
      <div className="flex flex-wrap gap-2 mt-2">
        <Button
          label="Set Priority"
          rounded
          severity="success"
          size="small"
          outlined
          onClick={() => onSetPriority(item)}
          icon="pi pi-star"
        />
        <Button
          label="Info"
          rounded
          severity="success"
          size="small"
          outlined
          onClick={() => handleShowProductInfo(item)}
          icon="pi pi-info-circle"
        />
      </div>
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

  const renderHeader = () => {
    return (
      <span className="ql-formats">
        <select className="ql-size"></select>
        <select className="ql-font"></select>
        {/* 1. Grup List & Checklist */}
        <button className="ql-list" value="ordered" type="button" title="Nomor"></button>
        <button className="ql-list" value="bullet" type="button" title="Poin"></button>
        <button className="ql-list" value="check" type="button" title="Checklist"></button>

        {/* 2. Grup Warna (Teks & Highlight) */}
        <select className="ql-color" title="Warna Teks"></select>
        <select className="ql-background" title="Warna Latar"></select>

        {/* 3. Grup Formatting Dasar */}
        <button className="ql-bold" aria-label="Bold"></button>
        <button className="ql-italic" aria-label="Italic"></button>
        <button className="ql-underline" aria-label="Underline"></button>

        {/* 4. Bersihkan Format */}
        <button className="ql-clean" type="button" title="Hapus Format"></button>

        {/* JANGAN MASUKKAN <button className="ql-image"></button> DI SINI */}
      </span>
    )
  }

  const handleSaveInfo = async () => {
    const productId = activeProduct?.id
    const productInfo = currentProductInfo
    await updateProductInfo(Number(productId), productInfo as string)
    setShowInfoDialog(false)
  }

  const header = renderHeader()
  return (
    <div className="card p-4">
      <NavButton />
      <h5>Product List</h5>

      <div className="grid mb-4">
        <div className="col-12 md:col-3">
          <Dropdown
            value={filters.category} // Tambahkan ?? null
            options={categories}
            optionLabel="ItmsGrpNam"
            optionValue="ItmsGrpCod"
            onChange={(e) => {
              const val = e.value === undefined ? null : e.value
              setFilters({ category: val, page: 1 })
            }}
            placeholder="Select Category"
            showClear
            className="w-full md:w-48"
          />
        </div>
        <div className="col-12 md:col-3">
          <Dropdown
            value={filters.group ?? null}
            options={groupOptions}
            onChange={(e) => {
              setFilters({ group: e.value ?? null, page: 1 })
            }}
            placeholder="Select Product Group"
            className="w-full md:w-48"
            showClear
          />
        </div>
        <div className="col-12 md:col-3 flex align-items-center">
          <InputText
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            placeholder="Search..."
            className="w-full md:w-48"
          />
        </div>
      </div>
      <div className="grid mb-4">
        <div className="col-12 md:col-3 flex align-items-center">
          <div className="flex align-items-center gap-2">
            <Checkbox
              inputId="productFocused"
              name="productFocused"
              value={filters.productFocused}
              onChange={(e) => {
                setFilters({ productFocused: e.checked as boolean, page: 1 })
                mutate()
              }}
              checked={filters.productFocused}
            />
            <label htmlFor="productFocused" className="ml-2">
              Show Product Focus
            </label>
          </div>
        </div>
        <div className="col-12 md:col-3 flex align-items-center">
          <div className="flex align-items-center gap-2">
            <Checkbox
              inputId="distributor"
              name="distributor"
              value={filters.distributor}
              onChange={(e) => setFilters({ distributor: e.checked as boolean, page: 1 })}
              checked={filters.distributor}
            />
            <label htmlFor="distributor" className="ml-2">
              Show Distributor Product
            </label>
          </div>
        </div>
      </div>

      {/* Product grid */}
      <div className="grid">
        {products.length === 0 && !isValidating && (
          <div className="col-12 text-center py-5">No products found</div>
        )}

        {products.map((item: IProduct) => (
          <div className="col-12 lg:col-6 xl:col-6" key={item.ItemCode}>
            <Card footer={() => footer(item)} className="mb-3 p-3">
              <div className="flex flex-column md:flex-row gap-3">
                {/* IMAGE */}
                <div className="flex justify-content-center md:justify-content-start">
                  <div
                    className="flex align-items-center justify-content-center"
                    style={{ width: 140, height: 140 }}
                  >
                    <ProductImageUploader
                      code={item.ItemCode}
                      alt={item.ItemName || ''}
                      width={140}
                      height={140}
                    />
                  </div>
                </div>

                {/* CONTENT */}
                <div className="flex flex-column flex-1">
                  {/* TITLE */}
                  <div className="font-semibold text-base line-clamp-2">{item.ItemName}</div>

                  {/* TAGS */}
                  <div className="flex flex-wrap gap-1 mt-2">
                    <CustomChip label={item.ItmsGrpNam} />

                    {filters.productFocused ? (
                      <CustomChip
                        label="Product Focus"
                        color="var(--blue-500)"
                        removable
                        onRemove={() => {
                          setFilters({ productFocused: null, page: 1 })
                          return true
                        }}
                      />
                    ) : null}

                    {filters.distributor && (
                      <CustomChip
                        label="Distributor Product"
                        color="var(--green-500)"
                        removable
                        onRemove={() => {
                          setFilters({ distributor: false, page: 1 })
                          return true
                        }}
                      />
                    )}

                    {item.ProductCategory && (
                      <CustomChip
                        label={
                          item.ProductCategory.charAt(0).toUpperCase() +
                          item.ProductCategory.slice(1).toLowerCase()
                        }
                        color="var(--orange-500)"
                      />
                    )}
                  </div>

                  {/* PRICE */}
                  <div className="mt-3 font-semibold text-sm">
                    {formatCurrency(Number(item.MinPrice), true, true)} -{' '}
                    {formatCurrency(Number(item.MaxPrice), true, true)} / {item.SalUnitMsr}
                  </div>

                  <Divider className="my-2" />

                  {/* SUMMARY */}
                  <div className="font-semibold">Monthly Summary</div>

                  <div className="text-sm mt-2">
                    Unit Sold: {item.unitsSold! > 0 ? `${item.unitsSold} ${item.SalUnitMsr}` : '-'}
                  </div>

                  <div className="text-sm">
                    Revenue:{' '}
                    {item.revenue! > 0 ? formatCurrency(Number(item.revenue), true, true) : '-'}
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
            rows={filters.limit}
            totalRecords={totalRecords} // total dari backend
            rowsPerPageOptions={[10, 20, 30]} // dropdown rows per page
            onPageChange={onPageChange}
            template="FirstPageLink PrevPageLink  PageLinks  NextPageLink  LastPageLink CurrentPageReport  RowsPerPageDropdown"
            currentPageReportTemplate={`Page ${filters.page} of ${totalPages}`}
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
        <span className="text-sm font-normal text-gray-500 mt-1 block">
          Set target subgroup for{' '}
          <strong className="font-semibold text-gray-700">{activeProduct?.ItemName}</strong>
        </span>

        <Divider />
        <div className="flex items-start gap-2 mb-3">
          <Checkbox
            checked={subgroupIds.length === subgroupsOptions.length}
            onChange={(e) => {
              if (e.checked) {
                setSubgroups(subgroupsOptions.map((sg) => sg.IndCode))
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
          {subgroupsOptions.map((sg) => (
            <div key={sg.IndCode} className="col-12 md:col-4 flex items-center gap-2">
              <Checkbox
                checked={subgroupIds.includes(sg.IndCode)}
                inputId={`sg-${sg.IndCode}`}
                value={sg.IndCode}
                onChange={(e) => {
                  const value = e.value as number

                  if (subgroupIds.includes(value)) {
                    setSubgroups(subgroupIds.filter((id) => id !== value)) // uncheck
                  } else {
                    setSubgroups([...subgroupIds, value]) // check
                  }
                }}
              />
              <label htmlFor={`sg-${sg.IndCode}`} className="cursor-pointer">
                {sg.IndName}
              </label>
            </div>
          ))}
        </div>
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
      <Dialog
        header="Product Information"
        visible={showInfoDialog}
        onHide={() => setShowInfoDialog(false)}
        modal
        style={{ width: '50vw' }}
        dismissableMask
        blockScroll
        footer={
          <div className="flex justify-end gap-2">
            <Button
              label="Cancel"
              severity="danger"
              icon="pi pi-times"
              outlined
              onClick={() => setShowInfoDialog(false)}
            />
            <Button
              icon="pi pi-save"
              severity="success"
              label="Save"
              outlined
              onClick={() => handleSaveInfo()}
            />
          </div>
        }
      >
        <Editor
          readOnly={auth.user?.roles?.role !== 'admin'}
          ref={quillRef}
          onTextChange={onTextChange}
          headerTemplate={header}
          onLoad={onLoad}
          style={{ height: '320px' }}
        />
      </Dialog>
    </div>
  )
}

export default ProductList
