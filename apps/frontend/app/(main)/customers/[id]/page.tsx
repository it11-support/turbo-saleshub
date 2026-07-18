'use client'
import { CustomerDetail } from '../components/CustomerDetail'
import { calculateCustomerSpent } from '../components/functions'
import { ICustomer, ILastPurchase, IResObject, SuggestedItemsGrouped } from '@saleshub-tsm/types'
import { use } from 'react'

import { useFetch } from '@/hooks/useFetch'

interface Props {
  params: Promise<{ id: string }>
}
type History = {
  lastPurchase: ILastPurchase[]
  ordersByRange: { current: number; last3Months: number; last6Months: number }
  invoiceCountByRange: { current: number; last3Months: number; last6Months: number }
  purchaseValue: { current: number; last3Months: number; last6Months: number }
}

const CustomerDetailPage = ({ params }: Props) => {
  const { id } = use(params)

  const { data: customerData } = useFetch<IResObject<ICustomer>>(`customers/${id}`, undefined, {
    enabled: !!id,
    dedupingInterval: 60000,
  })

  const { data: suggestionsData } = useFetch<IResObject<SuggestedItemsGrouped>>(
    `customers/${id}/suggestions`,
    undefined,
    {
      enabled: !!id,
      dedupingInterval: 60000,
    }
  )

  const { data: purchaseHistoryData } = useFetch<IResObject<History>>(
    `customers/${id}/purchases`,
    undefined,
    {
      enabled: !!id,
      dedupingInterval: 60000,
    }
  )

  const lastPurchase = purchaseHistoryData?.data?.lastPurchase || []
  const ordersByRange = purchaseHistoryData?.data?.ordersByRange || {
    current: 0,
    last3Months: 0,
    last6Months: 0,
  }
  const invoiceCountByRange = purchaseHistoryData?.data?.invoiceCountByRange || {
    current: 0,
    last3Months: 0,
    last6Months: 0,
  }
  const customer = customerData?.data as ICustomer

  const suggestedItems = suggestionsData?.data as SuggestedItemsGrouped
  const valueCurrentMonth = customer?.sales_invoices
    ? calculateCustomerSpent(customer.sales_invoices)
    : 0
  const value3Months = customer?.sales_invoices
    ? calculateCustomerSpent(customer.sales_invoices, 3)
    : 0
  const value6Months = customer?.sales_invoices
    ? calculateCustomerSpent(customer.sales_invoices, 6)
    : 0

  const history: History = {
    lastPurchase,
    ordersByRange,
    invoiceCountByRange,
    purchaseValue: {
      current: valueCurrentMonth,
      last3Months: value3Months,
      last6Months: value6Months,
    },
  }

  return (
    <div className="card px-0">
      <p className="m-0 text-2xl ml-3">
        {customer?.CardName} <span className="font-bold"> [{customer?.CardCode}]</span>
      </p>
      <CustomerDetail
        customer={customer}
        suggestedItems={suggestedItems}
        purchaseHistory={history}
      />
    </div>
  )
}

export default CustomerDetailPage
