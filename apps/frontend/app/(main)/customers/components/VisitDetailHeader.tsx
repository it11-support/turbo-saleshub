'use client'

import NavButton from './NavButton'
import MapPreview from '../../components/map/MapPreview'
import AvgRevenueAndTarget from '../../visits/components/AvgRevenueAndTarget'
import { ICustomer, IVisit } from '@saleshub-tsm/types'
import Image from 'next/image'
import { Card } from 'primereact/card'
import { Dialog } from 'primereact/dialog'
import { Divider } from 'primereact/divider'
import { useState } from 'react'

import { formatDate } from '@/lib/dateUtils'

type Props = {
  customer?: ICustomer
  salesVisit?: IVisit
  handleEndVisit?: () => void
}

const VisitDetailHeader = (props: Props) => {
  const { customer, salesVisit, handleEndVisit } = props
  const [previewVisible, setPreviewVisible] = useState(false)

  return (
    <>
      <div className="card mb-2">
        <NavButton handleEndVisit={handleEndVisit} />
        <h5 className="ml-2">Customer</h5>
        <div className="col-12">
          <div className="flex flex-column lg:flex-row justify-content-between align-items-start gap-3">
            {/* Kiri */}
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
            </div>

            {/* Kanan */}
            <div className="w-full lg:w-auto">
              {customer?.lat && customer?.lng && (
                <MapPreview
                  lat={Number(customer.lat)}
                  lng={Number(customer.lng)}
                  accuracy={Number(customer.accuracy)}
                  className="w-full lg:w-32 h-32"
                  height={120}
                  width={220}
                  zoom={9}
                />
              )}
            </div>
          </div>

          <Divider />

          <p>
            <i className="pi pi-id-card mr-2"></i>
            {customer?.SalesName}
          </p>
        </div>
      </div>
      <Card title="Target Overview" className="card mb-2">
        <AvgRevenueAndTarget customer={customer} />
      </Card>
      <div className="card mb-2">
        <h5 className="ml-2">Visit Details</h5>

        <div className="grid px-2">
          {/* Kiri */}
          <div className="col-12 lg:col-6">
            <p>
              <span className="font-semibold">Started At: </span>
              {formatDate(salesVisit?.start_at, { withTime: true })}
            </p>

            <p>
              <span className="font-semibold">Ended At: </span>
              {formatDate(salesVisit?.end_at, { withTime: true })}
            </p>

            <p>
              <span className="font-semibold">Notes: </span>
              {salesVisit?.notes || '-'}
            </p>

            <p>
              <span className="font-semibold">Status: </span>
              {salesVisit?.status}
            </p>
          </div>

          {/* Kanan */}
          <div className="col-12 lg:col-6">
            {salesVisit?.photo_url && (
              <div className="mb-4">
                <p className="font-semibold mb-2">Visit Photo</p>

                <div
                  className="cursor-pointer overflow-hidden rounded-lg border shadow-sm hover:shadow-md transition-shadow"
                  onClick={() => setPreviewVisible(true)}
                >
                  <Image
                    src={`${process.env.NEXT_PUBLIC_API_BASE_URL}visit/image/${salesVisit.id}`}
                    alt="Visit Photo"
                    width={1200}
                    height={1200}
                    style={{
                      maxWidth: 500,
                      width: '100%',
                      height: 220,
                      objectFit: 'cover',
                      objectPosition: 'left bottom',
                      display: 'block',
                    }}
                    unoptimized
                    loading="eager"
                  />
                </div>
              </div>
            )}

            {salesVisit?.lat && salesVisit.lng && (
              <div>
                <p className="font-semibold mb-2">Visit Point</p>

                <MapPreview
                  lat={Number(salesVisit.lat)}
                  lng={Number(salesVisit.lng)}
                  accuracy={Number(salesVisit.accuracy)}
                  className="w-full"
                  width={500}
                  height={220}
                />
              </div>
            )}
          </div>
        </div>
      </div>
      <Dialog
        header="Visit Photo"
        maximized
        visible={previewVisible}
        onHide={() => setPreviewVisible(false)}
        contentClassName="p-0 overflow-hidden"
      >
        <div
          style={{
            width: '100%',
            height: '100%',
            minHeight: 'calc(100dvh - 8rem)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Image
            src={`${process.env.NEXT_PUBLIC_API_BASE_URL}visit/image/${salesVisit?.id}`}
            alt="Visit Photo"
            width={1200}
            height={1200}
            style={{
              maxWidth: '100%',
              maxHeight: '100%',
              width: 'auto',
              height: 'auto',
              objectFit: 'contain',
            }}
            unoptimized
          />
        </div>
      </Dialog>
    </>
  )
}

export default VisitDetailHeader
