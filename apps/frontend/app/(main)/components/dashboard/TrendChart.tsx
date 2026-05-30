import SkeletonLoader from '../skeleton-loader/SkeletonLoader'
import { IDashboardData } from '@saleshub-tsm/types'
import { TooltipItem } from 'chart.js'
import { Card } from 'primereact/card'
import { Chart } from 'primereact/chart'
import React from 'react'

import { formatCurrency } from '@/lib/formatter'

type TrendChartProps = {
  isValidating: boolean
  data?: IDashboardData
}
const TrendChart = ({ isValidating, data }: TrendChartProps) => {
  const { monthlyTrend } = data?.data || {}

  const trendLabel = monthlyTrend?.map(
    (item) => `${item.year}-${item.month.toString().padStart(2, '0')}`
  )
  const revenueData = monthlyTrend?.map((item) => item.revenue)
  const customerData = monthlyTrend?.map((item) => item.customers)
  const trendData = monthlyTrend?.map((item) => item.orders)

  return (
    <div className="grid mt-4 ">
      {isValidating ? (
        <div className="col-12 lg:col-12 xl:col-6">
          <SkeletonLoader type="chart-vertical" />
        </div>
      ) : (
        <div className="col-12 lg:col-12 xl:col-6">
          <Card>
            <Chart
              type="bar"
              data={{
                labels: trendLabel,
                datasets: [{ data: revenueData, label: 'Revenue Trend' }],
              }}
              options={{
                plugins: {
                  tooltip: {
                    callbacks: {
                      label: function (context: TooltipItem<'bar'>) {
                        return formatCurrency(context.parsed.y, true, true)
                      },
                      title: function (context: TooltipItem<'bar'>[]) {
                        const rawX = context[0]?.parsed?.x
                        if (rawX === undefined || rawX === null) return ''

                        const date = new Date(rawX)
                        return date.toLocaleString('en-US', { month: 'short', year: 'numeric' })
                      },
                    },
                  },
                },
                scales: {
                  x: {
                    grid: {
                      display: false,
                    },
                    type: 'time',
                    time: {
                      unit: 'month',
                      displayFormats: {
                        month: 'MMM yyyy',
                      },
                    },
                  },
                  y: {
                    grid: {
                      display: false,
                    },
                    ticks: {
                      callback: function (value: string) {
                        return formatCurrency(value, false, true)
                      },
                    },
                  },
                },
              }}
            />
          </Card>
        </div>
      )}

      {isValidating ? (
        <div className="col-12 lg:col-12 xl:col-6">
          <SkeletonLoader type="chart-vertical" />
        </div>
      ) : (
        <div className="col-12 lg:col-12 xl:col-6">
          <Card>
            <Chart
              type="bar"
              data={{
                labels: trendLabel,
                datasets: [{ data: trendData, label: 'Order Trend' }],
              }}
              options={{
                plugins: {
                  tooltip: {
                    callbacks: {
                      label: function (context: TooltipItem<'bar'>) {
                        return formatCurrency(context.parsed.y, true, false)
                      },
                      title: function (context: TooltipItem<'bar'>[]) {
                        const rawX = context[0]?.parsed?.x
                        if (rawX === undefined || rawX === null) return ''
                        const date = new Date(rawX)
                        return date.toLocaleString('en-US', { month: 'short', year: 'numeric' })
                      },
                    },
                  },
                },
                scales: {
                  x: {
                    grid: {
                      display: false,
                    },
                    type: 'time',
                    time: {
                      unit: 'month',
                      displayFormats: {
                        month: 'MMM yyyy',
                      },
                    },
                  },
                  y: {
                    grid: {
                      display: false,
                    },
                    ticks: {
                      callback: function (value: string) {
                        return formatCurrency(value, false, false)
                      },
                    },
                  },
                },
              }}
            />
          </Card>
        </div>
      )}

      {isValidating ? (
        <div className="col-12 lg:col-12 xl:col-6">
          <SkeletonLoader type="chart-vertical" />
        </div>
      ) : (
        <div className="col-12 lg:col-12 xl:col-6">
          <Card>
            <Chart
              type="bar"
              data={{
                labels: trendLabel,
                datasets: [{ data: customerData, label: 'Customer Trend' }],
              }}
              options={{
                plugins: {
                  tooltip: {
                    callbacks: {
                      label: function (context: TooltipItem<'bar'>) {
                        return formatCurrency(context.parsed.y, true, false)
                      },
                      title: function (context: TooltipItem<'bar'>[]) {
                        const rawX = context[0]?.parsed?.x
                        if (rawX === undefined || rawX === null) return ''
                        const date = new Date(rawX)
                        return date.toLocaleString('en-US', { month: 'short', year: 'numeric' })
                      },
                    },
                  },
                },
                scales: {
                  x: {
                    grid: {
                      display: false,
                    },
                    type: 'time',
                    time: {
                      unit: 'month',
                      displayFormats: {
                        month: 'MMM yyyy',
                      },
                    },
                  },
                  y: {
                    grid: {
                      display: false,
                    },
                    ticks: {
                      callback: function (value: string) {
                        return formatCurrency(value, false, false)
                      },
                    },
                  },
                },
              }}
            />
          </Card>
        </div>
      )}
    </div>
  )
}

export default TrendChart
