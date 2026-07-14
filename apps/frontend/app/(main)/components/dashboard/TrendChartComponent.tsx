import SkeletonLoader from '../skeleton-loader/SkeletonLoader'
import ChartDataLabels, { Context } from 'chartjs-plugin-datalabels'
import { Chart } from 'primereact/chart'

import { formatCurrency } from '@/lib/formatter'

type TrendChartProps = {
  title: string
  valueType: 'revenue' | 'orders'
  labels: string[]
  datasets: any[]
  orderedChartData: any[]
  max: number
  isValidating: boolean
}

const TrendChartComponent = (props: TrendChartProps) => {
  const { title, valueType, labels, datasets, orderedChartData, max, isValidating } = props

  if (isValidating) {
    return (
      <div style={{ height: '500px' }}>
        <SkeletonLoader type="chart-horizontal" />
      </div>
    )
  }

  return (
    <Chart
      type="line"
      data={{
        labels,
        datasets,
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
            text: title,
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
              title: (ctx: Context[]) => labels[ctx[0].dataIndex],

              label: (ctx: Context) => {
                const item = orderedChartData[ctx.dataIndex]
                const year = item.yearKeys[ctx.datasetIndex]
                const value =
                  valueType === 'revenue' ? item.years[year].revenue : item.years[year].orders

                return valueType === 'revenue'
                  ? `${year}: ${formatCurrency(value, true, true)}`
                  : `${year}: ${value.toLocaleString()} Orders`
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

              const current =
                valueType === 'revenue'
                  ? item.years[currentYear].revenue
                  : item.years[currentYear].orders

              const previous =
                valueType === 'revenue'
                  ? item.years[previousYear].revenue
                  : item.years[previousYear].orders

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
            max,
            beginAtZero: true,
            grid: {
              display: true,
            },
            ticks: {
              callback: (value: string | number) => {
                return valueType === 'revenue'
                  ? formatCurrency(Number(value), false, true)
                  : formatCurrency(Number(value), false, false)
              },
            },
          },
        },
      }}
      style={{ width: '100%', height: '350px' }}
      plugins={[ChartDataLabels]}
    />
  )
}

export default TrendChartComponent
