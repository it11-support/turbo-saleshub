'use client'

import {
  CompetitorProduct,
  IInquiry,
  IVisitItem,
  ProductWithFrequency,
  RawVisitCompetitor,
  VisitCompetitor,
} from '@saleshub-tsm/types'
import { useParams } from 'next/navigation'
import { Card } from 'primereact/card'
import { Checkbox, CheckboxChangeEvent } from 'primereact/checkbox'
import { Dropdown } from 'primereact/dropdown'
import { InputText } from 'primereact/inputtext'
import { OverlayPanel } from 'primereact/overlaypanel'
import { Tag } from 'primereact/tag'
import { useEffect, useRef, useState } from 'react'
import useSWR from 'swr'

import OfferedProduct from '@/app/(main)/components/product/OfferedProduct'
import ProductOfferCard from '@/app/(main)/components/product/ProductOfferCard'
import VisitDetailHeader from '@/app/(main)/customers/components/VisitDetailHeader'
import { fetcher } from '@/app/(main)/lib'
import { createUrl } from '@/lib/api'

const VisitDetailsPage = () => {
  const { id } = useParams()
  const [suggestedGroup, setSuggestedGroup] = useState('')

  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [search, setSearch] = useState('')
  const [activeProductGroup, setActiveProductGroup] = useState<ProductWithFrequency[]>([])
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const overlayRefs = useRef<Record<string, OverlayPanel | null>>({})

  const apiDetailUrl = createUrl(`visit/${id}/details`)
  const { data: visitDetailsData } = useSWR(apiDetailUrl, fetcher)

  const apiInquiryUrl = createUrl(`inquiry/${id}`)
  const { data: inquiriesData } = useSWR(apiInquiryUrl, fetcher)

  const salesVisit = visitDetailsData?.data || {}

  const inquiries = inquiriesData?.data?.inquiries || []

  const visitCompetitors: RawVisitCompetitor[] = visitDetailsData?.data?.visit_competitors || []

  const competitors: VisitCompetitor[] = visitCompetitors.map((vc) => ({
    competitor_id: vc.competitor_id,
    name: vc.competitors?.name,
    products: vc.competitor_products,
  }))

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
    ? activeProductGroup.reduce(
        (acc, item) => {
          const categoryName = item.ProductCategory ?? ''

          const exists = acc.find((option) => option.value === categoryName)

          if (categoryName && !exists) {
            acc.push({
              value: categoryName,
              label: categoryName,
            })
          }
          return acc
        },
        [] as { value: string; label: string }[]
      )
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

  const offeredProductIds = new Set((visit_items ?? []).map((item: IVisitItem) => item.product_id))

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
    (
      acc: { distributor: { category: string; items: IVisitItem[] }[]; groceries: IVisitItem[] },
      item: IVisitItem
    ) => {
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
                                    (i: IVisitItem) => i.product_id === item.id
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
                    const visitItems = visit_items?.find(
                      (i: IVisitItem) => i.product_id === item.id
                    )
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

      {(offeredDistributor?.length > 0 || offeredGroceries?.length > 0) && (
        <div className="card p-3">
          <h5 className="ml-2">Offered Items</h5>

          {/* ================= DISTRIBUTOR ================= */}
          {(offeredDistributor?.length ?? 0) > 0 && (
            <Card className="w-full h-full shadow-none px-0" title="DISTRIBUTOR">
              {offeredDistributor?.map(
                (distributorItem: { category: string; items: IVisitItem[] }) => {
                  const category = distributorItem.category
                  const visitItems = distributorItem.items
                  return (
                    <div key={`distributor-${category}`} className="py-3">
                      <h5>{category}</h5>
                      <div className="grid">
                        {visitItems.map((visitItem) => {
                          return (
                            <OfferedProduct
                              visitItem={visitItem}
                              key={visitItem.id.toString()}
                              defaultOpen={false}
                            />
                          )
                        })}
                      </div>
                    </div>
                  )
                }
              )}
            </Card>
          )}

          {/* ================= GROCERIES ================= */}
          {(offeredGroceries?.length ?? 0) > 0 && (
            <Card className="w-full h-full shadow-none px-0" title="GROCERIES">
              <div className="grid">
                {offeredGroceries?.map((groceriesItem: IVisitItem) => {
                  return (
                    <OfferedProduct
                      defaultOpen={false}
                      visitItem={groceriesItem}
                      key={groceriesItem.id.toString()}
                    />
                  )
                })}
              </div>
            </Card>
          )}
        </div>
      )}

      {inquiries.length > 0 && (
        <div className="card">
          <h5 className="ml-2">Product Inquiries</h5>
          <div className="grid">
            {inquiries.map((inquiry: IInquiry) => (
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

      {competitors.length > 0 && (
        <div className="card">
          <h5 className="ml-2">Competitors</h5>
          {/* Competitor */}
          {competitors.map((competitor: VisitCompetitor) => (
            <div className="col-12" key={`competitor-${competitor.competitor_id}`}>
              <Card className="w-full">
                <div className="flex flex-column gap-2">
                  {/* HEADER */}
                  <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center gap-2 pb-3 border-bottom-1 surface-border">
                    <div>
                      <div className="text-2xl font-bold text-900">{competitor.name}</div>

                      <div className="text-sm text-500 mt-1">
                        {competitor.products.length} Product
                        {competitor.products.length > 1 ? 's' : ''}
                      </div>
                    </div>
                  </div>

                  <h6 className="mb-1 ml-1">Competitor Products</h6>
                  {/* PRODUCT LIST */}
                  <div className="flex flex-column gap-2">
                    {competitor.products.map((product: CompetitorProduct) => (
                      <div
                        key={`product-${product.id}`}
                        className="surface-border border-round-sm border-1 p-3 lg:p-4"
                      >
                        {/* TOP SECTION */}
                        <div className="flex flex-column lg:flex-row lg:justify-content-between lg:align-items-start gap-3">
                          {/* LEFT */}
                          <div className="flex-1">
                            <div className="grid">
                              {/* PRODUCT */}
                              <div className="col-12">
                                <div className="text-500 text-sm mb-1">Product</div>

                                <div className="text-lg font-semibold text-900 line-height-3">
                                  {product.product_name}
                                </div>
                              </div>

                              {/* BRAND */}
                              <div className="col-12">
                                <div className="text-500 text-sm mb-1">Brand</div>

                                <div className="text-lg font-semibold text-900">
                                  {product.brand || '-'}
                                </div>
                              </div>

                              {/* PRICE + PROMO */}
                              <div className="col-12 md:col-2">
                                <div className="text-500 text-sm mb-1">Price</div>

                                <div className="flex align-items-center gap-2 flex-wrap">
                                  <div className="font-semibold text-900">
                                    Rp {Number(product.price).toLocaleString('id-ID')} /{' '}
                                    {product.unit || 'unit'}
                                  </div>

                                  {product.is_promo && <Tag value="Promo" severity="danger" />}
                                </div>
                              </div>

                              <div className="col-6 md:col-2">
                                <div className="text-500 text-sm mb-1">Monthly Usage</div>

                                <div className="font-semibold text-900">
                                  {product.monthly_usage !== undefined
                                    ? product.monthly_usage
                                    : '-'}{' '}
                                  / {product.unit || 'unit'}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* NOTES */}
                        {product.notes && (
                          <div className="mt-4 pt-3 border-top-1 surface-border">
                            <div className="text-500 text-sm mb-2">Notes</div>

                            <div className="surface-100 border-round-lg p-3 text-700 line-height-3">
                              {product.notes}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            </div>
          ))}
        </div>
      )}
    </>
  )
}

export default VisitDetailsPage
