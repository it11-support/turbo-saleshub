'use client'

import { useParams } from 'next/navigation'
import { Button } from 'primereact/button'
import { Card } from 'primereact/card'
import { Divider } from 'primereact/divider'
import { useEffect } from 'react'

import ProductImage from '@/app/(main)/customers/components/ProductImage'
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
        <h5 className="ml-2">Visit Details</h5>
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
        <h5 className="ml-2">Visit Date</h5>
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
          {salesVisit.visit_items?.map((item) => (
            <div className="col-12 lg:col-6 xl:col-6" key={item.product?.ItemCode}>
              <Card className="mb-3 p-3 h-[180px]">
                <div className="flex items-start gap-4 h-full">
                  {/* IMAGE */}
                  {item.product && (
                    <div className="w-[80px] h-[80px] flex-shrink-0 flex items-center justify-center">
                      <ProductImage code={item.product?.ItemCode} alt={item.product?.ItemName} />
                    </div>
                  )}

                  {/* TEXT */}
                  <div className="flex flex-col items-start justify-start">
                    <div className="font-bold text-base leading-tight line-clamp-2">
                      {item.product?.ItemName}
                      <div className="mt-1 text-sm font-semibold mt-3">
                        <p>Notes: {item.notes}</p>
                      </div>
                      <div className="mt-1 text-sm font-semibold mt-3">
                        <p>Date: {formatDate(item?.created_at, { withTime: true })}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}

export default VisitDetailsPage
