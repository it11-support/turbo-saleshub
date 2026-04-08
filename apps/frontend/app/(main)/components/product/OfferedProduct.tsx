'use client'

import ProductTag from './ProductTag'
import VisitTimeLine from '../../visits/components/VisitTimeLine'
import { IVisitItem, IVisitItemConcern } from '@saleshub-tsm/types'
import { Button } from 'primereact/button'
import { Card } from 'primereact/card'
import { Divider } from 'primereact/divider'

import { formatDate } from '@/lib/dateUtils'

type Props = {
  visitItem: IVisitItem
  handleFollowUp?: (concern: IVisitItemConcern) => void
}
const OfferedProduct = (props: Props) => {
  const { visitItem, handleFollowUp } = props
  const product = visitItem.product
  return (
    <div className="col-12 lg:col-12 xl:col-12" key={product?.ItemCode}>
      <Card className="w-full h-full p-2">
        <div className="flex flex-column w-full gap-3">
          {/* ROW ATAS: Judul & Tanggal */}
          <div className="flex w-full align-items-start gap-3">
            {/* TANGGAL (1/3 Lebar) */}
            <div className="w-9 flex flex-column text-xs text-color-secondary font-medium pt-1">
              <div className="text-lg font-bold text-color line-height-2">{product?.ItemName}</div>
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
              <div className="w-full p-3 surface-card">
                <div className="text-sm p-2 text-color-secondary line-height-3">No issues</div>
              </div>
            </div>
          )}
          {/* ROW BAWAH: List Concern (Full Width) */}
          {(visitItem.visit_item_concerns?.length ?? 0) > 0 && (
            <div className="flex flex-column gap-3 w-full mt-2">
              {visitItem.visit_item_concerns?.map((concern, index) => (
                <div key={`visit-concern-${concern.id}`} className="w-full p-3 surface-card">
                  {/* Header Concern: Nama (Kiri) & Status (Kanan) */}
                  <div className="flex justify-content-start gap-2 align-items-center mb-2">
                    <span className="font-semibold text-lg text-color">
                      {concern?.category?.name}
                    </span>
                    <div>
                      <ProductTag status={concern?.status} />
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
                          concern_status: followUp.concern_status,
                          notes: followUp.notes,
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

                  {index < (visitItem.visit_item_concerns?.length ?? 0) - 1 && <Divider />}
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}

export default OfferedProduct
