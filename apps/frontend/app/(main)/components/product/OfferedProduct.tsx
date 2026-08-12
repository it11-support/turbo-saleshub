'use client'

import ProductTag from './ProductTag'
import VisitTimeLine from '../../visits/components/VisitTimeLine'
import {
  EFollowUpType,
  FollowUpVisitResponse,
  IConcernStatus,
  IResObject,
  IVisitItem,
  IVisitItemConcern,
} from '@saleshub-tsm/types'
import { useParams } from 'next/navigation'
import { Accordion, AccordionTab } from 'primereact/accordion'
import { Button } from 'primereact/button'
import { Calendar } from 'primereact/calendar'
import { Checkbox } from 'primereact/checkbox'
import { Dialog } from 'primereact/dialog'
import { Divider } from 'primereact/divider'
import { Dropdown } from 'primereact/dropdown'
import { InputTextarea } from 'primereact/inputtextarea'
import { memo, useEffect, useMemo, useState } from 'react'

import { useFetch } from '@/hooks/useFetch'
import { useAuth } from '@/layout/context/AuthContext'
import { $api, createUrl } from '@/lib/api'
import { formatDate, normalizeDateToUTC } from '@/lib/dateUtils'
import { jsonBody } from '@/lib/storeHelper'

interface IConcernStatusesResponse {
  concernStatuses: IConcernStatus[]
}

