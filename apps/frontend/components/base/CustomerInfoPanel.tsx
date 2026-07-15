import Link from 'next/link'
import { Divider } from 'primereact/divider'

import { parsePhone } from '@/lib/phoneParser'

type CustomerInfoPanelProps = {
  customer: {
    CardName?: string | null
    GroupName?: string | null
    Address?: string | null
    City?: string | null
    Phone1?: string | null
    Cellular?: string | null
    SlpCode?: number | null
    SalesName?: string | null
    id?: string | number | null
  }
  showViewDetail?: boolean
  viewDetailHref?: string
  className?: string
}

const CustomerInfoPanel = ({
  customer,
  showViewDetail = true,
  viewDetailHref,
  className = '',
}: CustomerInfoPanelProps) => {
  const href = viewDetailHref || `/customers/${customer.id}`

  const renderPhone = (phoneNumber?: string | null) => {
    if (!phoneNumber) return null
    return parsePhone(phoneNumber).map((phone, index) => (
      <p className="m-0" key={index}>
        {phone.number && phone.isMobile && <i className="pi pi-mobile mr-2" />}
        {phone.number && !phone.isMobile && <i className="pi pi-phone mr-2" />}
        {phone.number}
      </p>
    ))
  }

  return (
    <div className={`p-2 ${className}`}>
      {customer?.CardName && (
        <div className="p-2">
          <p className="m-0">
            <i className="pi pi-id-card mr-2"></i>
            {customer?.CardName}
          </p>
        </div>
      )}

      {customer?.GroupName && (
        <div className="p-2">
          <p className="m-0">
            <i className="pi pi-shopping-bag mr-2"></i>
            {customer?.GroupName}
          </p>
        </div>
      )}
      <div className="p-2">
        <p className="m-0">
          {customer?.Address} <span className="font-bold">[{customer?.City}]</span>
        </p>
      </div>
      {customer?.Phone1 && <div className="p-2">{renderPhone(customer?.Phone1)}</div>}
      {customer?.Cellular && <div className="p-2">{renderPhone(customer?.Cellular)}</div>}
      {((customer?.SlpCode && customer.SlpCode > 0) || customer?.SalesName) && (
        <>
          <div className="p-2">
            <p className="m-0">
              <i className="pi pi-user mr-2"></i>
              {customer?.SalesName || customer?.SalesName}
            </p>
          </div>
        </>
      )}

      <Divider />
      {showViewDetail && (
        <div className="p-2 flex justify-content-end">
          <Link
            href={href}
            className="p-button p-button-success p-button-outlined p-button-sm no-underline"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              textDecoration: 'none',
            }}
          >
            <i className="pi pi-external-link mr-2"></i>
            View Detail
          </Link>
        </div>
      )}
    </div>
  )
}

export default CustomerInfoPanel
