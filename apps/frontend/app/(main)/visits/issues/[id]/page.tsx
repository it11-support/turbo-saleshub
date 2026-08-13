'use client'

import VisitCompetitiors from '../../components/VisitCompetitors'
import { groupVisitItems } from '../../functions/groupVisitItems'
import {
  EBadgeVariant,
  EFollowUpType,
  FollowUpUpdateData,
  FollowUpVisitResponse,
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
import { Checkbox } from 'primereact/checkbox'
import { Dialog } from 'primereact/dialog'
import { Dropdown } from 'primereact/dropdown'
import { InputTextarea } from 'primereact/inputtextarea'
import { memo, useCallback, useEffect, useState } from 'react'

import OfferedProduct from '@/app/(main)/components/product/OfferedProduct'
import VisitDetailHeader from '@/app/(main)/customers/components/VisitDetailHeader'
import { useFetch } from '@/hooks/useFetch'
import { useAuth } from '@/layout/context/AuthContext'
import { useSocket } from '@/layout/context/SocketIoContext'
import { $api, createUrl } from '@/lib/api'
import { variantColors } from '@/lib/constants'
import { normalizeDateToUTC } from '@/lib/dateUtils'
import { jsonBody } from '@/lib/storeHelper'
interface IConcernStatusesResponse {
  concernStatuses: IConcernStatus[]
}
const VisitIssuesPage = () => {
  const { id } = useParams()
  const socket = useSocket()
  const { isAdmin } = useAuth()
  const [visible, setIsVisible] = useState(false)
  const [selectedConcern, setSelectedConcern] = useState<IVisitItemConcern | null>(null)

  const [activeProductCode, setActiveProductCode] = useState<string | null>(null)

  const [selectedForFollowUp, setSelectedForFollowUp] = useState<Set<number>>(new Set())
  const [showBulkFollowUpDialog, setShowBulkFollowUpDialog] = useState(false)
  const [bulkFollowUpCategory, setBulkFollowUpCategory] = useState<string>('')

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

  const toggleFollowUpSelection = useCallback((itemId: number) => {
    setSelectedForFollowUp((prev) => {
      const next = new Set(prev)
      if (next.has(itemId)) {
        next.delete(itemId)
      } else {
        next.add(itemId)
      }
      return next
    })
  }, [])

  const toggleSelectAllInCategory = useCallback(
    (_category: string, itemIds: number[], checked: boolean) => {
      setSelectedForFollowUp(() => {
        const next = new Set<number>()
        if (checked) {
          itemIds.forEach((id) => next.add(id))
        }
        return next
      })
    },
    []
  )

  const clearFollowUpSelection = useCallback(() => {
    setSelectedForFollowUp(new Set())
  }, [])

  const handleBulkFollowUp = useCallback((category: string) => {
    setBulkFollowUpCategory(category)
    setShowBulkFollowUpDialog(true)
  }, [])

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

  const statusOptions = concernStatuses.map((status: IConcernStatus) => ({
    label: status.status,
    value: status.id,
    level: status.level,
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
              const allSelected = visitItems.every((vi) => selectedForFollowUp.has(Number(vi.id)))
              const selectedCount = visitItems.filter((vi) =>
                selectedForFollowUp.has(Number(vi.id))
              ).length
              return (
                <div key={`distributor-${category}`} className="pb-3">
                  <h5>{category}</h5>
                  {isAdmin && (
                    <div className="flex align-items-center justify-content-between mb-4">
                      <div className="flex align-items-center gap-2">
                        <Checkbox
                          checked={allSelected}
                          onChange={(e) =>
                            toggleSelectAllInCategory(
                              category,
                              visitItems.map((vi) => Number(vi.id)),
                              e.checked ?? false
                            )
                          }
                        />

                        <span className="text-sm text-secondary">
                          {selectedCount > 0 ? `${selectedCount} selected` : 'Select all'}
                        </span>
                      </div>

                      {selectedCount > 0 && (
                        <Button
                          size="small"
                          outlined
                          severity="info"
                          icon="pi pi-pencil"
                          label="Feedback Selected"
                          onClick={() => handleBulkFollowUp(category)}
                        />
                      )}
                    </div>
                  )}
                  <div className="grid">
                    {visitItems.map((visitItem) => {
                      return (
                        <OfferedProduct
                          defaultOpen={visitItem.product?.ItemCode === activeProductCode}
                          visitItem={visitItem}
                          key={visitItem.id.toString()}
                          handleFollowUp={handleClickFollowUp}
                          selectedForFollowUp={selectedForFollowUp.has(Number(visitItem.id))}
                          onToggleFollowUpSelection={toggleFollowUpSelection}
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
            {isAdmin && (
              <div className="flex align-items-center justify-content-between mb-4">
                <div className="flex align-items-center gap-2">
                  <Checkbox
                    checked={offeredGroceries.every((gi) => selectedForFollowUp.has(Number(gi.id)))}
                    onChange={(e) =>
                      toggleSelectAllInCategory(
                        'groceries',
                        offeredGroceries.map((gi) => Number(gi.id)),
                        e.checked ?? false
                      )
                    }
                  />

                  <span className="text-sm text-secondary">
                    {offeredGroceries.filter((gi) => selectedForFollowUp.has(Number(gi.id)))
                      .length > 0
                      ? `${offeredGroceries.filter((gi) => selectedForFollowUp.has(Number(gi.id))).length} selected`
                      : 'Select all'}
                  </span>
                </div>

                {offeredGroceries.some((gi) => selectedForFollowUp.has(Number(gi.id))) && (
                  <Button
                    size="small"
                    outlined
                    severity="info"
                    icon="pi pi-pencil"
                    label="Feedback Selected"
                    onClick={() => handleBulkFollowUp('GROCERIES')}
                  />
                )}
              </div>
            )}
            <div className="grid">
              {offeredGroceries.map((groceriesItem) => {
                return (
                  <OfferedProduct
                    defaultOpen={groceriesItem.product?.ItemCode === activeProductCode}
                    visitItem={groceriesItem}
                    key={groceriesItem.id.toString()}
                    handleFollowUp={handleClickFollowUp}
                    selectedForFollowUp={selectedForFollowUp.has(Number(groceriesItem.id))}
                    onToggleFollowUpSelection={toggleFollowUpSelection}
                  />
                )
              })}
            </div>
          </Card>
        )}
      </div>

      {competitors.length > 0 && <VisitCompetitiors competitors={competitors} />}

      <FollowUpDialog
        visible={visible}
        onHide={onHide}
        concern={selectedConcern}
        statusOptions={statusOptions}
        concernStatuses={concernStatuses}
        onSubmit={async (form) => {
          await $api<FollowUpVisitResponse>(createUrl('visit/follow-up'), jsonBody(form))
          await mutate()
        }}
      />

      <BulkFollowUpDialog
        visible={showBulkFollowUpDialog}
        onHide={() => {
          setShowBulkFollowUpDialog(false)
          clearFollowUpSelection()
        }}
        category={bulkFollowUpCategory}
        selectedCount={selectedForFollowUp.size}
        statusOptions={statusOptions}
        concernStatuses={concernStatuses}
        onSubmit={async (form) => {
          const selectedIds = Array.from(selectedForFollowUp)
          const currentVisitItems = salesVisit?.visit_items ?? []
          const promises = selectedIds.map((itemId) => {
            const visitItem = currentVisitItems.find((vi) => Number(vi.id) === itemId)
            if (!visitItem?.visit_item_concerns?.length) return Promise.resolve()

            const concern = visitItem.visit_item_concerns[0]
            return $api<FollowUpVisitResponse>(
              createUrl('visit/follow-up'),
              jsonBody({
                visit_item_concern_id: concern.id,
                status: form.status,
                type: EFollowUpType.Feedback,
                notes: form.notes,
                action_required: form.action_required,
                next_follow_up_date: form.next_follow_up_date,
              })
            )
          })

          await Promise.all(promises)
          clearFollowUpSelection()
          setShowBulkFollowUpDialog(false)
          await mutate()
        }}
      />
    </>
  )
}

interface FollowUpDialogProps {
  visible: boolean
  onHide: () => void
  concern: IVisitItemConcern | null
  statusOptions: {
    label: string
    value: number | bigint | null | undefined
    level: EBadgeVariant | null | undefined
  }[]
  concernStatuses: IConcernStatus[]
  onSubmit: (form: any) => Promise<void>
}

const FollowUpDialog = memo(function FollowUpDialog({
  visible,
  onHide,
  concern,
  statusOptions,
  concernStatuses,
  onSubmit,
}: FollowUpDialogProps) {
  const [form, setForm] = useState({
    visit_item_concern_id: 0,
    status: '',
    action_required: false,
    type: EFollowUpType.Feedback,
    notes: '',
    next_follow_up_date: null as Date | null,
  })

  useEffect(() => {
    if (visible && concern) {
      setForm({
        visit_item_concern_id: Number(concern.id),
        status: concern.status.status,
        action_required: concern.status.requires_action || false,
        type: EFollowUpType.Feedback,
        notes: '',
        next_follow_up_date: null,
      })
    }
  }, [visible, concern])

  const handleSubmit = async () => {
    await onSubmit(form)
    onHide()
  }

  return (
    <Dialog
      header="Follow Up"
      visible={visible}
      style={{ width: '400px' }}
      modal
      onHide={onHide}
      dismissableMask
    >
      <div className="flex flex-column gap-3">
        <div className="text-sm">
          <b>{concern?.category?.name}</b>
          <p>{concern?.notes}</p>
        </div>

        <Dropdown
          value={form.status}
          options={statusOptions}
          onChange={(e) =>
            setForm({
              ...form,
              status: e.value,
              action_required:
                concernStatuses.find((s: IConcernStatus) => s.id === e.value)?.requires_action ||
                false,
            })
          }
          placeholder="Select Status"
          className="w-full"
          itemTemplate={(option) => (
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
          )}
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

        <Dropdown
          disabled
          value={form.type}
          options={Object.values(EFollowUpType).map((t) => ({ label: t, value: t }))}
          optionLabel="label"
          optionValue="value"
          className="w-full"
        />

        <InputTextarea
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
          rows={3}
          placeholder="Write follow up notes..."
        />

        {form.action_required && (
          <Calendar
            value={form.next_follow_up_date}
            minDate={new Date()}
            onChange={(e) => setForm({ ...form, next_follow_up_date: e.value as Date })}
            placeholder="Next follow up date"
            className="w-full"
            showIcon
          />
        )}

        <Button
          label="Save"
          severity="success"
          icon="pi pi-check"
          onClick={handleSubmit}
          disabled={!form.status || !form.type}
        />
      </div>
    </Dialog>
  )
})

interface BulkFollowUpDialogProps {
  visible: boolean
  onHide: () => void
  category: string
  selectedCount: number
  statusOptions: {
    label: string
    value: number | bigint | null | undefined
    level: EBadgeVariant | null | undefined
  }[]
  concernStatuses: IConcernStatus[]
  onSubmit: (form: any) => Promise<void>
}

const BulkFollowUpDialog = memo(function BulkFollowUpDialog({
  visible,
  onHide,
  category,
  selectedCount,
  statusOptions,
  concernStatuses,
  onSubmit,
}: BulkFollowUpDialogProps) {
  const [form, setForm] = useState({
    status: '',
    notes: '',
    action_required: false,
    next_follow_up_date: null as Date | null,
  })

  const handleSubmit = async () => {
    await onSubmit(form)
    onHide()
  }

  return (
    <Dialog
      modal
      blockScroll
      dismissableMask
      header={`Bulk Feedback - ${category}`}
      visible={visible}
      onHide={onHide}
      style={{ width: '90%', maxWidth: '500px' }}
      footer={
        <>
          <Button icon="pi pi-times" label="Cancel" severity="danger" outlined onClick={onHide} />
          <Button icon="pi pi-save" label="Save" outlined onClick={handleSubmit} />
        </>
      }
    >
      <div className="flex flex-column gap-3 w-full my-2">
        <p className="text-sm text-secondary">Follow up for {selectedCount} selected item(s)</p>
        <div className="flex flex-column gap-2">
          <label className="text-primary-400 font-semibold">Status</label>
          <Dropdown
            value={form.status}
            options={statusOptions}
            onChange={(e) =>
              setForm({
                ...form,
                status: e.value,
                action_required:
                  concernStatuses.find((s: IConcernStatus) => s.id === e.value)?.requires_action ||
                  false,
              })
            }
            placeholder="Select Status"
            className="w-full"
          />
        </div>

        <div className="flex flex-column gap-2">
          <label className="text-primary-400 font-semibold">Notes</label>
          <InputTextarea
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            rows={3}
            placeholder="Write follow up notes..."
          />
        </div>

        {form.action_required && (
          <div className="flex flex-column gap-2">
            <label className="text-primary-400 font-semibold">Next Follow Up Date</label>
            <Calendar
              value={form.next_follow_up_date}
              minDate={new Date()}
              onChange={(e) => {
                const cleanDate = normalizeDateToUTC(e.value as Date)
                setForm({
                  ...form,
                  next_follow_up_date: cleanDate,
                })
              }}
              className="w-full"
              showIcon
            />
          </div>
        )}
      </div>
    </Dialog>
  )
})

export default VisitIssuesPage
