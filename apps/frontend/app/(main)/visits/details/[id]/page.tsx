'use client'

import { IVisitItem, ProductWithFrequency } from '@saleshub-tsm/types'
import { useParams } from 'next/navigation'
import { Card } from 'primereact/card'
import { Checkbox, CheckboxChangeEvent } from 'primereact/checkbox'
import { Dropdown } from 'primereact/dropdown'
import { InputText } from 'primereact/inputtext'
import { OverlayPanel } from 'primereact/overlaypanel'
import { useEffect, useRef, useState } from 'react'

import OfferedProduct from '@/app/(main)/components/product/OfferedProduct'
import ProductOfferCard from '@/app/(main)/components/product/ProductOfferCard'
import VisitDetailHeader from '@/app/(main)/customers/components/VisitDetailHeader'
import { useSalesVisit } from '@/stores'
import { useInquiryStore } from '@/stores/inquiry'

const VisitDetailsPage = () => {
  const { id } = useParams()
  const salesVisirStore = useSalesVisit()
  const [suggestedGroup, setSuggestedGroup] = useState('')

  const { salesVisit, fetchVisitDetails } = salesVisirStore
  const { fetchInquiries, inquiries } = useInquiryStore()
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [search, setSearch] = useState('')
  const [activeProductGroup, setActiveProductGroup] = useState<ProductWithFrequency[]>([])
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const overlayRefs = useRef<Record<string, OverlayPanel | null>>({})

  useEffect(() => {
    fetchVisitDetails(Number(id))
    fetchInquiries(Number(id))
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
    }, 300)

    return () => clearTimeout(timer)
  }, [search])

  const { suggestedItems, customer, visit_items } = salesVisit
  const suggestedGroups = [
    { key: 'distributor', label: 'Distributor', items: suggestedItems?.distributor ?? [] },
    { key: 'groceries', label: 'Groceries', items: suggestedItems?.groceries ?? [] },
  ] as const

  useEffect(() => {
    if (!suggestedGroup) {
      setActiveProductGroup([])
    }
    setActiveProductGroup(
      suggestedGroups.find((group) => group.key === suggestedGroup)?.items ?? []
    )
  }, [suggestedGroup])

  const handleChangeSuggestedGroup = (value: string) => {
    setSuggestedGroup(value)
    setSelectedCategories([])

    const activeGroup = suggestedGroups.find((group) => group.key === value)
    setActiveProductGroup(activeGroup?.items ?? [])
    setSearch('')
  }

  const isDistributor = suggestedGroup === 'distributor'
  const distributorCategories = isDistributor
    ? activeProductGroup.reduce((acc, item) => {
        const categoryName = item.ProductCategory ?? ''

        const exists = acc.find((option) => option.value === categoryName)

        if (categoryName && !exists) {
          acc.push({
            value: categoryName,
            label: categoryName,
          })
        }
        return acc
      }, [] as { value: string; label: string }[])
    : []

  const onCategoryChange = (e: CheckboxChangeEvent) => {
    let _selected = [...selectedCategories]

    if (e.checked) {
      _selected.push(e.value)
    } else {
      _selected = _selected.filter((category) => category !== e.value)
    }

    setSelectedCategories(_selected)
  }

  const offeredProductIds = new Set((visit_items ?? []).map((item) => item.product_id))

  const filteredProducts = activeProductGroup.filter((item) => {
    const offered = offeredProductIds.has(item.id)
    if (offered) return false

    const matchCategory =
      selectedCategories.length === 0 || selectedCategories.includes(item.ProductCategory ?? '')

    const keyword = debouncedSearch.trim().toLowerCase()

    const matchSearch = !keyword || item.ItemName?.toLowerCase().includes(keyword)

    return matchCategory && matchSearch
  })

  useEffect(() => {
    if (!isDistributor) return

    const keyword = debouncedSearch.trim().toLowerCase()

    if (!keyword) {
      setSelectedCategories([])
      return
    }

    const matchedCategories = Array.from(
      new Set(
        activeProductGroup
          .filter((item) => item.ItemName?.toLowerCase().includes(keyword))
          .map((item) => item.ProductCategory ?? '')
          .filter(Boolean)
      )
    )

    setSelectedCategories(matchedCategories)
  }, [debouncedSearch, isDistributor, activeProductGroup])

  const groupedProduct = salesVisit.visit_items?.reduce(
    (acc, item) => {
      const product = item.product
      if (!product) return acc

      if (product.Distributor === 'Y') {
        const category = product.ProductCategory || 'Uncategorized'

        // cari category
        let group = acc.distributor.find((g) => g.category === category)

        if (!group) {
          group = { category, items: [] }
          acc.distributor.push(group)
        }

        group.items.push(item)
      } else {
        acc.groceries.push(item)
      }

      return acc
    },
    {
      distributor: [] as { category: string; items: IVisitItem[] }[],
      groceries: [] as IVisitItem[],
    }
  )

  const offeredDistributor = groupedProduct?.distributor
  const offeredGroceries = groupedProduct?.groceries

  return (
    <>
      <VisitDetailHeader customer={customer} salesVisit={salesVisit} />
      <div className="card mb-2">
        <h5 className="ml-2">Product Suggestions</h5>
        <div className="col-12 xl:col-6 md:col-6">
          <div className="">
            <label htmlFor={`itemGroup-${salesVisit.id}`} className="block mb-2">
              Item Group
            </label>
            <Dropdown
              id={`itemGroup-${salesVisit.id}`}
              options={suggestedGroups.map((group) => {
                return { label: group.key.toUpperCase(), value: group.key }
              })}
              value={suggestedGroup}
              onChange={(e) => handleChangeSuggestedGroup(e.value)}
              placeholder="Item Group"
              className="w-full"
            />
          </div>
        </div>
        {suggestedGroup && (
          <div className="col-12 xl:col-6 md:col-6 mb-2">
            <label htmlFor={`search-${salesVisit.id}`} className="block mb-2">
              Search
            </label>
            <InputText
              id={`search-${salesVisit.id}`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search Items"
              className="w-full"
            />
          </div>
        )}
        {activeProductGroup.length > 0 && (
          <>
            <div className="mx-2 mt-3">
              <h6>SUGGESTED ITEMS {suggestedGroup?.toUpperCase()}</h6>
              {isDistributor && distributorCategories.length > 0 ? (
                <div className="flex flex-column gap-3">
                  <p className="m-0">Pick Categories</p>
                  {distributorCategories
                    .filter((cat) => {
                      const productsInCategory = activeProductGroup.filter(
                        (item) => item.ProductCategory === cat.value
                      )

                      // hanya hilangkan jika SEMUA sudah di-offer
                      return productsInCategory.some((item) => !offeredProductIds.has(item.id))
                    })
                    .map((cat) => (
                      <div key={cat.value}>
                        <div className="flex align-items-center pb-2">
                          <Checkbox
                            inputId={`cat-${cat.value}`}
                            name="category"
                            value={cat.value}
                            onChange={onCategoryChange}
                            checked={selectedCategories.includes(cat.value)}
                          />
                          <label htmlFor={`cat-${cat.value}`} className="ml-2">
                            {cat.label}
                          </label>
                        </div>
                        <div className="grid">
                          {selectedCategories.length > 0
                            ? filteredProducts
                                .filter((item) => item.ProductCategory === cat.value)
                                .map((item) => {
                                  const category = item.ProductCategory
                                    ? item.ProductCategory.charAt(0) +
                                      item.ProductCategory.slice(1).toLocaleLowerCase()
                                    : ''
                                  const visitItems = visit_items?.find(
                                    (i) => i.product_id === item.id
                                  )
                                  const visitItemConcerns = visitItems?.visit_item_concerns

                                  return (
                                    <div
                                      key={`distributor-${item.ItemCode}`}
                                      className="col-12 lg:col-6 xl:col-4"
                                    >
                                      <ProductOfferCard
                                        item={item}
                                        category={category}
                                        visitItemConcern={visitItemConcerns?.[0]}
                                        overlayRefs={overlayRefs}
                                        hideOfferButton
                                      />
                                    </div>
                                  )
                                })
                            : null}
                        </div>
                      </div>
                    ))}
                  {filteredProducts.length === 0 && search && (
                    <div className="col-12">
                      <div className="flex align-items-center justify-content-start w-full text-sm text-yellow-500">
                        <i className="mr-2 pi pi-exclamation-triangle"></i>
                        <p className="m-0">No Items Found</p>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="grid">
                  {filteredProducts.map((item) => {
                    const category = item.ProductCategory
                      ? item.ProductCategory.charAt(0) +
                        item.ProductCategory.slice(1).toLocaleLowerCase()
                      : ''
                    const visitItems = visit_items?.find((i) => i.product_id === item.id)
                    const visitItemConcerns = visitItems?.visit_item_concerns
                    return (
                      <div key={`groceries-${item.ItemCode}`} className="col-12 lg:col-6 xl:col-4">
                        <ProductOfferCard
                          item={item}
                          category={category}
                          visitItemConcern={visitItemConcerns?.[0]}
                          overlayRefs={overlayRefs}
                          hideOfferButton
                        />
                      </div>
                    )
                  })}
                  {filteredProducts.length === 0 && (
                    <div className="col-12">
                      <div className="flex align-items-center justify-content-start w-full text-sm text-yellow-500">
                        <i className="mr-2 pi pi-exclamation-triangle"></i>
                        <p className="m-0">No Items Found</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      <div className="card p-3">
        <h4 className="mb-4">Offered Items</h4>

        {/* ================= DISTRIBUTOR ================= */}
        {(offeredDistributor?.length ?? 0) > 0 && (
          <div className="mb-5">
            <div className="flex align-items-center gap-2 mb-3">
              <i className="pi pi-box text-primary" />
              <span className="text-lg font-semibold">Distributor</span>
            </div>

            {offeredDistributor?.map((distributorItem) => {
              const category = distributorItem.category
              const visitItems = distributorItem.items

              return (
                <div key={`distributor-${category}`} className="mb-4">
                  {/* CATEGORY TITLE */}
                  <div className="text-sm font-semibold text-600 mb-2 ml-1">{category}</div>

                  {/* GRID */}
                  <div className="grid">
                    {visitItems.map((visitItem) => (
                      <div key={visitItem.id.toString()} className="col-12 md:col-6 xl:col-4">
                        <OfferedProduct visitItem={visitItem} defaultOpen={true} />
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* ================= GROCERIES ================= */}
        {(offeredGroceries?.length ?? 0) > 0 && (
          <div>
            <div className="flex align-items-center gap-2 mb-3">
              <i className="pi pi-shopping-cart text-green-500" />
              <span className="text-lg font-semibold">Groceries</span>
            </div>

            <div className="grid">
              {offeredGroceries?.map((groceriesItem) => (
                <div key={groceriesItem.id.toString()} className="col-12 md:col-6 xl:col-4">
                  <OfferedProduct visitItem={groceriesItem} defaultOpen={true} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      {inquiries.length > 0 && (
        <div className="card">
          <h5 className="ml-2">Product Inquiries</h5>
          <div className="grid">
            {inquiries.map((inquiry) => (
              <div className="col-12 md:col-12 lg:col-12 flex" key={`inquiry-${inquiry.id}`}>
                <Card className="w-full h-full p-2">
                  <div className="flex flex-column w-full gap-3">
                    <div className="flex w-full align-items-start gap-3">
                      <div className="w-9 flex flex-column text-xs text-color-secondary font-medium pt-1">
                        <div className="text-lg font-bold text-color line-height-2">
                          {inquiry.product_name}
                        </div>
                        <div className="text-sm py-2 text-color-secondary line-height-3">
                          {inquiry.notes}
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  )
}

export default VisitDetailsPage
