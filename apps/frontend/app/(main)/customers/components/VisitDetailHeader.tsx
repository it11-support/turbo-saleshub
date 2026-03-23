'use client'

import { ICustomer, IVisit } from '@saleshub-tsm/types'
import { Button } from 'primereact/button'
import { Divider } from 'primereact/divider'

import { formatDate } from '@/lib/dateUtils'

type Props = {
  customer: ICustomer
  salesVisit: IVisit
}
const VisitDetailHeader = (props: Props) => {
  const { customer, salesVisit } = props
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
    </>
  )
}

export default VisitDetailHeader
