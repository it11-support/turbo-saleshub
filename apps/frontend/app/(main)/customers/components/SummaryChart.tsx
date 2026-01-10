'use client'

import { TooltipItem } from 'chart.js'
import { Chart } from 'primereact/chart'

import useIsMobile from '@/layout/mobile/useIsMobile'
import { formatCurrency } from '@/lib/formatter'

type SummaryChartProps = {
  summary: {
    month: string
    totalSales: number
    activeItems: number
  }[]
}

const SummaryChart = (props: SummaryChartProps) => {
  const { summary } = props
  const isMobile = useIsMobile(768)
  const labels = summary.map((s) => s.month)
  const totalSales = summary.map((s) => s.totalSales)
  const activeItems = summary.map((s) => s.activeItems)

  const data = {
    labels,
    datasets: [
      {
        label: 'Active Items',
        type: 'line',
        borderColor: 'orange',
        backgroundColor: 'orange',
        data: activeItems,
        yAxisID: 'y2',
        tension: 0.3,
        fill: false,
      },
      {
        label: 'Total Sales',
        data: totalSales,
        backgroundColor: '#42A5F5',
        yAxisID: 'y1',
        barThickness: isMobile ? 20 : 30,
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y1: {
        type: 'linear',
        position: 'left',
        title: {
          display: true,
          text: 'Total Sales',
        },
        ticks: {
          callback: function (value: number) {
            return formatCurrency(value, true, true)
          },
        },
      },
      y2: {
        type: 'linear',
        position: 'right',
        title: {
          display: true,
          text: 'Active Items',
        },
        grid: {
          drawOnChartArea: false,
        },
        suggestedMin: 0,
        suggestedMax: Math.max(...activeItems) + 5,
      },
    },
    plugins: {
      tooltip: {
        callbacks: {
          label: function (context: TooltipItem<'line'>) {
            const datasetLabel = context.dataset.label || ''

            const parsedValue = context.parsed.y

            if (datasetLabel === 'Total Sales') {
              return `${datasetLabel}: ${formatCurrency(parsedValue, true, true)}`
            }

            return `${datasetLabel}: ${parsedValue}`
          },
        },
      },
    },
  }

  if (labels.length > 0) {
    return (
      <div className="sm:col-12 md:col-12 xl:col-6 mb-5">
        <Chart type="bar" data={data} options={options} className="w-[50vw]" height="400px" />
      </div>
    )
  }
}

export default SummaryChart
