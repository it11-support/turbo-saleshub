import TrendChartComponent from './TrendChartComponent'
import { IDashboardData, ITrendData } from '@saleshub-tsm/types'
import dayjs from 'dayjs'

import { MONTH_SHORT } from '@/lib/constants'

type TrendChartProps = {
  isValidating: boolean
  data?: IDashboardData['data']
}

const TrendChart = ({ isValidating, data }: TrendChartProps) => {
  const { monthlyTrends } = data || {}

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

  const trendLabels = orderedChartData.map((x) => MONTH_SHORT[x.month - 1])

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

  const charts = [
    {
      title: 'Revenue Trend',
      valueType: 'revenue' as const,
      labels: trendLabels,
      datasets: revenueDatasets,
      orderedChartData: orderedChartData,
      max: revenueMax,
    },
    {
      title: 'Order Trend',
      valueType: 'orders' as const,
      labels: trendLabels,
      datasets: orderDatasets,
      orderedChartData: orderedChartData,
      max: orderMax,
    },
  ]

  return (
    <div className="grid mt-4 ">
      {charts.map((chart) => (
        <div key={chart.title} className="col-12 lg:col-12 xl:col-6 p-2">
          <TrendChartComponent
            title={chart.title}
            valueType={chart.valueType}
            labels={trendLabels}
            datasets={chart.datasets}
            orderedChartData={orderedChartData}
            max={chart.max}
            isValidating={isValidating}
          />
        </div>
      ))}
    </div>
  )
}

export default TrendChart