type Props = {
  visitItem: IVisitItem
  handleFollowUp?: (concern: IVisitItemConcern) => void
  defaultOpen?: boolean
  selectedForFollowUp?: boolean
  onToggleFollowUpSelection?: (itemId: number) => void
}
const OfferedProduct = memo(function OfferedProduct(props: Props) {
  const [followUpForm, setFollowUpForm] = useState({
    visit_item_concern_id: 0,
    status: '',
    action_required: false,
    type: EFollowUpType.Feedback,
    notes: '',
    next_follow_up_date: null as Date | null,
  })
  const [visible, setIsVisible] = useState(false)
  const [selectedConcern, setSelectedConcern] = useState<IVisitItemConcern | null>(null)
  const { id } = useParams()

  const { visitItem, handleFollowUp, defaultOpen, selectedForFollowUp, onToggleFollowUpSelection } =
    props
  const product = visitItem.product
  const { isAdmin } = useAuth()

  const [activeIndex, setActiveIndex] = useState<number | null>(null)

  const { mutate } = useFetch(`visit/${id}/details`, undefined, {
    enabled: !!id,
  })

  const { data: concernStatusesData } = useFetch<IResObject<IConcernStatusesResponse>>(
    `concern-categories/statuses`
  )
  const concernStatuses = concernStatusesData?.data?.concernStatuses ?? []
  const onHide = () => {
    setSelectedConcern(null)
    setIsVisible(false)
  }

  useEffect(() => {
    setActiveIndex(defaultOpen ? 0 : null)
  }, [defaultOpen])

  useEffect(() => {
    if (!defaultOpen) return

    const el = document.getElementById(`productId-${product?.ItemCode}`)
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [defaultOpen])

  const handleFeedback = (concern: IVisitItemConcern) => {
    setSelectedConcern(concern)
    setFollowUpForm({
      visit_item_concern_id: Number(concern.id),
      status: concern.status.status,
      action_required: concern.status.requires_action || false,
      type: EFollowUpType.Feedback,
      notes: '',
      next_follow_up_date: null,
    })
    setIsVisible(true)
  }

  const handleSubmit = async () => {
    await $api<FollowUpVisitResponse>(createUrl('visit/follow-up'), jsonBody(followUpForm))
    await mutate()
    setIsVisible(false)
    setSelectedConcern(null)
  }

  const statusOptions = concernStatuses.map((status: IConcernStatus) => ({
    label: status.status,
    value: status.id,
    level: status.level,
  }))

  const typeOptions = Object.values(EFollowUpType).map((t) => ({
    label: t,
    value: t,
  }))

  const hasStatus = useMemo(() => {
    return visitItem.visit_item_concerns?.some((c) => c.status) ?? false
  }, [visitItem])

  return (
    <>
      <div className="col-12 p-1" key={product?.ItemCode} id={`productId-${product?.ItemCode}`}>
        <Accordion
          activeIndex={activeIndex}
          onTabChange={(e) => {
            const isOpen = e.index === 0

            setActiveIndex(isOpen ? 0 : null)

            if (isOpen) {
              window.location.hash = `productId-${product?.ItemCode}`
            }
          }}
        >
          <AccordionTab
            headerClassName="w-full"
            header={
              <div
                className="flex align-items-start justify-content-between w-full"
                id={`acc-header-${product?.ItemCode}`}
              >
                <div
                  className="flex align-items-center gap-2"
                  style={{ flex: '1 1 auto', minWidth: 0 }}
                >
                  {onToggleFollowUpSelection && (
                    <Checkbox
                      checked={selectedForFollowUp || false}
                      onClick={(e) => e.stopPropagation()}
                      onChange={() => onToggleFollowUpSelection(Number(visitItem.id))}
                    />
                  )}
                  <div className="flex flex-column" style={{ flex: '1 1 auto', minWidth: 0 }}>
                    <span
                      className="font-semibold text-900 pr-2"
                      style={{ wordBreak: 'break-word' }}
                    >
                      {product?.ItemName}
                    </span>
                    <small className="text-500 pt-1">
                      {formatDate(visitItem?.created_at, { withTime: true })}
                    </small>
                  </div>
                </div>

                <div className="flex align-items-center gap-2 ml-auto">
                  {activeIndex !== 0 && hasStatus && visitItem.visit_item_concerns?.[0]?.status && (
                    <div className="flex-none align-self-start pt-0">
                      <ProductTag status={visitItem.visit_item_concerns[0].status} />
                    </div>
                  )}
                </div>
              </div>
            }
          >
            {/* EMPTY */}
            {!visitItem.visit_item_concerns?.length && (
              <div className="text-sm text-500 text-center py-3">No issues found</div>
            )}

            {/* CONCERNS */}
            <div className="flex flex-column gap-4 mt-3">
              {(visitItem.visit_item_concerns ?? []).map((concern, index) => {
                const followUps = concern.follow_ups ?? []

                return (
                  <div key={Number(concern.id)}>
                    {/* HEADER */}
                    <div className="flex justify-content-between align-items-center mb-1">
                      <span className="font-medium text-900">{concern.category?.name}</span>
                      <ProductTag status={concern.status} />
                    </div>

                    {/* NOTES */}
                    {concern.notes && <div className="text-sm text-600 mb-2">{concern.notes}</div>}

                    {/* TIMELINE */}
                    {followUps.length > 0 && (
                      <div className="mt-2 pl-2 surface-border">
                        <VisitTimeLine
                          events={followUps.map((f) => ({
                            concern_status: f.concern_status,
                            notes: f.notes,
                            type: f.type,
                            date: formatDate(f.created_at, {
                              withTime: true,
                            }),
                            icon: 'pi pi-check',
                            color: 'var(--primary-color)',
                            next_follow_up_date: formatDate(f.next_follow_up_date, {
                              withTime: false,
                            }),
                          }))}
                        />
                      </div>
                    )}

                    {/* ACTION */}
                    <div className="flex gap-2 mt-2">
                      {concern.status?.requires_action && handleFollowUp && (
                        <Button
                          size="small"
                          label="Follow Up"
                          severity="success"
                          icon="pi pi-send"
                          onClick={() => handleFollowUp(concern)}
                          className="p-button-sm border-round-md p-button-outlined"
                        />
                      )}

                      {isAdmin && (
                        <Button
                          onClick={() => handleFeedback(concern)}
                          size="small"
                          severity="info"
                          label="Feedback"
                          icon="pi pi-pencil"
                          className="p-button-sm border-round-md p-button-outlined"
                        />
                      )}
                    </div>

                    {/* DIVIDER */}
                    {index < (visitItem.visit_item_concerns?.length ?? 0) - 1 && (
                      <Divider className="my-3" />
                    )}
                  </div>
                )
              })}
            </div>
          </AccordionTab>
        </Accordion>
      </div>

      {/* DIALOG TETAP */}
      <Dialog
        header="Update Status"
        visible={visible}
        style={{ width: '420px' }}
        modal
        onHide={onHide}
        dismissableMask
        className="border-round-xl"
      >
        <div className="flex flex-column gap-4">
          <div className="text-sm">
            <b>{selectedConcern?.category?.name}</b>
            <p>{selectedConcern?.notes}</p>
          </div>

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
          />

          <Dropdown
            disabled
            value={followUpForm.type}
            options={typeOptions}
            optionLabel="label"
            optionValue="value"
            className="w-full"
          />

          <InputTextarea
            value={followUpForm.notes}
            onChange={(e) => setFollowUpForm({ ...followUpForm, notes: e.target.value })}
            rows={3}
            placeholder="Write follow up notes..."
          />

          {followUpForm.action_required && (
            <Calendar
              value={followUpForm.next_follow_up_date}
              minDate={new Date()}
              onChange={(e) => {
                const cleanDate = normalizeDateToUTC(e.value as Date)
                setFollowUpForm({
                  ...followUpForm,
                  next_follow_up_date: cleanDate,
                })
              }}
              className="w-full"
              showIcon
            />
          )}

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
})

export default OfferedProduct
