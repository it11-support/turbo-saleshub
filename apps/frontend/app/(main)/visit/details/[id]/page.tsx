'use client'

import { EFollowUpStatus } from '@saleshub-tsm/types'
import { useParams } from 'next/navigation'
import { Card } from 'primereact/card'
import { Divider } from 'primereact/divider'
import { Tag } from 'primereact/tag'
import { useEffect } from 'react'

import VisitDetailHeader from '@/app/(main)/customers/components/VisitDetailHeader'
import VisitTimeLine from '@/app/(main)/visits/components/VisitTimeLine'
import { formatDate } from '@/lib/dateUtils'
import { useSalesVisit } from '@/stores'

const VisitDetailsPage = () => {
  const { id } = useParams()
  const salesVisirStore = useSalesVisit()

  const { salesVisit, fetchVisitDetails } = salesVisirStore

  useEffect(() => {
    fetchVisitDetails(Number(id))
  }, [])

  const customer = salesVisit?.customer

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
        <h5 className="ml-2">Offered Items</h5>

        <div className="grid">
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
                      <div className="flex flex-column gap-3 w-full mt-2">
                        {visitItemConcern.map((concern, index) => (
                          <div
                            key={`visit-concern-${concern.id}`}
                            className="w-full p-3 surface-card"
                          >
                            {/* Header Concern: Nama (Kiri) & Status (Kanan) */}
                            <div className="flex justify-content-start gap-2 align-items-center mb-2">
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
    </>
  )
}

export default VisitDetailsPage
