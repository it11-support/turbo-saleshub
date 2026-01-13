'use client'

import ProductImageUploader from './Components/ProductImageUploader'
import { Button } from 'primereact/button'
import { Card } from 'primereact/card'
import { Dropdown } from 'primereact/dropdown'
import { InputText } from 'primereact/inputtext'
import { Paginator } from 'primereact/paginator'
import { useEffect } from 'react'

import { useDebounce } from '@/hooks/useDebounce'
import { formatCurrency } from '@/lib/formatter'
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

  const searchDebounced = useDebounce(search, 300)

  const first = (page - 1) * limit

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
    setLimit(e.rows) // update limit jika user pilih rowsPerPage
    setPage(Math.floor(e.first / e.rows) + 1) // update page
  }

  return (
    <div className="card p-4">
      {/* Header */}
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
          <div className="col-12 lg:col-6 xl:col-4" key={item.ItemCode}>
            <Card className="mb-3 p-3 h-[180px]">
              <div className="flex items-start gap-4 h-full">
                {/* IMAGE */}
                <div className="w-[150px] h-[150px] flex-shrink-0 flex items-center justify-center">
                  <ProductImageUploader
                    code={item.ItemCode}
                    alt={item.ItemName}
                    width={150}
                    height={150}
                  />
                </div>

                {/* TEXT */}
                <div className="flex flex-col items-start justify-start">
                  <div className="font-bold text-base leading-tight line-clamp-2">
                    {item.ItemName}
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
      <div className="mt-4">
        <Paginator
          first={first}
          rows={limit}
          totalRecords={total} // total dari backend
          rowsPerPageOptions={[10, 20, 30]} // dropdown rows per page
          onPageChange={onPageChange}
          template="FirstPageLink PrevPageLink  PageLinks  NextPageLink  LastPageLink CurrentPageReport  RowsPerPageDropdown"
          currentPageReportTemplate={`Page ${page} of ${totalPages}`}
        />
      </div>
    </div>
  )
}

export default ProductList
