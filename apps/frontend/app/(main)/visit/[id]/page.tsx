'use client'

import ProductOfferCard from '../../components/product/ProductOfferCard'
import { ProductWithFrequency } from '@saleshub-tsm/types'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { Button } from 'primereact/button'
import { Card } from 'primereact/card'
import { Checkbox, CheckboxChangeEvent } from 'primereact/checkbox'
import { Dialog } from 'primereact/dialog'
import { Divider } from 'primereact/divider'
import { Dropdown } from 'primereact/dropdown'
import { InputText } from 'primereact/inputtext'
import { InputTextarea } from 'primereact/inputtextarea'
import { OverlayPanel } from 'primereact/overlaypanel'
import { useEffect, useRef, useState } from 'react'

import { parsePhone } from '@/lib/phoneParser'
import { useConcernStore, useSalesVisit, useScheduleStore } from '@/stores'

const VisitsPage = () => {
  const salesVisitStore = useSalesVisit()
  const { fetchSalesVisit, salesVisit, syncOfferedItems, visitNote, setVisitNote, endVisit } =
    salesVisitStore
  const { fetchScheduleByDate, currentDate } = useScheduleStore()
  const { fetchConcernStatuses, fetchConcernCategories, concernCategories, concernStatuses } =
    useConcernStore()
  const { id } = useParams()
  const searchParams = useSearchParams()

  const type = searchParams.get('type')
  const router = useRouter()

  const [showOfferDialog, setShowOfferDialog] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<ProductWithFrequency | null>(null)
  const [concernSelections, setConcernSelections] = useState<
    Record<number, Record<number, { notes: string; statusId: number | null }>>
  >({})

  const [suggestedGroup, setSuggestedGroup] = useState('')

  const [activeProductGroup, setActiveProductGroup] = useState<ProductWithFrequency[]>([])
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')

  const overlayRefs = useRef<Record<string, OverlayPanel | null>>({})

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
      fetchScheduleByDate(Number(salesVisit.sales_person_id), currentDate)
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

  const filteredProducts = activeProductGroup.filter((item) => {
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

  return (
    <>
      <div className="card p-3">
        <div className="col-12 flex justify-content-start align-items-center gap-2">
          <Button
            label="Back"
            icon="pi pi-chevron-left"
            severity="danger"
            size="small"
            outlined
            onClick={() => history.back()}
          />
          <Button
            label="End Visit"
            icon="pi pi-check-circle"
            severity="success"
            size="small"
            outlined
            onClick={handleEndVisit}
          />
        </div>
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
            <Card
              className="mx-0 mt-3"
              pt={{
                body: { style: { padding: '0.5rem' } },
                content: { style: { padding: '0.5rem' } },
              }}
            >
              <h6>SUGGESTED ITEMS {suggestedGroup?.toUpperCase()}</h6>
              {isDistributor && distributorCategories.length > 0 ? (
                <div className="flex flex-column gap-3">
                  <p className="m-0">Pick Categories</p>
                  {distributorCategories.map((cat) => (
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
                                      setSelectedProduct={setSelectedProduct}
                                      setShowOfferDialog={setShowOfferDialog}
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
                          setSelectedProduct={setSelectedProduct}
                          setShowOfferDialog={setShowOfferDialog}
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
            </Card>
          </>
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
    </>
  )
}

export default VisitsPage
