'use client'

import CustomChip from '../../components/custom/chip'
import { ProductWithFrequency } from '@saleshub-tsm/types'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { Accordion, AccordionTab } from 'primereact/accordion'
import { Badge } from 'primereact/badge'
import { Button } from 'primereact/button'
import { Card } from 'primereact/card'
import { Checkbox } from 'primereact/checkbox'
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
  const [activeTab, setActiveTab] = useState(0)

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

        {suggestedGroups.length > 0 && (
          <Accordion activeIndex={activeTab} onTabChange={(e) => setActiveTab(e.index as number)}>
            {suggestedGroups.map((group) => {
              if (group.items.length === 0) return null
              return (
                <AccordionTab
                  header={
                    <div className="flex items-center font-bold">
                      {`SUGGESTED ITEMS ${group.key.toLocaleUpperCase()}`}
                    </div>
                  }
                  key={group.key}
                >
                  <div className="grid">
                    {group.items.map((item) => {
                      const category = item.ProductCategory
                        ? item.ProductCategory?.charAt(0) +
                          item.ProductCategory?.slice(1).toLocaleLowerCase()
                        : ''
                      const visitItems = visit_items?.find((i) => i.product_id === item.id)
                      const visitItemConcerns = visitItems?.visit_item_concerns
                      return (
                        <div className="col-12 lg:col-6 xl:col-4" key={item.ItemCode}>
                          <Card
                            className="mb-3 min-h-[180px]"
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
                              {/* <div className="w-[80px] h-[80px] flex-shrink-0 flex items-center justify-center">
                            <ProductImage code={item.ItemCode} alt={item.ItemName || ''} />
                          </div> */}

                              {/* TEXT */}
                              <div className="flex flex-col items-start justify-start">
                                <div className="font-bold text-base leading-tight line-clamp-2 text-color-secondary">
                                  {item.ItemName}
                                  <div className="mt-1 text-sm font-semibold mt-3 flex flex-wrap gap-2">
                                    {item.product_developments?.length ? (
                                      <CustomChip
                                        label="Product Focus"
                                        removable={false}
                                        color="var(--purple-500)"
                                        icon="pi pi-star"
                                      />
                                    ) : null}
                                    <CustomChip label={item.ItmsGrpNam} removable={false} />
                                    {item.Distributor === 'Y' && (
                                      <CustomChip
                                        label="Distributor"
                                        removable={false}
                                        color="var(--green-500)"
                                      />
                                    )}
                                    {item.ProductCategory && (
                                      <CustomChip
                                        label={category}
                                        removable={false}
                                        color="var(--orange-500)"
                                      />
                                    )}
                                  </div>
                                  <div className="mt-1 text-sm font-semibold mt-3">
                                    {formatCurrency(Number(item.MinPrice), true, true)} -{' '}
                                    {formatCurrency(Number(item.MaxPrice), true, true)}
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-start">
                              <div className="grid py-2">
                                <div className="col-12 md:col-4 my-2">
                                  <Button
                                    size="small"
                                    outlined
                                    label="Offer"
                                    icon="pi pi-arrow-circle-up"
                                    severity="success"
                                    onClick={() => handleProductOffer(item)}
                                  />
                                </div>
                              </div>
                            </div>
                            {visitItemConcerns?.map((c) => (
                              <div key={`category-${item.ItemCode}-${c.id}`}>
                                <div className="flex justify-content-between align-items-center">
                                  <div className="font-semibold">{c.category.name}</div>
                                  <Badge value={c.status.status} />
                                </div>
                                <div className="col-12">
                                  <div className="font-muted text-sm line-clamp-2 text-secondary">
                                    {c.notes}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </Card>
                        </div>
                      )
                    })}
                  </div>
                </AccordionTab>
              )
            })}
          </Accordion>
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
