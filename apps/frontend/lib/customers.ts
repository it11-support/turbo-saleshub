import { ICustomer } from '@saleshub-tsm/types'
import { isWithinInterval, parseISO, subMonths } from 'date-fns'

export interface CustomerSummary {
  ItemCode: string
  ItemName: string
  QtyKg: number
  TotalSales: number
  count: number
  lastInvDate: Date | string
}

export const getActiveItems = (customer: ICustomer, month?: number): CustomerSummary[] => {
  if (!customer?.sales_invoices) return []

  const filteredInvoices = customer.sales_invoices.filter((inv) => {
    if (!inv.DocDate) return false
    if (!month) return true

    const docDate = typeof inv.DocDate === 'string' ? parseISO(inv.DocDate) : inv.DocDate

    const now = new Date()
    const interval = {
      start: subMonths(now, month),
      end: now,
    }

    return isWithinInterval(docDate, interval)
  })

  const grouped = filteredInvoices.reduce(
    (acc, curr) => {
      const key = curr.ItemCode!

      if (!acc[key])
        acc[key] = {
          ItemCode: key,
          ItemName: curr.product?.ItemName ?? '',
          QtyKg: 0,
          TotalSales: 0,
          count: 0,
          lastInvDate: '',
        }

      acc[key].QtyKg += Number(curr.QtyKg) || 0
      acc[key].TotalSales += curr.TotalSales || 0
      acc[key].count += 1

      if (
        curr.DocDate &&
        (!acc[key].lastInvDate || new Date(curr.DocDate) > new Date(acc[key].lastInvDate))
      )
        acc[key].lastInvDate = curr.DocDate

      return acc
    },
    {} as Record<string, CustomerSummary>
  )

  return Object.values(grouped).sort((a, b) => b.count - a.count)
}
