'use client'

import { useParams } from 'next/navigation'
import { Badge } from 'primereact/badge'
import { Button } from 'primereact/button'
import { Card } from 'primereact/card'
import { Divider } from 'primereact/divider'
import { useEffect } from 'react'

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

  return (
    <>
      <div className="card mb-2">
        <div className="col-12 flex justify-content-start align-items-center">
          <Button
            label="Back"
            icon="pi pi-chevron-left"
            severity="danger"
            size="small"
            outlined
            onClick={() => history.back()}
          />
        </div>
        <h5 className="ml-2">Customer</h5>
        <div className="col-12">
          <div>
            <p className="font-bold text-2xl">{customer?.CardName}</p>
            <p>
              <i className="pi pi-map-marker mr-2"></i>
              {customer?.City}
            </p>
            <p>
              <i className="pi pi-phone mr-2"></i>
              {customer?.Phone1}
            </p>
            <p>
              <i className="pi pi-user mr-2"></i>
              {customer?.CntctPrsn}
            </p>
            <Divider />
            <p>
              <i className="pi pi-id-card mr-2"></i>
              {customer?.SalesName}
            </p>
          </div>
        </div>
      </div>
      <div className="card  mb-2">
        <h5 className="ml-2">Visit Details</h5>
        <div className="col-12">
          <p>
            <span className="font-semibold">Started At: </span>{' '}
            {formatDate(salesVisit?.start_at, { withTime: true })}
          </p>
          <p>
            <span className="font-semibold">Ended At: </span>{' '}
            {formatDate(salesVisit?.end_at, { withTime: true })}
          </p>
          <p>
            <span className="font-semibold">Notes: </span> {salesVisit.notes}
          </p>
          <p>
            <span className="font-semibold">Status: </span> {salesVisit.status}
          </p>
        </div>
      </div>
      <div className="card">
        <h5 className="ml-2">Offered Items</h5>

        <div className="grid">
          {salesVisit.visit_items?.map((item) => {
            const visitItemConcern = item.visit_item_concerns || []
            return (
              <div className="col-12 lg:col-6 xl:col-6" key={item.product?.ItemCode}>
                <Card className="mb-3 p-3 h-[180px]">
                  <div className="flex flex-column w-full gap-3">
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
                          <span className="opacity-70 text-xs">Recorded on</span>
                          <span className="font-bold text-xs opacity-70">
                            {formatDate(item?.created_at, { withTime: true })}
                          </span>
                        </div>
                      </div>

                      {/* ROW BAWAH: List Concern (Full Width) */}
                      {visitItemConcern.length > 0 && (
                        <div className="flex flex-column gap-3 w-full mt-2">
                          {visitItemConcern.map((concern) => (
                            <div
                              key={`visit-concern-${concern.id}`}
                              className="w-full p-3 surface-card surface-border shadow-1 border-left-2"
                            >
                              {/* Header Concern: Nama (Kiri) & Status (Kanan) */}
                              <div className="flex justify-content-between align-items-center mb-2">
                                <span className="font-semibold text-lg text-color">
                                  {concern?.category?.name}
                                </span>
                                <Badge severity="success" value={concern?.status?.status} />
                              </div>

                              {/* Notes */}
                              {concern?.notes && (
                                <div className="text-sm p-2 text-color-secondary line-height-3">
                                  {concern.notes}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
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
