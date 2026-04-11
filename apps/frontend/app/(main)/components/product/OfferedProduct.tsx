'use client'

import ProductTag from './ProductTag'
import VisitTimeLine from '../../visits/components/VisitTimeLine'
import { EBadgeVariant, EFollowUpType, IVisitItem, IVisitItemConcern } from '@saleshub-tsm/types'
import { useParams } from 'next/navigation'
import { Button } from 'primereact/button'
import { Calendar } from 'primereact/calendar'
import { Card } from 'primereact/card'
import { Dialog } from 'primereact/dialog'
import { Divider } from 'primereact/divider'
import { Dropdown } from 'primereact/dropdown'
import { InputTextarea } from 'primereact/inputtextarea'
import { useEffect, useState } from 'react'

import { useAuth } from '@/layout/context/AuthContext'
import { variantColors } from '@/lib/constants'
import { formatDate } from '@/lib/dateUtils'
import { useConcernStore, useSalesVisit } from '@/stores'

type Props = {
  visitItem: IVisitItem
  handleFollowUp?: (concern: IVisitItemConcern) => void
}
const OfferedProduct = (props: Props) => {
  const salesVisitStore = useSalesVisit()
  const [visible, setIsVisible] = useState(false)
  const [selectedConcern, setSelectedConcern] = useState<IVisitItemConcern | null>(null)
  const { id } = useParams()

  const { visitItem, handleFollowUp } = props
  const product = visitItem.product
  const { followUpForm, setFollowUpForm, addFollowUp, fetchVisitDetails } = salesVisitStore
  const { fetchConcernStatuses, concernStatuses } = useConcernStore()
  const { isAdmin } = useAuth()

  const onHide = () => {
    setSelectedConcern(null)
    setIsVisible(false)
  }

  useEffect(() => {
    fetchConcernStatuses()
  }, [])

  useEffect(() => {
    if (selectedConcern && visible) {
      setFollowUpForm({
        visit_item_concern_id: selectedConcern.id,
        status: selectedConcern.status.status,
        action_required: selectedConcern.status.requires_action || false,
        type: EFollowUpType.Override,
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

  const handleSubmit = async () => {
    await addFollowUp().then(() => {
      fetchVisitDetails(Number(id))
    })
    setIsVisible(false)
    setSelectedConcern(null)
  }

  const handleOverride = (concern: IVisitItemConcern) => {
    setSelectedConcern(concern)
    setIsVisible(true)
  }

  return (
    <>
      <div className="col-12 lg:col-12 xl:col-12" key={product?.ItemCode}>
        <Card
          className="w-full h-full p-2"
          pt={{
            body: { className: 'p-3' },
            content: { className: 'p-0' },
          }}
        >
          <div className="flex flex-column w-full gap-3">
            {/* ROW ATAS: Judul & Tanggal */}
            <div className="flex w-full align-items-start gap-3">
              {/* TANGGAL (1/3 Lebar) */}
              <div className="w-9 flex flex-column text-xs text-color-secondary font-medium pt-1">
                <div className="text-lg font-bold text-color line-height-2">
                  {product?.ItemName}
                </div>
              </div>

              {/* JUDUL / NAMA PRODUK (2/3 Lebar) */}
              <div className="w-3 flex flex-column text-right">
                <span className="font-bold text-xs opacity-70">
                  {formatDate(visitItem?.created_at, { withTime: true })}
                </span>
              </div>
            </div>

            {!visitItem.visit_item_concerns?.length && (
              <div className="flex flex-column gap-3 w-full mt-2">
                <div className="w-full p-0 surface-card">
                  <div className="text-sm p-2 text-color-secondary line-height-3">No issues</div>
                </div>
              </div>
            )}
            {/* ROW BAWAH: List Concern (Full Width) */}
            {(visitItem.visit_item_concerns?.length ?? 0) > 0 && (
              <div className="flex flex-column gap-3 w-full mt-2">
                {visitItem.visit_item_concerns?.map((concern, index) => (
                  <div key={`visit-concern-${concern.id}`} className="w-full p-0 surface-card">
                    {/* Header Concern: Nama (Kiri) & Status (Kanan) */}
                    <div className="flex justify-content-start gap-2 align-items-center mb-2">
                      <span className="font-semibold text-lg text-color">
                        {concern?.category?.name}
                      </span>
                    </div>
                    <div className="text-sm p-0 text-color-secondary line-height-3">
                      Last status: <ProductTag status={concern?.status} />
                    </div>
                    {/* Notes */}
                    {concern?.notes && (
                      <div className="text-sm py-3 text-color-secondary line-height-3">
                        {concern.notes}
                      </div>
                    )}

                    {concern.follow_ups && concern.follow_ups.length > 0 ? (
                      <div className="flex flex-column gap-2 my-2">
                        {/* Panggil komponen Timeline di sini */}
                        <VisitTimeLine
                          events={concern.follow_ups.map((followUp) => ({
                            concern_status: followUp.concern_status,
                            notes: followUp.notes,
                            type: followUp.type,
                            date: formatDate(followUp.created_at, {
                              withTime: true,
                            }),
                            icon: 'pi pi-check',
                            color: 'var(--primary-color)',
                            next_follow_up_date: formatDate(followUp.next_follow_up_date, {
                              withTime: false,
                            }),
                          }))}
                        />
                      </div>
                    ) : null}
                    <div className="flex justify-content-start gap-2 align-items-center mb-2">
                      {concern?.status?.requires_action && handleFollowUp && (
                        <Button
                          size="small"
                          label="Follow Up"
                          severity="success"
                          className="mt-2"
                          outlined
                          onClick={() => handleFollowUp(concern)}
                        />
                      )}
                      {concern?.status && isAdmin && (
                        <Button
                          size="small"
                          label="Override"
                          severity="warning"
                          className="mt-2"
                          outlined
                          onClick={() => handleOverride(concern)}
                        />
                      )}
                    </div>

                    {index < (visitItem.visit_item_concerns?.length ?? 0) - 1 && <Divider />}
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>
      </div>

      <Dialog
        header="Override Status"
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
            disabled
            value={followUpForm.type}
            options={typeOptions}
            optionLabel="label"
            optionValue="value"
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

export default OfferedProduct
