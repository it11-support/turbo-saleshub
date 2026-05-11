import SkeletonLoader from '../skeleton-loader/SkeletonLoader'
import { IDashboardData } from '@saleshub-tsm/types'
import { TooltipItem } from 'chart.js'
import ChartDataLabels, { Context } from 'chartjs-plugin-datalabels'
import { Card } from 'primereact/card'
import { Chart } from 'primereact/chart'
import { useContext } from 'react'

import { useAuth } from '@/layout/context/AuthContext'
import { LayoutContext } from '@/layout/context/layoutcontext'
import { formatCurrency } from '@/lib/formatter'

type TopPerformingChartProps = {
  isValidating: boolean
  data?: IDashboardData
}
const TopPerformingChart = ({ isValidating, data }: TopPerformingChartProps) => {
  const { slpRevenue, productRevenueDistributor, productRevenueGrocery } = data?.data || {}

  const productRevenueDistributorLabel = productRevenueDistributor?.map((item) => item.ItemName)
  const productRevenueDistributorData = productRevenueDistributor?.map((item) => item.revenue)
  const { isAdmin } = useAuth()
  const { layoutConfig } = useContext(LayoutContext)

  const baseColor = layoutConfig.colorScheme === 'light' ? '#2d353e' : '#f8f9fa'
  const productRevenueGroceryLabel = productRevenueGrocery?.map((item) => item.ItemName)
  const productRevenueGroceryData = productRevenueGrocery?.map((item) => item.revenue)

  const slpRevenueLabel = slpRevenue?.map((item) => item.slp)
  const slpRevenueData = slpRevenue?.map((item) => item.revenue)

  return (
    <div className="grid mt-2">
      {/* 1 */}
      <div className="col-12 lg:col-12 xl:col-6 p-2">
        {isValidating ? (
          <div style={{ height: '500px' }}>
            <SkeletonLoader type="chart-horizontal" />
          </div>
        ) : (
          <Card>
            <div style={{ position: 'relative', width: '100%', height: '500px' }}>
              <Chart
                width="100%"
                height="100%"
                type="bar"
                data={{
                  labels: productRevenueDistributorLabel,
                  datasets: [
                    {
                      data: productRevenueDistributorData,
                      label: 'Top Performing Distributor Product',
                    },
                  ],
                }}
                options={{
                  indexAxis: 'y',
                  maintainAspectRatio: false,
                  plugins: {
                    datalabels: {
                      display: true,
                      color: baseColor,
                      align: 'end',
                      anchor: 'start',
                      clip: false,
                      clamp: true,
                      formatter: (_: number | string, context: Context) => {
                        return context.chart.data.labels?.[context.dataIndex]
                      },
                      font: { size: 10 },
                    },
                    tooltip: {
                      callbacks: {
                        label: function (context: TooltipItem<'bar'>) {
                          return formatCurrency(context.parsed.x, true, true)
                        },
                        title: function (context: TooltipItem<'bar'>[]) {
                          return context[0].label
                        },
                      },
                    },
                  },
                  scales: {
                    x: {
                      ticks: {
                        callback: function (value: string) {
                          return formatCurrency(value, false, true)
                        },
                      },
                    },
                    y: { grid: { display: false }, ticks: { display: false } },
                  },
                }}
                plugins={[ChartDataLabels]}
              />
            </div>
          </Card>
        )}
      </div>

      {/* 2 */}
      <div className="col-12 lg:col-12 xl:col-6 p-2">
        {isValidating ? (
          <div style={{ height: '500px' }}>
            <SkeletonLoader type="chart-horizontal" />
          </div>
        ) : (
          <Card>
            <div style={{ position: 'relative', width: '100%', height: '500px' }}>
              <Chart
                width="100%"
                height="100%"
                type="bar"
                data={{
                  labels: productRevenueGroceryLabel,
                  datasets: [
                    {
                      data: productRevenueGroceryData,
                      label: 'Top Performing Grocery Product',
                    },
                  ],
                }}
                options={{
                  indexAxis: 'y',
                  maintainAspectRatio: false,
                  plugins: {
                    datalabels: {
                      display: true,
                      color: baseColor,
                      align: 'end',
                      anchor: 'start',
                      clip: false,
                      clamp: true,
                      formatter: (_: number | string, context: Context) => {
                        return context.chart.data.labels?.[context.dataIndex]
                      },
                      font: { size: 10 },
                    },
                    tooltip: {
                      callbacks: {
                        label: function (context: TooltipItem<'bar'>) {
                          return formatCurrency(context.parsed.x, true, true)
                        },
                        title: function (context: TooltipItem<'bar'>[]) {
                          return context[0].label
                        },
                      },
                    },
                  },
                  scales: {
                    x: {
                      ticks: {
                        callback: function (value: string) {
                          return formatCurrency(value, false, true)
                        },
                      },
                    },
                    y: { grid: { display: false }, ticks: { display: false } },
                  },
                }}
                plugins={[ChartDataLabels]}
              />
            </div>
          </Card>
        )}
      </div>

      {/* 3 */}
      {isAdmin && (
        <div className="col-12 lg:col-12 xl:col-6 p-2">
          {isValidating ? (
            <div style={{ height: '500px' }}>
              <SkeletonLoader type="chart-horizontal" />
            </div>
          ) : (
            <Card>
              <div style={{ position: 'relative', width: '100%', height: '500px' }}>
                <Chart
                  width="100%"
                  height="100%"
                  type="bar"
                  data={{
                    labels: slpRevenueLabel,
                    datasets: [
                      {
                        data: slpRevenueData,
                        label: 'Top Performing Salesperson',
                        barPercentage: 0.9,
                        categoryPercentage: 0.5,
                      },
                    ],
                  }}
                  options={{
                    indexAxis: 'y',
                    maintainAspectRatio: false,
                    plugins: {
                      datalabels: {
                        display: true,
                        color: baseColor,
                        align: 'end',
                        anchor: 'start',
                        clip: false,
                        clamp: true,
                        formatter: (_: number | string, context: Context) => {
                          return context.chart.data.labels?.[context.dataIndex]
                        },
                        font: { size: 12 },
                      },
                      tooltip: {
                        callbacks: {
                          label: function (context: TooltipItem<'bar'>) {
                            return formatCurrency(context.parsed.x, true, true)
                          },
                          title: function (context: TooltipItem<'bar'>[]) {
                            return context[0].label
                          },
                        },
                      },
                    },
                    scales: {
                      x: {
                        ticks: {
                          callback: function (value: string) {
                            return formatCurrency(value, false, true)
                          },
                        },
                      },
                      y: { grid: { display: false }, ticks: { display: false } },
                    },
                  }}
                  plugins={[ChartDataLabels]}
                />
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}

export default TopPerformingChart
