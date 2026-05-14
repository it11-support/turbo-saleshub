'use client'

import OfferedProduct from '../../components/product/OfferedProduct'
import ProductOfferCard from '../../components/product/ProductOfferCard'
import NavButton from '../../customers/components/NavButton'
import Competitors from '../components/Competitors'
import { IVisitItem, ProductWithFrequency } from '@saleshub-tsm/types'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { AutoComplete } from 'primereact/autocomplete'
import { Button } from 'primereact/button'
import { Card } from 'primereact/card'
import { Checkbox } from 'primereact/checkbox'
import { Dialog } from 'primereact/dialog'
import { Divider } from 'primereact/divider'
import { Dropdown } from 'primereact/dropdown'
import { InputText } from 'primereact/inputtext'
import { InputTextarea } from 'primereact/inputtextarea'
import { OverlayPanel } from 'primereact/overlaypanel'
import { Panel } from 'primereact/panel'
import { ProgressSpinner } from 'primereact/progressspinner'
import { useEffect, useRef, useState } from 'react'

import { parsePhone } from '@/lib/phoneParser'
import { useConcernStore, useSalesVisit, useScheduleStore } from '@/stores'
import { useInquiryStore } from '@/stores/inquiry'
import { useProductsStore } from '@/stores/products'

const VisitsPage = () => {
  const salesVisitStore = useSalesVisit()
  const {
    fetchSalesVisit,
    salesVisit,
    syncOfferedItems,
    visitNote,
    setVisitNote,
    endVisit,
    startVisit,
    processItems,
  } = salesVisitStore
  const { fetchScheduleByDate, currentDate } = useScheduleStore()
  const { fetchConcernStatuses, fetchConcernCategories, concernCategories, concernStatuses } =
    useConcernStore()
  const { id } = useParams()
  const searchParams = useSearchParams()

  const {
    fetchProducts,
    data: products,
    setSearch: setSearchStore,
    search: searchStore,
  } = useProductsStore()

  const type = searchParams.get('type')
  const router = useRouter()

  const [showOfferDialog, setShowOfferDialog] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<ProductWithFrequency | null>(null)
  const [concernSelections, setConcernSelections] = useState<
    Record<number | string, Record<number, { notes: string; statusId: number | null }>>
  >({})

  const [concernSelctionForUpdate, setConcernSelctionForUpdate] = useState<
    Record<number, { notes: string; statusId: number | null }>
  >({})

  const [suggestedGroup, setSuggestedGroup] = useState('')

  const [activeProductGroup, setActiveProductGroup] = useState<ProductWithFrequency[]>([])
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [markedAs, setMarkedAs] = useState<ProductWithFrequency[]>([])
  const [showBulkOfferDialog, setShowBulkOfferDialog] = useState(false)

  const overlayRefs = useRef<Record<string, OverlayPanel | null>>({})

  const { inquiries, addInquiry, removeInquiry, updateInquiry, syncInquiries, fetchInquiries } =
    useInquiryStore()

  useEffect(() => {
    fetchProducts()
    fetchInquiries(Number(id))
  }, [])

  useEffect(() => {
    fetchProducts()
  }, [searchStore])

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
    }, 300)

    return () => clearTimeout(timer)
  }, [search])

  useEffect(() => {
    fetchSalesVisit(Number(id), type === 'rule' ? 'rule' : undefined)
    fetchConcernCategories()
    fetchConcernStatuses()
  }, [])

  useEffect(() => {
    if (!showOfferDialog) {
      setSelectedProduct(null)
      setConcernSelections({})
    }
  }, [showOfferDialog])

  const handleEndVisit = async () => {
    // await syncOfferedItems()
    await endVisit().then(() => {
      fetchScheduleByDate(Number(salesVisit?.sales_person_id), currentDate)
      router.back()
    })
  }

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
    setMarkedAs([])
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

  const isVisitInitated = salesVisit.start_at !== null

  const handleTagAllForOffer = (items: ProductWithFrequency[]) => {
    const itemIds = items.map((item) => item.id)
    if (markedAs.some((item) => itemIds.includes(item.id))) {
      setMarkedAs((prev) => prev.filter((item) => !itemIds.includes(item.id)))
    } else {
      const toMark = items.filter((item) => !markedAs.some((i) => i.id === item.id))
      setMarkedAs((prev) => [...prev, ...toMark])
    }
  }

  const handleTagForOffer = (item: ProductWithFrequency) => {
    if (markedAs.some((i) => i.id === item.id)) {
      setMarkedAs((prev) => prev.filter((i) => i.id !== item.id))
    } else {
      setMarkedAs((prev) => [...prev, item])
    }
  }

  if (!salesVisit.id)
    return (
      <div
        className="absolute top-0 left-0 w-full h-full flex align-items-center justify-content-center bg-white-alpha-60 z-2"
        style={{ borderRadius: '6px' }}
      >
        <ProgressSpinner style={{ width: '50px', height: '50px' }} strokeWidth="8" />
      </div>
    )

  return (
    <>
      <div className="card p-3">
        <NavButton handleEndVisit={handleEndVisit} />
        <p className="m-0 text-2xl ml-2">{customer?.CardName}</p>
        <div className="flex-1 px-0 py-2">
          {customer?.subgroup && (
            <div className="p-2">
              <p className="m-0">
                <i className="pi pi-tags mr-2" style={{ color: 'var(--teal-500)' }}></i>
                {customer?.subgroup.IndDesc}
              </p>
            </div>
          )}
          <div className="p-2">
            <p className="m-0">
              {customer?.Address} <span className="font-bold">[{customer?.City}]</span>
            </p>
          </div>
          {customer?.CntctPrsn && (
            <div className="p-2">
              <p className="m-0">
                <i className="pi pi-user mr-2" />
                {customer?.CntctPrsn}
              </p>
            </div>
          )}
          {customer?.Phone1 && (
            <div className="p-2">
              {parsePhone(customer?.Phone1).map((phone, index) => (
                <p className="m-0" key={index}>
                  {phone.number && phone.isMobile && <i className="pi pi-mobile mr-2" />}
                  {phone.number && !phone.isMobile && <i className="pi pi-phone mr-2" />}
                  {phone.number}
                </p>
              ))}
            </div>
          )}
          {customer?.Cellular && (
            <div className="p-2">
              {parsePhone(customer?.Cellular).map((phone, index) => (
                <p className="m-0" key={index}>
                  {phone.number && phone.isMobile && <i className="pi pi-mobile mr-2" />}
                  {phone.number && !phone.isMobile && <i className="pi pi-phone mr-2" />}
                  {phone.number}
                </p>
              ))}
            </div>
          )}
        </div>
        <Divider />

        {!isVisitInitated ? (
          <div className="col-12 xl:col-6 md:col-6">
            <Button
              label="Start"
              icon="pi pi-play"
              severity="success"
              outlined
              size="small"
              onClick={() => startVisit(Number(salesVisit.id))}
            />
          </div>
        ) : (
          <div>
            <div className="col-12 xl:col-6 md:col-6">
              <h5>Product Offer</h5>
            </div>
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
                  {markedAs.length > 0 && (
                    <div className="flex align-items-center gap-2 my-3">
                      <Button
                        size="small"
                        outlined
                        severity="success"
                        icon="pi pi-cog pi-spin"
                        label="Process Tagged Items"
                        onClick={() => setShowBulkOfferDialog(true)}
                      />
                    </div>
                  )}
                  {isDistributor && distributorCategories.length > 0 ? (
                    <div className="flex flex-column gap-3">
                      {distributorCategories
                        .filter((cat) =>
                          filteredProducts.some((item) => item.ProductCategory === cat.value)
                        )
                        .map((cat) => {
                          const items = filteredProducts.filter(
                            (item) => item.ProductCategory === cat.value
                          )

                          return (
                            <Panel key={cat.value} header={cat.label} toggleable>
                              <div className="flex flex-column ">
                                <label
                                  htmlFor={`checkbox-closed-${cat.value}`}
                                  className="flex align-items-center gap-2 mb-2"
                                >
                                  <Checkbox
                                    inputId={`checkbox-closed-${cat.value}`}
                                    checked={items.every((item) =>
                                      markedAs.some((i) => i.id === item.id)
                                    )}
                                    onChange={() => handleTagAllForOffer(items)}
                                  />
                                  <span>Tag all</span>
                                </label>
                              </div>
                              <div className="grid">
                                {items.map((item) => {
                                  const category = item.ProductCategory
                                    ? item.ProductCategory.charAt(0) +
                                      item.ProductCategory.slice(1).toLocaleLowerCase()
                                    : ''

                                  const visitItems = visit_items?.find(
                                    (i) => i.product_id === item.id
                                  )
                                  const checked = markedAs.map((i) => i.id).includes(item.id)
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
                                        setSelectedProduct={setSelectedProduct}
                                        setShowOfferDialog={setShowOfferDialog}
                                        handleTagForOffer={handleTagForOffer}
                                        markedForOffer={checked}
                                      />
                                    </div>
                                  )
                                })}
                              </div>
                            </Panel>
                          )
                        })}
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
                        const checked = markedAs.map((i) => i.id).includes(item.id)
                        const visitItems = visit_items?.find((i) => i.product_id === item.id)
                        const visitItemConcerns = visitItems?.visit_item_concerns
                        return (
                          <div
                            key={`groceries-${item.ItemCode}`}
                            className="col-12 lg:col-6 xl:col-4"
                          >
                            <ProductOfferCard
                              item={item}
                              category={category}
                              visitItemConcern={visitItemConcerns?.[0]}
                              overlayRefs={overlayRefs}
                              setSelectedProduct={setSelectedProduct}
                              setShowOfferDialog={setShowOfferDialog}
                              handleTagForOffer={handleTagForOffer}
                              markedForOffer={checked}
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

            {(salesVisit.visit_items?.length ?? 0) > 0 && (
              <>
                <Divider />
                <h5 className="ml-2">Offered Items</h5>
                {(offeredDistributor?.length ?? 0) > 0 && (
                  <Card className="w-full h-full shadow-none px-0" title="DISTRIBUTOR">
                    {offeredDistributor?.map((distributorItem) => {
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
                    })}
                  </Card>
                )}
                {(offeredGroceries?.length ?? 0) > 0 && (
                  <Card className="w-full h-full shadow-none px-0" title="GROCERIES">
                    <div className="grid">
                      {offeredGroceries?.map((groceriesItem) => {
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
              </>
            )}

            <div className="col-12 xl:col-6 md:col-6 mt-5">
              <h5>Notes & Inquiries</h5>
            </div>
            <div className="col-12 xl:col-6 md:col-6">
              <label htmlFor={`note-${salesVisit.id}`} className="block mb-2">
                Visit Note
              </label>
              <InputTextarea
                id={`note-${salesVisit.id}`}
                rows={2}
                autoResize
                value={visitNote}
                onChange={(e) => setVisitNote(e.target.value)}
                placeholder="Visit notes"
                className="w-full"
              />
            </div>
            <div className="col-12 xl:col-6 md:col-6">
              {/* HEADER */}
              <div className="flex justify-content-between align-items-center mb-2">
                <span className="font-semibold">Product Inquiry</span>
              </div>

              {/* LIST */}
              {inquiries.map((inq, index) => (
                <div key={index} className="mb-3 p-3 border-1 surface-border border-round">
                  {/* HEADER ITEM */}
                  <div className="flex justify-content-between align-items-center mb-2">
                    <span className="text-sm font-semibold">Inquiry #{index + 1}</span>

                    <Button
                      icon="pi pi-trash"
                      severity="danger"
                      text
                      onClick={() => {
                        removeInquiry(index)
                        syncInquiries(Number(id))
                      }}
                    />
                  </div>

                  {/* PRODUCT SELECT (OPTIONAL) */}
                  <AutoComplete
                    value={inq.product_name || ''}
                    suggestions={products}
                    field="ItemName"
                    className="w-full my-2"
                    inputClassName="w-full"
                    placeholder="Search product..."
                    completeMethod={(e) => {
                      setSearchStore(e.query)
                    }}
                    onChange={(e) => {
                      updateInquiry(index, 'product_name', e.value)
                      updateInquiry(index, 'product_id', null)
                    }}
                    onSelect={(e) => {
                      updateInquiry(index, 'product_name', e.value.ItemName)
                      updateInquiry(index, 'product_id', e.value.id)
                    }}
                  />

                  {/* NOTES */}
                  <InputTextarea
                    placeholder="Notes"
                    className="w-full my-2"
                    value={inq.notes}
                    onChange={(e) => updateInquiry(index, 'notes', e.target.value)}
                  />
                </div>
              ))}
              <div className="flex align-items-center gap-2">
                <Button
                  severity="success"
                  outlined
                  rounded
                  icon="pi pi-plus"
                  size="small"
                  onClick={addInquiry}
                />
                <Button
                  disabled={
                    inquiries.length === 1 &&
                    !inquiries[0].product_id &&
                    !inquiries[0].product_name &&
                    !inquiries[0].notes
                  }
                  severity="success"
                  outlined
                  rounded
                  icon="pi pi-check"
                  size="small"
                  onClick={() => syncInquiries(Number(id))}
                />
              </div>
            </div>
            <Competitors />
          </div>
        )}
      </div>

      <Dialog
        modal
        blockScroll
        dismissableMask
        header="Product Offer"
        visible={showOfferDialog}
        onHide={() => setShowOfferDialog(false)}
        style={{ width: '90%', maxWidth: '400px' }}
        footer={
          <>
            <Button
              icon="pi pi-times"
              label="Cancel"
              severity="danger"
              outlined
              onClick={() => setShowOfferDialog(false)}
            />
            <Button
              icon="pi pi-save"
              label="Save"
              outlined
              onClick={() => {
                syncOfferedItems(concernSelections).then(() => {
                  fetchSalesVisit(Number(id), type === 'rule' ? 'rule' : undefined)
                  fetchConcernCategories()
                  fetchConcernStatuses()
                  setShowOfferDialog(false)
                })
              }}
            />
          </>
        }
      >
        <div className="flex flex-column gap-3 w-full my-2">
          <h5>{selectedProduct?.ItemName}</h5>
          <h6>Select Topic</h6>
          {concernCategories.map((category) => {
            const productId = selectedProduct ? Number(selectedProduct.id) : null
            const selection =
              productId !== null ? concernSelections[productId]?.[Number(category.id)] : undefined
            return (
              <div key={Number(category.id)} className="border-bottom-1 surface-border pb-3">
                <div className="flex align-items-center gap-2">
                  <Checkbox
                    inputId={`concern-${category.id}`}
                    checked={Boolean(selection)}
                    onChange={(e) => {
                      if (productId === null) return
                      setConcernSelections((prev) => {
                        if (!e.checked) {
                          const next = { ...prev }
                          const productSelections = { ...(next[productId] || {}) }
                          delete productSelections[Number(category.id)]
                          if (Object.keys(productSelections).length === 0) {
                            delete next[productId]
                          } else {
                            next[productId] = productSelections
                          }
                          return next
                        }
                        return {
                          ...prev,
                          [productId]: {
                            ...(prev[productId] || {}),
                            [Number(category.id)]: {
                              notes: prev[productId]?.[Number(category.id)]?.notes ?? '',
                              statusId: prev[productId]?.[Number(category.id)]?.statusId ?? null,
                            },
                          },
                        }
                      })
                    }}
                  />
                  <label htmlFor={`concern-${category.id}`} className="font-semibold">
                    {category.name}
                  </label>
                </div>

                {selection && (
                  <div className="flex flex-column gap-2 mt-2">
                    <div className="flex flex-column gap-2">
                      <label
                        htmlFor={`concern-notes-${category.id}`}
                        className="text-primary-400 font-semibold"
                      >
                        Notes
                      </label>
                      <InputTextarea
                        id={`concern-notes-${category.id}`}
                        rows={2}
                        autoResize
                        value={selection.notes}
                        onChange={(e) =>
                          productId === null
                            ? undefined
                            : setConcernSelections((prev) => ({
                                ...prev,
                                [productId]: {
                                  ...(prev[productId] || {}),
                                  [Number(category.id)]: {
                                    ...prev[productId]?.[Number(category.id)],
                                    notes: e.target.value,
                                  },
                                },
                              }))
                        }
                        placeholder="Notes"
                        className="w-full"
                      />
                    </div>

                    <div className="flex flex-column gap-2">
                      <label
                        htmlFor={`concern-status-${category.id}`}
                        className="text-primary-400 font-semibold"
                      >
                        Status
                      </label>
                      <Dropdown
                        inputId={`concern-status-${category.id}`}
                        value={selection.statusId}
                        options={concernStatuses.map((s) => ({ label: s.status, value: s.id }))}
                        onChange={(e) =>
                          productId === null
                            ? undefined
                            : setConcernSelections((prev) => ({
                                ...prev,
                                [productId]: {
                                  ...(prev[productId] || {}),
                                  [Number(category.id)]: {
                                    ...prev[productId]?.[Number(category.id)],
                                    statusId: e.value,
                                  },
                                },
                              }))
                        }
                        placeholder="Select Status"
                        className="w-full lg:w-300"
                        clearIcon="pi pi-times"
                        showClear
                      />
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </Dialog>

      <Dialog
        modal
        blockScroll
        dismissableMask
        header="Submit Items for Offer"
        visible={showBulkOfferDialog}
        onHide={() => setShowBulkOfferDialog(false)}
        style={{ width: '90%', maxWidth: '400px' }}
        footer={
          <>
            <Button
              icon="pi pi-times"
              label="Cancel"
              severity="danger"
              outlined
              onClick={() => setShowBulkOfferDialog(false)}
            />
            <Button
              icon="pi pi-save"
              label="Save"
              outlined
              onClick={() => {
                processItems(
                  concernSelctionForUpdate,
                  markedAs.map((item) => Number(item.id))
                ).then(() => {
                  fetchSalesVisit(Number(id), type === 'rule' ? 'rule' : undefined)
                  fetchConcernCategories()
                  fetchConcernStatuses()
                  setShowBulkOfferDialog(false)
                  setMarkedAs([])
                })
              }}
            />
          </>
        }
      >
        <div className="flex flex-column gap-3 w-full my-2">
          <h6>Select Topic</h6>
          {concernCategories.map((category) => {
            const selection = concernSelctionForUpdate?.[Number(category.id)]
            return (
              <div key={Number(category.id)} className="border-bottom-1 surface-border pb-3">
                <div className="flex align-items-center gap-2">
                  <Checkbox
                    inputId={`concern-${category.id}`}
                    checked={Boolean(selection)}
                    onChange={(e) => {
                      const id = Number(category.id)

                      setConcernSelctionForUpdate((prev) => {
                        const next = { ...prev }

                        if (!e.checked) {
                          delete next[id]
                          return next
                        }

                        return {
                          ...next,
                          [id]: {
                            notes: prev[id]?.notes ?? '',
                            statusId: prev[id]?.statusId ?? null,
                          },
                        }
                      })
                    }}
                  />
                  <label htmlFor={`concern-${category.id}`} className="font-semibold">
                    {category.name}
                  </label>
                </div>

                {selection && (
                  <div className="flex flex-column gap-2 mt-2">
                    <div className="flex flex-column gap-2">
                      <label
                        htmlFor={`concern-notes-${category.id}`}
                        className="text-primary-400 font-semibold"
                      >
                        Notes
                      </label>
                      <InputTextarea
                        id={`concern-notes-${category.id}`}
                        rows={2}
                        autoResize
                        value={selection?.notes || ''}
                        onChange={(e) => {
                          const id = Number(category.id)

                          setConcernSelctionForUpdate((prev) => ({
                            ...prev,
                            [id]: {
                              ...prev[id],
                              notes: e.target.value,
                            },
                          }))
                        }}
                        placeholder="Notes"
                        className="w-full"
                      />
                    </div>

                    <div className="flex flex-column gap-2">
                      <label
                        htmlFor={`concern-status-${category.id}`}
                        className="text-primary-400 font-semibold"
                      >
                        Status
                      </label>
                      <Dropdown
                        inputId={`concern-status-${category.id}`}
                        value={selection?.statusId ?? null}
                        options={concernStatuses.map((s) => ({
                          label: s.status,
                          value: s.id,
                        }))}
                        onChange={(e) => {
                          const id = Number(category.id)

                          setConcernSelctionForUpdate((prev) => ({
                            ...prev,
                            [id]: {
                              ...prev[id],
                              statusId: e.value,
                            },
                          }))
                        }}
                        placeholder="Select Status"
                        className="w-full lg:w-300"
                        showClear
                      />
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </Dialog>
    </>
  )
}

export default VisitsPage
