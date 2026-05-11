import { ICustomer } from '@saleshub-tsm/types'
import Link from 'next/link'
import { Divider } from 'primereact/divider'
import { OverlayPanel } from 'primereact/overlaypanel'
import React, { useRef } from 'react'

import { parsePhone } from '@/lib/phoneParser'

const CustomerCell = ({ rowData }: { rowData: ICustomer }) => {
  const op = useRef<OverlayPanel>(null)

  return (
    <>
      <span
        onClick={(e) => {
          e.preventDefault()
          op.current?.toggle(e)
        }}
        className="text-blue-600 hover:underline font-medium"
        style={{
          cursor: 'pointer',
          zIndex: 99999,
          color: 'var(--green-500)',
          borderColor: 'var(--green-500)',
        }}
      >
        {rowData.CardName}
      </span>

      <OverlayPanel
        onClick={(e) => e.stopPropagation()}
        ref={op}
        style={{ zIndex: 99999 }}
        appendTo={typeof window !== 'undefined' ? document.body : null}
      >
        {/* Isi detail hover di sini */}
        <div style={{ padding: '5px' }}>
          {rowData?.CardName && (
            <div className="p-2">
              <p className="m-0">
                <i className="pi pi-id-card mr-2"></i>
                {rowData?.CardName}
              </p>
            </div>
          )}

          {rowData?.GroupName && (
            <div className="p-2">
              <p className="m-0">
                <i className="pi pi-shopping-bag mr-2"></i>
                {rowData?.GroupName}
              </p>
            </div>
          )}
          <div className="p-2">
            <p className="m-0">
              {rowData?.Address} <span className="font-bold">[{rowData?.City}]</span>
            </p>
          </div>
          {rowData?.Phone1 && (
            <div className="p-2">
              {parsePhone(rowData?.Phone1).map((phone, index) => (
                <p className="m-0" key={index}>
                  {phone.number && phone.isMobile && <i className="pi pi-mobile mr-2" />}
                  {phone.number && !phone.isMobile && <i className="pi pi-phone mr-2" />}
                  {phone.number}
                </p>
              ))}
            </div>
          )}
          {rowData?.Cellular && (
            <div className="p-2">
              {parsePhone(rowData?.Cellular).map((phone, index) => (
                <p className="m-0" key={index}>
                  {phone.number && phone.isMobile && <i className="pi pi-mobile mr-2" />}
                  {phone.number && !phone.isMobile && <i className="pi pi-phone mr-2" />}
                  {phone.number}
                </p>
              ))}
            </div>
          )}
          {((rowData?.SlpCode && rowData.SlpCode > 0) || rowData?.SalesName) && (
            <>
              <div className="p-2">
                <p className="m-0">
                  <i className="pi pi-user mr-2"></i>
                  {rowData?.SalesName || rowData?.SalesName}
                </p>
              </div>
            </>
          )}

          <Divider />
          <div className="p-2 flex justify-content-end">
            <Link
              href={`/customers/${rowData.id}`}
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
        </div>
      </OverlayPanel>
    </>
  )
}

export default CustomerCell
