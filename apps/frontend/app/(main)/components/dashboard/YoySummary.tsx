import SkeletonLoader from '../skeleton-loader/SkeletonLoader'
import { Summary } from '@saleshub-tsm/types'
import { Card } from 'primereact/card'

import { formatCurrency } from '@/lib/formatter'

type YoYSummaryProps = {
  period: 'mtd' | 'ytd'
  isValidating: boolean
  summary?: Summary
}
const YoySummary = ({ isValidating, summary, period }: YoYSummaryProps) => {
  const summaryKeys = ['revenue', 'orders', 'customers'] as const

  const selectedSummary = summary?.[period]

  const mappedSummary = {
    revenue: {
      current: selectedSummary?.current.revenue,
      last: selectedSummary?.previous.revenue,
      growthPercent: selectedSummary?.growth.revenue,
      diff: (selectedSummary?.current?.revenue ?? 0) - (selectedSummary?.previous?.revenue ?? 0),
    },
    orders: {
      current: selectedSummary?.current.orders,
      last: selectedSummary?.previous.orders,
      growthPercent: selectedSummary?.growth.orders,
      diff: (selectedSummary?.current?.orders ?? 0) - (selectedSummary?.previous?.orders ?? 0),
    },
    customers: {
      current: selectedSummary?.current.customers,
      last: selectedSummary?.previous.customers,
      growthPercent: selectedSummary?.growth.customers,
      diff: (selectedSummary?.current?.customers ?? 0) - (selectedSummary?.previous.customers ?? 0),
    },
  }

  return (
    <>
      <div className="grid">
        {(isValidating ? summaryKeys : summaryKeys).map((itemKey, index) => {
          if (isValidating) {
            return (
              <div className="col-12 lg:col-6 xl:col-4" key={`skeleton-${index}`}>
                <SkeletonLoader type="rect" />
              </div>
            )
          }

          const isMoney = itemKey === 'revenue'

          if (!mappedSummary[itemKey]?.current) return null

          return (
            <div className="col-12 lg:col-6 xl:col-4" key={itemKey}>
              <Card
                pt={{
                  root: {
                    style: {
                      border: `1px solid ${
                        (mappedSummary[itemKey]?.growthPercent ?? 0) > 0
                          ? 'var(--green-500)'
                          : 'var(--red-500)'
                      }`,
                      borderRadius: '12px',
                    },
                  },
                }}
              >
                <div className="flex justify-content-between mb-3">
                  <div>
                    <span className="block text-500 font-medium mb-3">{itemKey.toUpperCase()}</span>
                    <div className="text-900 font-medium text-xl">
                      {formatCurrency(Number(mappedSummary[itemKey]?.current), true, isMoney)}
                    </div>
                  </div>
                  <div
                    className="flex align-items-center justify-content-center border-round"
                    style={{ width: '2.5rem', height: '2.5rem' }}
                  >
                    <i className="pi pi-chart-line text-blue-500 text-xl" />
                  </div>
                </div>

                <div className="text-400 font-medium text-sm">
                  {period === 'mtd' ? 'Same Month Last Year' : 'Same Period Last Year'}
                  <span className="ml-2">
                    {formatCurrency(Number(mappedSummary[itemKey]?.last), true, isMoney)}
                  </span>
                </div>

                <span
                  className={`${
                    (mappedSummary[itemKey]?.growthPercent ?? 0) > 0
                      ? 'text-green-500'
                      : 'text-red-500'
                  } font-medium`}
                >
                  {mappedSummary[itemKey]?.growthPercent != null
                    ? `${mappedSummary[itemKey]?.growthPercent?.toFixed(2)} %`
                    : '0.00 %'}

                  {mappedSummary[itemKey]?.diff > 0 ? (
                    <i className="ml-1 pi pi-arrow-up-right text-green-500 text-sm" />
                  ) : (
                    <i className="ml-1 pi pi-arrow-down-right text-red-500 text-sm" />
                  )}
                </span>

                <span className="ml-2 text-500">YoY</span>
              </Card>
            </div>
          )
        })}
      </div>
    </>
  )
}

export default YoySummary
