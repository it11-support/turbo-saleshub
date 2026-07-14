import SkeletonLoader from '../skeleton-loader/SkeletonLoader'
import { TooltipItem } from 'chart.js'
import ChartDataLabels from 'chartjs-plugin-datalabels'
import { Card } from 'primereact/card'
import { Chart } from 'primereact/chart'

import { formatCurrency } from '@/lib/formatter'

interface TopProductChartProps {
  title: string
  labels?: string[]
  values?: number[]
  isLoading: boolean
  baseColor: string
}

const TopProductChart = (props: TopProductChartProps) => {
  const { title, labels, values, isLoading, baseColor } = props
  if (isLoading) {
    return (
      <div style={{ height: '500px' }}>
        <SkeletonLoader type="chart-horizontal" />
      </div>
    )
  }

  return (
    <Card>
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: '500px',
        }}
      >
        <Chart
          width="100%"
          height="100%"
          type="bar"
          data={{
            labels,
            datasets: [
              {
                data: values,
                backgroundColor: 'rgba(59, 130, 246, 0.18)',
                borderColor: '#3B82F6',
                borderWidth: 1,
                borderRadius: 2,
              },
            ],
          }}
          options={{
            indexAxis: 'y',
            maintainAspectRatio: false,
            plugins: {
              legend: {
                display: false,
              },
              title: {
                display: true,
                text: title,
                font: {
                  size: 16,
                  weight: 'bold',
                },
              },
              datalabels: {
                display: true,
                color: baseColor,
                align: 'end',
                anchor: 'start',
                clip: false,
                clamp: true,
                font: {
                  size: 9,
                  weight: 'bold',
                },
                formatter: (_: number | string, context: any) =>
                  context.chart.data.labels?.[context.dataIndex],
              },
              tooltip: {
                callbacks: {
                  label(context: TooltipItem<'bar'>) {
                    return formatCurrency(context.parsed.x, true, true)
                  },
                  title(context: TooltipItem<'bar'>[]) {
                    return context[0].label
                  },
                },
              },
            },
            scales: {
              x: {
                ticks: {
                  callback(value: string) {
                    return formatCurrency(value, false, true)
                  },
                },
              },
              y: {
                grid: {
                  display: false,
                },
                ticks: {
                  display: false,
                },
              },
            },
          }}
          plugins={[ChartDataLabels]}
        />
      </div>
    </Card>
  )
}

export default TopProductChart
