'use client'

import VisitTimeLine from '../../components/VisitTimeLine'
import { EFollowUpStatus, EFollowUpType, IVisitItemConcern } from '@saleshub-tsm/types'
import { useParams } from 'next/navigation'
import { Button } from 'primereact/button'
import { Calendar } from 'primereact/calendar'
import { Card } from 'primereact/card'
import { Dialog } from 'primereact/dialog'
import { Divider } from 'primereact/divider'
import { Dropdown } from 'primereact/dropdown'
import { InputTextarea } from 'primereact/inputtextarea'
import { Tag } from 'primereact/tag'
import { useEffect, useState } from 'react'

import VisitDetailHeader from '@/app/(main)/customers/components/VisitDetailHeader'
import { formatDate } from '@/lib/dateUtils'
import { useSalesVisit } from '@/stores'

const VisitIssuesPage = () => {
  const { id } = useParams()

  const salesVisitStore = useSalesVisit()

  const { salesVisit, fetchVisitDetails, followUpForm, setFollowUpForm, addFollowUp } =
    salesVisitStore
  const [visible, setIsVisible] = useState(false)
  const [selectedConcern, setSelectedConcern] = useState<IVisitItemConcern | null>(null)

  const customer = salesVisit?.customer

  useEffect(() => {
    fetchVisitDetails(Number(id))
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
        status:
          (selectedConcern.status.status as EFollowUpStatus.Pending) || EFollowUpStatus.Pending,
        type: null,
        notes: '',
        next_follow_up_date: null,
      })
    }
  }, [selectedConcern, visible])

  const statusOptions = Object.values(EFollowUpStatus).map((s) => ({
    label: s,
    value: s,
  }))

  const typeOptions = Object.values(EFollowUpType).map((t) => ({
    label: t,
    value: t,
  }))

  const statusConfig: Record<
    EFollowUpStatus,
    { severity: 'warning' | 'info' | 'success' | 'danger'; icon: string }
  > = {
    [EFollowUpStatus.Pending]: { severity: 'warning', icon: 'pi pi-pause' },
    [EFollowUpStatus.FollowUp]: { severity: 'info', icon: 'pi pi-clock' },
    [EFollowUpStatus.Done]: { severity: 'success', icon: 'pi pi-check' },
    [EFollowUpStatus.Closed]: { severity: 'danger', icon: 'pi pi-times' },
  }

  const GetTag = ({ status }: { status: EFollowUpStatus }) => {
    const config = statusConfig[status] || {
      severity: 'warning',
      icon: 'pi pi-exclamation-triangle',
    }

    return <Tag className="mr-2" icon={config.icon} severity={config.severity} value={status} />
  }

  return (
    <>
      <VisitDetailHeader customer={customer} salesVisit={salesVisit} />
      <div className="card">
        <h5 className="ml-2">Status</h5>

        <div className="">
          {salesVisit.visit_items?.map((item) => {
            const visitItemConcern = item.visit_item_concerns || []
            return (
              <div className="col-12 md:col-12 lg:col-12 flex" key={item.product?.ItemCode}>
                <Card className="w-full h-full p-2">
                  <div className="flex flex-column w-full gap-3">
                    {/* ROW ATAS: Judul & Tanggal */}
                    <div className="flex w-full align-items-start gap-3">
                      {/* TANGGAL (1/3 Lebar) */}
                      <div className="w-9 flex flex-column text-xs text-color-secondary font-medium pt-1">
                        <div className="text-lg font-bold text-color line-height-2">
                          {item.product?.ItemName}
                        </div>
                      </div>

                      {/* JUDUL / NAMA PRODUK (2/3 Lebar) */}
                      <div className="w-3 flex flex-column text-right">
                        <span className="font-bold text-xs opacity-70">
                          {formatDate(item?.created_at, { withTime: true })}
                        </span>
                      </div>
                    </div>

                    {!visitItemConcern.length && (
                      <div className="flex flex-column gap-3 w-full mt-2">
                        <div className="w-full p-3 surface-card">
                          <div className="text-sm p-2 text-color-secondary line-height-3">
                            No issues
                          </div>
                        </div>
                      </div>
                    )}
                    {/* ROW BAWAH: List Concern (Full Width) */}
                    {visitItemConcern.length > 0 && (
                      <div className="flex flex-column gap-2 w-full mt-2">
                        {visitItemConcern.map((concern, index) => (
                          <div
                            key={`visit-concern-${concern.id}`}
                            className="w-full p-3 surface-card"
                          >
                            {/* Header Concern: Nama (Kiri) & Status (Kanan) */}
                            <div className="flex justify-content-start gap-3 align-items-center mb-2">
                              <span className="font-semibold text-lg text-color">
                                {concern?.category?.name}
                              </span>
                              <div>
                                <GetTag status={concern?.status?.status as EFollowUpStatus} />
                              </div>
                            </div>

                            {/* Notes */}
                            {concern?.notes && (
                              <div className="text-sm p-2 text-color-secondary line-height-3">
                                {concern.notes}
                              </div>
                            )}

                            {concern.follow_ups && concern.follow_ups.length > 0 ? (
                              <div className="flex flex-column gap-2 mt-2">
                                {/* Panggil komponen Timeline di sini */}
                                <VisitTimeLine
                                  events={concern.follow_ups.map((followUp) => ({
                                    status: followUp.status,
                                    notes: followUp.notes,
                                    date: formatDate(followUp.created_at, { withTime: true }),
                                    icon: 'pi pi-check',
                                    color: 'var(--primary-color)',
                                    next_follow_up_date: formatDate(followUp.next_follow_up_date, {
                                      withTime: false,
                                    }),
                                  }))}
                                />
                              </div>
                            ) : null}

                            {![EFollowUpStatus.Done, EFollowUpStatus.Closed].includes(concern?.status?.status) && (
                              <Button
                                size="small"
                                label="Follow Up"
                                severity="success"
                                className="mt-2"
                                outlined
                                onClick={() => handleClickFollowUp(concern)}
                              />
                            )}
                            {visitItemConcern.length - 1 !== index && <Divider />}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </Card>
              </div>
            )
          })}
        </div>
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
            onChange={(e) => setFollowUpForm({ ...followUpForm, status: e.value })}
            placeholder="Select Status"
            className="w-full"
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
          {followUpForm.status !== EFollowUpStatus.Done && followUpForm.status !== EFollowUpStatus.Closed && (
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
