import SkeletonLoader from '../skeleton-loader/SkeletonLoader'
import { IDashboardData, ITrendData } from '@saleshub-tsm/types'
import { Context } from 'chartjs-plugin-datalabels'
import ChartDataLabels from 'chartjs-plugin-datalabels'
import dayjs from 'dayjs'
import { Card } from 'primereact/card'
import { Chart } from 'primereact/chart'

import { formatCurrency } from '@/lib/formatter'

type TrendChartProps = {
  isValidating: boolean
  data?: IDashboardData
}

const monthNames = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
]

const TrendChart = ({ isValidating, data }: TrendChartProps) => {
  const { monthlyTrends } = data?.data || {}

  const chartData =
    monthlyTrends?.map((item: any) => {
      const month = Number(Object.keys(item)[0])
      const years = Object.values(item)[0] as Record<number, ITrendData>

      return {
        month,
        yearKeys: Object.keys(years)
          .map(Number)
          .sort((a, b) => a - b),
        years,
      }
    }) ?? []

  const currentMonth = dayjs().month() + 1

  const startIndex = chartData.findIndex((x) => x.month === (currentMonth % 12) + 1)

  const orderedChartData =
    startIndex >= 0
      ? [...chartData.slice(startIndex), ...chartData.slice(0, startIndex)]
      : chartData

  const trendLabels = orderedChartData.map((x) => monthNames[x.month - 1])

  const chartSeries = [0, 1].map((datasetIndex) => {
    const revenue: number[] = []
    const orders: number[] = []

    orderedChartData.forEach((item) => {
      const year = item.yearKeys[datasetIndex]

      revenue.push(year ? item.years[year].revenue : 0)
      orders.push(year ? item.years[year].orders : 0)
    })

    return {
      label: datasetIndex === 0 ? 'Previous' : 'Current',
      year: orderedChartData[0]?.yearKeys[datasetIndex],

      borderColor: datasetIndex === 0 ? '#2563EB' : '#22C55E',
      backgroundColor: datasetIndex === 0 ? 'rgba(37,99,235,.15)' : 'rgba(34,197,94,.15)',

      revenue,
      orders,
    }
  })

  const revenueDatasets = chartSeries.map((item) => ({
    label: String(item.year),
    data: item.revenue,
    borderColor: item.borderColor,
    backgroundColor: item.backgroundColor,
    fill: true,
    tension: 0.4,
    cubicInterpolationMode: 'monotone',
    borderWidth: 3,
    pointRadius: 3,
    pointHoverRadius: 5,
    pointBorderWidth: 2,
    pointBackgroundColor: item.borderColor,
  }))

  const orderDatasets = chartSeries.map((item) => ({
    label: String(item.year),
    data: item.orders,
    borderColor: item.borderColor,
    backgroundColor: item.backgroundColor,
    fill: true,
    tension: 0.4,
    cubicInterpolationMode: 'monotone',
    borderWidth: 3,
    pointRadius: 3,
    pointHoverRadius: 5,
    pointBorderWidth: 2,
    pointBackgroundColor: item.borderColor,
  }))

  const revenueValues = chartSeries.flatMap((x) => x.revenue)
  const orderValues = chartSeries.flatMap((x) => x.orders)

  const revenueMax = Math.ceil(Math.max(...revenueValues) / 1_000_000_000) * 1_000_000_000

  const orderMax = Math.ceil(Math.max(...orderValues) / 1000) * 1000

  return (
    <div className="grid mt-4 ">
      {isValidating ? (
        <div className="col-12 lg:col-12 xl:col-6">
          <SkeletonLoader type="chart-vertical" />
        </div>
      ) : (
        <div className="col-12 lg:col-12 xl:col-6">
          <Card>
            <div>
              <Chart
                type="line"
                data={{
                  labels: trendLabels,
                  datasets: revenueDatasets,
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  animation: {
                    duration: 800,
                    easing: 'easeOutQuart',
                  },
                  elements: {
                    line: {
                      tension: 0.4,
                    },
                  },
                  interaction: {
                    mode: 'index',
                    intersect: false,
                  },
                  plugins: {
                    title: {
                      display: true,
                      text: 'Revenue Trend',
                      font: {
                        size: 16,
                        weight: 'bold',
                      },
                    },
                    subtitle: {
                      display: true,
                      text: 'YoY Growth (vs Same Month Previous Year)',
                      color: '#64748B',
                      font: {
                        size: 11,
                      },
                      padding: {
                        bottom: 10,
                      },
                    },

                    legend: {
                      display: false,
                    },
                    tooltip: {
                      callbacks: {
                        title: (ctx: Context[]) => trendLabels[ctx[0].dataIndex],

                        label: (ctx: Context) => {
                          const item = orderedChartData[ctx.dataIndex]
                          const year = item.yearKeys[ctx.datasetIndex]

                          return `${year}: ${formatCurrency(item.years[year].revenue, true, true)}`
                        },
                      },
                    },
                    datalabels: {
                      display: (ctx: Context) => ctx.datasetIndex > 0,
                      align: 'bottom',
                      anchor: 'end',
                      offset: 25,
                      font: {
                        size: 10,
                        weight: 'bold',
                      },
                      color: (ctx: Context) => {
                        const item = orderedChartData[ctx.dataIndex]

                        const currentYear = item.yearKeys[ctx.datasetIndex]
                        const previousYear = item.yearKeys[ctx.datasetIndex - 1]

                        if (!previousYear) return '#6B7280'

                        const current = item.years[currentYear].revenue
                        const previous = item.years[previousYear].revenue

                        const growth = ((current - previous) / previous) * 100

                        return growth >= 0 ? '#16A34A' : '#DC2626'
                      },
                      formatter: (_: number, ctx: Context) => {
                        const item = orderedChartData[ctx.dataIndex]

                        const currentYear = item.yearKeys[ctx.datasetIndex]
                        const previousYear = item.yearKeys[ctx.datasetIndex - 1]

                        if (!previousYear) return ''

                        const current = item.years[currentYear].revenue
                        const previous = item.years[previousYear].revenue

                        if (!previous) return ''

                        const growth = ((current - previous) / previous) * 100

                        const arrow = growth >= 0 ? '▲' : '▼'

                        return `${arrow} ${Math.abs(growth).toFixed(1)}%`
                      },
                    },
                  },

                  scales: {
                    x: {
                      stacked: false,
                      grid: {
                        display: false,
                      },
                      ticks: {
                        autoSkip: false,
                      },
                      categoryPercentage: 0.7,
                      barPercentage: 0.9,
                    },
                    y: {
                      min: 0,
                      max: revenueMax,
                      beginAtZero: true,
                      grid: {
                        display: true,
                      },
                      ticks: {
                        callback: (value: string | number) =>
                          formatCurrency(Number(value), false, true),
                      },
                    },
                  },
                }}
                style={{ width: '100%', height: '350px' }}
                plugins={[ChartDataLabels]}
              />
            </div>
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
            <div>
              <Chart
                type="line"
                data={{
                  labels: trendLabels,
                  datasets: orderDatasets,
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  animation: {
                    duration: 800,
                    easing: 'easeOutQuart',
                  },
                  elements: {
                    line: {
                      tension: 0.4,
                    },
                  },
                  interaction: {
                    mode: 'index',
                    intersect: false,
                  },
                  plugins: {
                    title: {
                      display: true,
                      text: 'Order Trend',
                      font: {
                        size: 16,
                        weight: 'bold',
                      },
                    },
                    subtitle: {
                      display: true,
                      text: 'YoY Growth (vs Same Month Previous Year)',
                      color: '#64748B',
                      font: {
                        size: 11,
                      },
                      padding: {
                        bottom: 10,
                      },
                    },
                    legend: {
                      display: false,
                    },
                    tooltip: {
                      callbacks: {
                        title: (ctx: Context[]) => trendLabels[ctx[0].dataIndex],

                        label: (ctx: Context) => {
                          const item = orderedChartData[ctx.dataIndex]
                          const year = item.yearKeys[ctx.datasetIndex]

                          return `${year}: ${item.years[year].orders.toLocaleString()} Orders`
                        },
                      },
                    },
                    datalabels: {
                      display: (ctx: Context) => ctx.datasetIndex > 0,
                      align: 'bottom',
                      anchor: 'end',
                      offset: 25,
                      font: {
                        size: 10,
                        weight: 'bold',
                      },
                      color: (ctx: Context) => {
                        const item = orderedChartData[ctx.dataIndex]

                        const currentYear = item.yearKeys[ctx.datasetIndex]
                        const previousYear = item.yearKeys[ctx.datasetIndex - 1]

                        if (!previousYear) return '#6B7280'

                        const current = item.years[currentYear].orders
                        const previous = item.years[previousYear].orders

                        if (previous <= 0) return '#6B7280'

                        const growth = ((current - previous) / previous) * 100

                        return growth >= 0 ? '#16A34A' : '#DC2626'
                      },
                      formatter: (_: number, ctx: Context) => {
                        const item = orderedChartData[ctx.dataIndex]

                        const currentYear = item.yearKeys[ctx.datasetIndex]
                        const previousYear = item.yearKeys[ctx.datasetIndex - 1]

                        if (!previousYear) return ''

                        const current = item.years[currentYear].orders
                        const previous = item.years[previousYear].orders

                        if (previous <= 0) return ''

                        const growth = ((current - previous) / previous) * 100

                        return `${growth >= 0 ? '▲' : '▼'} ${Math.abs(growth).toFixed(1)}%`
                      },
                    },
                  },

                  scales: {
                    x: {
                      stacked: false,
                      grid: {
                        display: false,
                      },
                      ticks: {
                        autoSkip: false,
                      },
                      categoryPercentage: 0.7,
                      barPercentage: 0.9,
                    },
                    y: {
                      min: 0,
                      max: orderMax,
                      beginAtZero: true,
                      grid: {
                        display: true,
                      },
                      ticks: {
                        callback: (value: string | number) =>
                          formatCurrency(Number(value), false, false),
                      },
                    },
                  },
                }}
                style={{ width: '100%', height: '350px' }}
                plugins={[ChartDataLabels]}
              />
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}

export default TrendChart
