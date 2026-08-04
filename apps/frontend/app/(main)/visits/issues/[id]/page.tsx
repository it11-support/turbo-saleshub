'use client'

import VisitCompetitiors from '../../components/VisitCompetitors'
import { groupVisitItems } from '../../functions/groupVisitItems'
import {
  EBadgeVariant,
  EFollowUpType,
  FollowUpUpdateData,
  IConcernStatus,
  IResObject,
  IVisit,
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
import { useEffect, useState } from 'react'

import OfferedProduct from '@/app/(main)/components/product/OfferedProduct'
import VisitDetailHeader from '@/app/(main)/customers/components/VisitDetailHeader'
import { useFetch } from '@/hooks/useFetch'
import { useSocket } from '@/layout/context/SocketIoContext'
import { variantColors } from '@/lib/constants'
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

  const { distributor: offeredDistributor, groceries: offeredGroceries } = groupVisitItems(
    salesVisit?.visit_items ?? []
  )

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

      {competitors.length > 0 && <VisitCompetitiors competitors={competitors} />}

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
