'use client'

import { EBadgeVariant, EFollowUpType, IVisitItem, IVisitItemConcern } from '@saleshub-tsm/types'
import { useParams } from 'next/navigation'
import { Button } from 'primereact/button'
import { Calendar } from 'primereact/calendar'
import { Card } from 'primereact/card'
import { Dialog } from 'primereact/dialog'
import { Dropdown } from 'primereact/dropdown'
import { InputTextarea } from 'primereact/inputtextarea'
import { useEffect, useState } from 'react'

import OfferedProduct from '@/app/(main)/components/product/OfferedProduct'
import VisitDetailHeader from '@/app/(main)/customers/components/VisitDetailHeader'
import { variantColors } from '@/lib/constants'
import { useConcernStore, useSalesVisit } from '@/stores'

const VisitIssuesPage = () => {
  const { id } = useParams()

  const salesVisitStore = useSalesVisit()

  const { salesVisit, fetchVisitDetails, followUpForm, setFollowUpForm, addFollowUp } =
    salesVisitStore
  const { fetchConcernStatuses, concernStatuses } = useConcernStore()
  const [visible, setIsVisible] = useState(false)
  const [selectedConcern, setSelectedConcern] = useState<IVisitItemConcern | null>(null)

  const customer = salesVisit?.customer

  useEffect(() => {
    fetchVisitDetails(Number(id))
    fetchConcernStatuses()
  }, [])

  const handleClickFollowUp = (concern: IVisitItemConcern) => {
    setSelectedConcern(concern)
    setIsVisible(true)
  }

  const onHide = () => {
    setSelectedConcern(null)
    setIsVisible(false)
  }

  const handleSubmit = async () => {
    await addFollowUp().then(() => {
      fetchVisitDetails(Number(id))
    })
    setIsVisible(false)
    setSelectedConcern(null)
  }

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

  const statusOptions = concernStatuses.map((status) => ({
    label: status.status,
    value: status.id,
    level: status.level,
  }))

  const typeOptions = Object.values(EFollowUpType).map((t) => ({
    label: t,
    value: t,
  }))

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
                          defaultOpen={false}
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
                    defaultOpen={false}
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
                  concernStatuses.find((s) => s.id === e.value)?.requires_action || false,
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
