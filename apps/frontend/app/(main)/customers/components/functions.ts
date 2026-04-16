import { ICustomerSummary, ISalesInvoices } from '@saleshub-tsm/types'
import { format, isWithinInterval, parseISO, startOfMonth, subMonths } from 'date-fns'

export const calculateCustomerSpent = (salesInvoices?: ISalesInvoices[], months?: number) => {
  if (!salesInvoices) return 0

  const now = new Date()

  // Current month
  const start = months ? subMonths(now, months) : startOfMonth(now)

  const filtered = salesInvoices.filter((inv) => {
    if (!inv.DocDate) return false

    const docDate = typeof inv.DocDate === 'string' ? parseISO(inv.DocDate) : inv.DocDate

    return isWithinInterval(docDate, {
      start,
      end: now,
    })
  })

  return filtered.reduce((acc, curr) => acc + (curr.TotalSales ?? 0), 0)
}

export const getMonthlySummary = (
  sales_invoices: ISalesInvoices[],
  months: number = 6
): ICustomerSummary[] => {
  if (!sales_invoices || sales_invoices.length === 0) return []

  const now = new Date()

  // Ambil 6 bulan terakhir termasuk bulan ini
  const monthKeys: string[] = []
  for (let i = months - 1; i >= 0; i--) {
    const d = subMonths(now, i)
    monthKeys.push(format(d, 'yyyy-MM'))
  }

  const summary: Record<string, { totalSales: number; itemsSet: Set<string> }> = {}

  // Siapkan default untuk semua bulan
  monthKeys.forEach((key) => {
    summary[key] = { totalSales: 0, itemsSet: new Set() }
  })

  sales_invoices.forEach((inv) => {
    if (!inv.DocDate) return

    const date = typeof inv.DocDate === 'string' ? parseISO(inv.DocDate) : inv.DocDate

    const monthKey = format(date, 'yyyy-MM')

    // Hanya proses jika bulan berada dalam 6 bulan range
    if (!summary[monthKey]) return

    summary[monthKey].totalSales += Number(inv.TotalSales) || 0
    if (inv.ItemCode) summary[monthKey].itemsSet.add(inv.ItemCode)
  })

  return monthKeys.map((key) => ({
    month: key,
    totalSales: summary[key].totalSales,
    activeItems: summary[key].itemsSet.size,
  }))
}

export const segmentToStars = (segment?: string | null) => {
  switch (segment) {
    case 'VIP':
      return 5
    case 'LOYAL':
      return 4
    case 'POTENTIAL':
      return 3
    case 'AT_RISK':
      return 2
    case 'LOST':
      return 1
    default:
      return 0
  }
}

export const getClass = (segment?: string | null) => {
  switch (segment) {
    case 'VIP':
      return 'rfm-rating rating-vip'
    case 'LOYAL':
      return 'rfm-rating rating-loyal'
    case 'POTENTIAL':
      return 'rfm-rating rating-potential'
    case 'AT_RISK':
      return 'rfm-rating rating-risk'
    case 'LOST':
      return 'rfm-rating rating-lost'
    default:
      return 'rfm-rating'
  }
}
