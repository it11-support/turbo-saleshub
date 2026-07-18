'use client'

import {
  CompetitorProduct,
  EBadgeVariant,
  EFollowUpType,
  FollowUpUpdateData,
  IConcernStatus,
  IResObject,
  IVisit,
  IVisitItem,
  IVisitItemConcern,
  RawVisitCompetitor,
  VisitCompetitor,
} from '@saleshub-tsm/types'
import { useParams } from 'next/navigation'
import { Button } from 'primereact/button'
import { Calendar } from 'primereact/calendar'
import { Card } from 'primereact/card'
import { Dialog } from 'primereact/dialog'
import { Dropdown } from 'primereact/dropdown'
import { InputTextarea } from 'primereact/inputtextarea'
import { Tag } from 'primereact/tag'
import { useEffect, useState } from 'react'

import OfferedProduct from '@/app/(main)/components/product/OfferedProduct'
import VisitDetailHeader from '@/app/(main)/customers/components/VisitDetailHeader'
import { useFetch } from '@/hooks/useFetch'
import { useSocket } from '@/layout/context/SocketIoContext'
import { variantColors } from '@/lib/constants'
import { formatCurrency } from '@/lib/formatter'
import { useSalesVisit } from '@/stores'
interface IConcernStatusesResponse {
  concernStatuses: IConcernStatus[]
}
const VisitIssuesPage = () => {
  const { id } = useParams()
  const socket = useSocket()
  const salesVisitStore = useSalesVisit()

  const { followUpForm, setFollowUpForm, addFollowUp } = salesVisitStore
  const [visible, setIsVisible] = useState(false)
  const [selectedConcern, setSelectedConcern] = useState<IVisitItemConcern | null>(null)

  const [activeProductCode, setActiveProductCode] = useState<string | null>(null)

  const { data, mutate } = useFetch<IResObject<IVisit>>(`visit/${id}/details`, undefined, {
    enabled: !!id,
  })

  const visitCompetitors: RawVisitCompetitor[] = data?.data?.visit_competitors || []

  const competitors: VisitCompetitor[] = visitCompetitors.map((vc) => ({
    competitor_id: vc.competitor_id,
    name: vc.competitors?.name,
    products: vc.competitor_products,
  }))

  const salesVisit = data?.data as IVisit
  const customer = salesVisit?.customer

  useEffect(() => {
    if (typeof window === 'undefined') return

    const handleHash = () => {
      const hash = window.location.hash.replace('#', '')
      if (hash.toLowerCase().startsWith('productid-')) {
        const code = hash.replace(/productid-/i, '')
        setActiveProductCode(code)
      } else {
        setActiveProductCode(null)
      }
    }

    handleHash()
    window.addEventListener('hashchange', handleHash)

    return () => window.removeEventListener('hashchange', handleHash)
  }, [salesVisit?.visit_items])

  const { data: concernStatusesData } = useFetch<IResObject<IConcernStatusesResponse>>(
    'concern-categories/statuses'
  )

  const concernStatuses = concernStatusesData?.data?.concernStatuses ?? []

  const handleClickFollowUp = (concern: IVisitItemConcern) => {
    setSelectedConcern(concern)
    setIsVisible(true)
  }

  const onHide = () => {
    setSelectedConcern(null)
    setIsVisible(false)
  }

  const handleSubmit = async () => {
    await addFollowUp()
    await mutate()
    setIsVisible(false)
    setSelectedConcern(null)
  }

  useEffect(() => {
    if (!socket) return

    const handleUpdate = (data: FollowUpUpdateData<IVisit>) => {
      const updatedVisitId = data?.item?.id

      if (Number(updatedVisitId) === Number(id)) {
        mutate()
      }
    }

    socket.on('followUpUpdate', handleUpdate)

    return () => {
      socket.off('followUpUpdate', handleUpdate)
    }
  }, [socket, id])

  useEffect(() => {
    if (selectedConcern && visible) {
      setFollowUpForm({
        visit_item_concern_id: selectedConcern.id,
        status: selectedConcern.status.status,
        action_required: selectedConcern.status.requires_action || false,
        type: null,
        notes: '',
        next_follow_up_date: null,
      })
    }
  }, [selectedConcern, visible])

  const statusOptions = concernStatuses.map((status: IConcernStatus) => ({
    label: status.status,
    value: status.id,
    level: status.level,
  }))

  const typeOptions = Object.values(EFollowUpType).map((t) => ({
    label: t,
    value: t,
  }))

  const groupedProduct = salesVisit?.visit_items?.reduce(
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
      <div className="card">
        <h5 className="ml-2">Status</h5>
        {(offeredDistributor?.length ?? 0) > 0 && (
          <Card className="w-full h-full shadow-none px-0" title="DISTRIBUTOR">
            {offeredDistributor?.map((distributorItem) => {
              const category = distributorItem.category
              const visitItems = distributorItem.items
              return (
                <div key={`distributor-${category}`} className="pb-3">
                  <h5>{category}</h5>
                  <div className="grid">
                    {visitItems.map((visitItem) => {
                      return (
                        <OfferedProduct
                          defaultOpen={visitItem.product?.ItemCode === activeProductCode}
                          visitItem={visitItem}
                          key={visitItem.id.toString()}
                          handleFollowUp={handleClickFollowUp}
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
                    defaultOpen={groceriesItem.product?.ItemCode === activeProductCode}
                    visitItem={groceriesItem}
                    key={groceriesItem.id.toString()}
                    handleFollowUp={handleClickFollowUp}
                  />
                )
              })}
            </div>
          </Card>
        )}
      </div>
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
                                    {formatCurrency(Number(product.price), true, true)} /{' '}
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

      <Dialog
        header="Follow Up"
        visible={visible}
        style={{ width: '400px' }}
        modal
        onHide={onHide}
        dismissableMask
      >
        <div className="flex flex-column gap-3">
          {/* Info Concern */}
          <div className="text-sm">
            <b>{selectedConcern?.category?.name}</b>
            <p>{selectedConcern?.notes}</p>
          </div>

          {/* Status */}
          <Dropdown
            value={followUpForm.status}
            options={statusOptions}
            onChange={(e) =>
              setFollowUpForm({
                ...followUpForm,
                status: e.value,
                action_required:
                  concernStatuses.find((s: IConcernStatus) => s.id === e.value)?.requires_action ||
                  false,
              })
            }
            placeholder="Select Status"
            className="w-full"
            itemTemplate={(option) => {
              return (
                <div className="flex align-items-center gap-2">
                  <span
                    style={{
                      width: 12,
                      height: 12,
                      borderRadius: '50%',
                      backgroundColor: variantColors[option.level as EBadgeVariant],
                      display: 'inline-block',
                    }}
                  />
                  <span>{option.label}</span>
                </div>
              )
            }}
            valueTemplate={(option) => {
              if (!option) return <span>Select Status</span>
              return (
                <div className="flex align-items-center gap-2">
                  <span
                    style={{
                      width: 12,
                      height: 12,
                      borderRadius: '50%',
                      backgroundColor: variantColors[option.level as EBadgeVariant],
                      display: 'inline-block',
                    }}
                  />
                  <span>{option.label}</span>
                </div>
              )
            }}
          />

          {/* Type */}
          <Dropdown
            value={followUpForm.type}
            options={typeOptions}
            onChange={(e) => setFollowUpForm({ ...followUpForm, type: e.value })}
            placeholder="Follow Up Type"
            className="w-full"
          />

          {/* Notes */}
          <InputTextarea
            value={followUpForm.notes}
            onChange={(e) => setFollowUpForm({ ...followUpForm, notes: e.target.value })}
            rows={3}
            placeholder="Write follow up notes..."
          />

          {/* Next Date */}
          {followUpForm.action_required && (
            <Calendar
              value={followUpForm.next_follow_up_date}
              minDate={new Date()}
              onChange={(e) =>
                setFollowUpForm({ ...followUpForm, next_follow_up_date: e.value as Date })
              }
              placeholder="Next follow up date"
              className="w-full"
              showIcon
            />
          )}

          {/* Action */}
          <Button
            label="Save"
            severity="success"
            icon="pi pi-check"
            onClick={handleSubmit}
            disabled={!followUpForm.status || !followUpForm.type}
          />
        </div>
      </Dialog>
    </>
  )
}

export default VisitIssuesPage
