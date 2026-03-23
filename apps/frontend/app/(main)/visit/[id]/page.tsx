'use client'

import CustomChip from '../../components/custom/chip'
import { IVisitItemConcern, ProductWithFrequency } from '@saleshub-tsm/types'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { Badge } from 'primereact/badge'
import { Button } from 'primereact/button'
import { Card } from 'primereact/card'
import { Checkbox, CheckboxChangeEvent } from 'primereact/checkbox'
import { Dialog } from 'primereact/dialog'
import { Divider } from 'primereact/divider'
import { Dropdown } from 'primereact/dropdown'
import { InputTextarea } from 'primereact/inputtextarea'
import { useEffect, useState } from 'react'

import { formatCurrency } from '@/lib/formatter'
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

  const handleProductOffer = (item: ProductWithFrequency) => {
    setSelectedProduct(item)
    setShowOfferDialog(true)
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

  const filteredProducts =
    selectedCategories.length > 0
      ? activeProductGroup.filter((item) => selectedCategories.includes(item.ProductCategory ?? ''))
      : activeProductGroup

  const ProductCard = ({
    item,
    category,
    visitItemConcerns,
  }: {
    item: ProductWithFrequency
    category?: string
    visitItemConcerns?: IVisitItemConcern[]
  }) => {
    return (
      <Card className="mb-3 min-h-[180px]" pt={{ root: { style: { minHeight: '100%' } } }}>
        <div className="flex items-start gap-4 h-full">
          <div className="flex flex-col items-start justify-start">
            <div className="font-bold text-base leading-tight line-clamp-2 text-color-secondary">
              {item.ItemName}
              <div className="mt-3 flex flex-wrap gap-2">
                {item.product_developments?.length ? (
                  <CustomChip
                    label="Product Focus"
                    removable={false}
                    color="var(--purple-300)"
                    icon="pi pi-star"
                  />
                ) : null}
                <CustomChip label={item.ItmsGrpNam} removable={false} />
                {item.Distributor === 'Y' && (
                  <CustomChip label="Distributor" removable={false} color="var(--green-500)" />
                )}
                {item.ProductCategory && (
                  <CustomChip label={category} removable={false} color="var(--orange-500)" />
                )}
              </div>
              <div className="mt-3 text-sm font-semibold text-primary">
                {formatCurrency(Number(item.MinPrice), true, true)} -{' '}
                {formatCurrency(Number(item.MaxPrice), true, true)}
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center mt-3 border-top-1 surface-border pt-3">
          <Button
            size="small"
            outlined
            label="Offer"
            icon="pi pi-arrow-circle-up"
            severity="success"
            onClick={() => handleProductOffer(item)}
          />
        </div>

        {visitItemConcerns?.map((c) => (
          <div
            key={`category-${item.ItemCode}-${c.id}`}
            className="mt-2 p-2 surface-50 border-round"
          >
            <div className="flex justify-content-between align-items-center">
              <div className="font-semibold text-sm">{c.category.name}</div>
              <Badge value={c.status.status} severity="info" />
            </div>
            <div className="text-xs text-secondary mt-1">{c.notes}</div>
          </div>
        ))}
      </Card>
    )
  }

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
        <p className="m-0 text-2xl">{customer?.CardName}</p>
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

        <div className="grid">
          <div className="col-12 xl:col-6 md:col-6">
            <div className="p-2">
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
          </div>
        </div>
        <div className="col-12 xl:col-6 md:col-6">
          <div className="p-2">
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

        {activeProductGroup.length > 0 && (
          <>
            <Card className="mx-3 mt-3">
              <h5>SUGGESTED ITEMS {suggestedGroup?.toUpperCase()}</h5>
              {isDistributor && distributorCategories.length > 0 ? (
                <div className="flex flex-column gap-3">
                  <p className="m-0">Pick Categories</p>
                  {distributorCategories.map((cat) => (
                    <div key={cat.value}>
                      <div className="flex align-items-center">
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
                                    <ProductCard
                                      item={item}
                                      category={category}
                                      visitItemConcerns={visitItemConcerns}
                                    />
                                  </div>
                                )
                              })
                          : null}
                      </div>
                    </div>
                  ))}
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
                        <ProductCard
                          item={item}
                          category={category}
                          visitItemConcerns={visitItemConcerns}
                        />
                      </div>
                    )
                  })}
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
