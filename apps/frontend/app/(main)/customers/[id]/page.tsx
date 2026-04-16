'use client'
import { CustomerDetail } from '../components/CustomerDetail'
import { calculateCustomerSpent } from '../components/functions'
import { ILastPurchase } from '@saleshub-tsm/types'
import { use, useEffect } from 'react'

import { useCustomerStore } from '@/stores/customers'

interface Props {
  params: Promise<{ id: string }>
}
const CustomerDetailPage = ({ params }: Props) => {
  const { id } = use(params)

  const customerStore = useCustomerStore()
  const {
    fetchCustomerSummary,
    customer,
    fetchSuggestedItems,
    suggestedItems,
    fetchPurchaseHistory,
    lastPurchase,
    ordersByRange,
    invoiceCountByRange,
  } = customerStore
  useEffect(() => {
    fetchCustomerSummary(id)
    fetchSuggestedItems(id)
    fetchPurchaseHistory(id)
  }, [])

  const valueCurrentMonth = customer?.sales_invoices
    ? calculateCustomerSpent(customer.sales_invoices)
    : 0
  const value3Months = customer?.sales_invoices
    ? calculateCustomerSpent(customer.sales_invoices, 3)
    : 0
  const value6Months = customer?.sales_invoices
    ? calculateCustomerSpent(customer.sales_invoices, 6)
    : 0

  type History = {
    lastPurchase: ILastPurchase[]
    ordersByRange: { current: number; last3Months: number; last6Months: number }
    invoiceCountByRange: { current: number; last3Months: number; last6Months: number }
    purchaseValue: { current: number; last3Months: number; last6Months: number }
  }

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
