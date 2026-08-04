import { ICustomer } from '@saleshub-tsm/types'

import { parsePhone } from '@/lib/phoneParser'

type CustomerInfoProps = {
  customer?: ICustomer | null
  className?: string
  subgroupIcon?: string
  subgroupIconColor?: string
}

export function CustomerInfo({
  customer,
  className,
  subgroupIcon = 'pi pi-shopping-bag',
  subgroupIconColor,
}: CustomerInfoProps) {
  return (
    <div className={className}>
      {customer?.subgroup && (
        <div className="p-2">
          <p className="m-0">
            <i
              className={`${subgroupIcon} mr-2`}
              style={subgroupIconColor ? { color: subgroupIconColor } : undefined}
            />
            {customer.subgroup.IndDesc}
          </p>
        </div>
      )}

      <div className="p-2">
        <p className="m-0">
          {customer?.Address} <span className="font-bold">[{customer?.City}]</span>
        </p>
      </div>

      {customer?.CntctPrsn && (
        <div className="p-2">
          <p className="m-0">
            <i className="pi pi-user mr-2" />
            {customer.CntctPrsn}
          </p>
        </div>
      )}

      {customer?.Phone1 && (
        <div className="p-2">
          {parsePhone(customer.Phone1).map((phone, index) => (
            <p className="m-0" key={index}>
              <i className={`pi ${phone.isMobile ? 'pi-mobile' : 'pi-phone'} mr-2`} />
              {phone.number}
            </p>
          ))}
        </div>
      )}

      {customer?.Cellular && (
        <div className="p-2">
          {parsePhone(customer.Cellular).map((phone, index) => (
            <p className="m-0" key={index}>
              <i className={`pi ${phone.isMobile ? 'pi-mobile' : 'pi-phone'} mr-2`} />
              {phone.number}
            </p>
          ))}
        </div>
      )}
    </div>
  )
}
