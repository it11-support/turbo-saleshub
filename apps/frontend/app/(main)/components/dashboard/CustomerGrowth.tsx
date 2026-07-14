import SkeletonLoader from '../skeleton-loader/SkeletonLoader'
import { IDashboardData } from '@saleshub-tsm/types'
import { TooltipItem } from 'chart.js'
import { Context } from 'chartjs-plugin-datalabels'
import ChartDataLabels from 'chartjs-plugin-datalabels'
import { Card } from 'primereact/card'
import { Chart } from 'primereact/chart'

type CustomerGrowthProps = {
  isValidating: boolean
  customerTrendData?: IDashboardData
}
const CustomerGrowth = (props: CustomerGrowthProps) => {
  const { isValidating, customerTrendData } = props

  console.log('customerTrendData', customerTrendData)
  const customerTrend = customerTrendData?.data?.customerTrend

  const yearly = customerTrend?.yearly || {}
  const monthly = customerTrend?.monthly || {}
  const MONTHS = [
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

  const years = Object.keys(monthly).sort()
  const latestYear = years[years.length - 1]
  const previousYear = years[years.length - 2]

  // bulan terakhir yang ada di tahun berjalan
  const latestMonth = Math.max(...Object.keys(monthly[latestYear] ?? {}).map(Number))

  const timeline = MONTHS.slice(0, latestMonth).map((monthName, index) => {
    const monthKey = String(index + 1)

    return {
      label: monthName,
      previous: monthly[previousYear]?.[monthKey] ?? null,
      current: monthly[latestYear]?.[monthKey] ?? null,
    }
  })

  const existingData = timeline.map((i) => i.current?.existing ?? 0)
  const existingMax = Math.max(...existingData)
  const existingPadding = Math.max(1, Math.ceil(existingMax * 0.05))

  const chartDataMonthly = {
    labels: timeline.map((i) => i.label),
    datasets: [
      {
        label: `${latestYear} Existing`,
        data: timeline.map((i) => i.current?.existing ?? null),
        borderColor: '#F97316',
        backgroundColor: 'transparent',
        pointBackgroundColor: '#F97316',
        borderDash: [6, 6],
        borderWidth: 3,
        tension: 0.4,
        yAxisID: 'y',
      },
      {
        label: `${latestYear} NOO`,
        data: timeline.map((i) => i.current?.noo ?? null),
        borderColor: '#22C55E',
        backgroundColor: 'transparent',
        pointBackgroundColor: '#22C55E',
        borderDash: [],
        borderWidth: 2,
        tension: 0.35,
        yAxisID: 'y1',
        spanGaps: false,
      },
    ],
  }

  const chartOptionsMonthly = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    layout: {
      padding: {
        top: 20,
      },
    },
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          usePointStyle: true,
          pointStyle: 'line',
        },
      },
      tooltip: {
        callbacks: {
          title: (ctx: TooltipItem<'line'>[]) => {
            return timeline[ctx[0].dataIndex].label
          },

          label: (ctx: TooltipItem<'line'>) => {
            const item = timeline[ctx.dataIndex]

            if (!item) return ''

            const isExisting = ctx.dataset.label?.includes('Existing')

            if (isExisting) {
              const current = item.current?.existing ?? 0
              const previous = item.previous?.existing ?? 0
              return [
                `${latestYear} Existing : ${current.toLocaleString()}`,
                `${previousYear} Existing : ${previous.toLocaleString()}`,
              ]
            }

            const current = item.current?.noo ?? 0
            const previous = item.previous?.noo ?? 0

            return [
              `${latestYear} NOO : ${current.toLocaleString()}`,
              `${previousYear} NOO : ${previous.toLocaleString()}`,
            ]
          },

          footer: (ctx: TooltipItem<'line'>[]) => {
            const item = timeline[ctx[0].dataIndex]

            if (!item?.current || !item?.previous) return []

            const currentTotal = item.current.existing + item.current.noo
            const previousTotal = item.previous.existing + item.previous.noo

            const growth =
              previousTotal > 0 ? ((currentTotal - previousTotal) / previousTotal) * 100 : 0

            const arrow = growth >= 0 ? '▲' : '▼'

            return [
              '────────────────────',
              `${previousYear} Total : ${previousTotal.toLocaleString()}`,
              `${latestYear} Total : ${currentTotal.toLocaleString()}`,
              `YoY : ${arrow} ${Math.abs(growth).toFixed(1)}%`,
            ]
          },
        },
      },
      datalabels: {
        display: (ctx: Context) => ctx.datasetIndex >= 0,
        align: (ctx: Context) => (ctx.datasetIndex === 0 ? 'top' : 'bottom'),
        anchor: 'end',
        offset: -25,
        font: {
          size: 9,
          weight: 'bold',
        },
        color: (ctx: Context) => {
          const isExisting = ctx.datasetIndex === 0
          const item = timeline[ctx.dataIndex]

          if (!item?.current || !item?.previous) return '#6B7280'

          const current = isExisting ? item.current.existing : item.current.noo
          const previous = isExisting ? item.previous.existing : item.previous.noo

          if (!previous) return '#6B7280'

          const growth = ((current - previous) / previous) * 100

          return growth >= 0 ? '#22C55E' : '#EF4444'
        },
        formatter: (_: number, ctx: Context) => {
          const isExisting = ctx.datasetIndex === 0
          const item = timeline[ctx.dataIndex]

          if (!item?.current || !item?.previous) return ''

          const current = isExisting ? item.current.existing : item.current.noo
          const previous = isExisting ? item.previous.existing : item.previous.noo

          if (!previous) return ''

          const growth = ((current - previous) / previous) * 100
          const arrow = growth >= 0 ? '▲' : '▼'
          const label = isExisting ? 'Existing' : 'NOO'

          return `${arrow} ${Math.abs(growth).toFixed(1)}% (${label})`
        },
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
      },
      y: {
        position: 'left',
        title: {
          display: true,
          text: 'Existing Customers',
        },
        max: existingMax + existingPadding,
        ticks: {
          callback: (value: string | number) => Number(value).toLocaleString(),
        },
      },
      y1: {
        position: 'right',
        beginAtZero: true,
        grid: {
          drawOnChartArea: false,
        },
        title: {
          display: true,
          text: 'NOO',
        },
      },
    },
  }

  const yearKeys = Object.keys(yearly).sort()

  const chartDataYearly = {
    labels: yearKeys,
    datasets: [
      {
        label: 'Existing Customers',
        data: yearKeys.map((yr) => yearly[yr].existing),
        borderColor: '#F97316',
        backgroundColor: 'rgba(249, 115, 22, 0.1)',
        borderDash: [6, 6],
        borderWidth: 3,
        tension: 0.4,
        fill: true,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointBackgroundColor: '#F97316',
        yAxisID: 'y',
      },
      {
        label: 'NOO',
        data: yearKeys.map((yr) => yearly[yr].noo),
        borderColor: '#22C55E',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        borderWidth: 3,
        tension: 0.4,
        fill: true,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointBackgroundColor: '#22C55E',
        yAxisID: 'y1',
      },
    ],
  }

  const chartOptionsYearly = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          usePointStyle: false,
        },
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        callbacks: {
          label: (ctx: TooltipItem<'line'>) => {
            const value = Number(ctx.raw)
            return `${ctx.dataset.label}: ${value.toLocaleString()}`
          },
          footer: (items: TooltipItem<'line'>[]) => {
            const total = items.reduce((sum, item) => sum + Number(item.raw), 0)
            return `Total Customers: ${total.toLocaleString()}`
          },
        },
      },
      datalabels: {
        display: (ctx: Context) => ctx.dataIndex > 0,

        align: (ctx: Context) => (ctx.dataset.label === 'Existing Customers' ? 'top' : 'bottom'),

        anchor: (ctx: Context) => (ctx.dataset.label === 'Existing Customers' ? 'start' : 'end'),

        offset: -15,

        font: {
          size: 9,
          weight: 'bold',
        },

        color: (ctx: Context) => {
          const current = Number(ctx.dataset.data[ctx.dataIndex])
          const previous = Number(ctx.dataset.data[ctx.dataIndex - 1])

          if (previous <= 0) return '#6B7280'

          const growth = ((current - previous) / previous) * 100

          return growth >= 0 ? '#16A34A' : '#DC2626'
        },

        formatter: (_: number, ctx: Context) => {
          const current = Number(ctx.dataset.data[ctx.dataIndex])
          const previous = Number(ctx.dataset.data[ctx.dataIndex - 1])

          if (previous <= 0) return ''

          const growth = ((current - previous) / previous) * 100

          const label = ctx.dataset.label === 'Existing Customers' ? 'Existing' : 'NOO'

          return `${growth >= 0 ? '▲' : '▼'} ${Math.abs(growth).toFixed(1)}% (${label})`
        },
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
      },
      y: {
        position: 'left',
        title: {
          display: true,
          text: 'Existing Customers',
        },
        max: Math.ceil(yearKeys.reduce((max, yr) => Math.max(max, yearly[yr].existing), 0) * 1.05),
        ticks: {
          callback: (value: string | number) => Number(value).toLocaleString(),
        },
      },
      y1: {
        position: 'right',
        beginAtZero: true,
        grid: {
          drawOnChartArea: false,
        },
        max: Math.ceil(yearKeys.reduce((max, yr) => Math.max(max, yearly[yr].noo), 0) * 1.05),
        title: {
          display: true,
          text: 'NOO',
        },
      },
    },
  }

  const headerTitle = (
    <div className="flex align-items-center justify-content-between flex-wrap">
      <div>
        <h2 className="text-2xl font-bold">Customer Growth</h2>
      </div>
    </div>
  )

  return (
    <>
      <div className="mt-2">
        {isValidating ? (
          <div className="col-12 flex flex-column px-0 gap-3">
            <SkeletonLoader type="rect" />
            <SkeletonLoader type="chart-horizontal" />
          </div>
        ) : (
          <div className="col-12 p-0 my-4">
            <Card
              header={headerTitle}
              pt={{
                root: {
                  style: {
                    borderRadius: '4px',
                    // height: '450px',
                    padding: '1rem',
                  },
                },
                body: {
                  style: {
                    height: '100%',
                    padding: '0.5rem',
                    paddingBottom: '2rem',
                  },
                },
                content: {
                  style: {
                    padding: '0.5rem',
                    height: '100%',
                  },
                },
              }}
            >
              <div className="grid">
                <div className="col-12 xl:col-4 px-2">
                  <Chart
                    type="line"
                    data={chartDataYearly}
                    options={chartOptionsYearly}
                    style={{ height: '350px' }}
                    plugins={[ChartDataLabels]}
                  />
                </div>

                <div className="col-12 xl:col-8 px-2">
                  <Chart
                    type="line"
                    data={chartDataMonthly}
                    options={chartOptionsMonthly}
                    style={{ height: '350px' }}
                    plugins={[ChartDataLabels]}
                  />
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </>
  )
}

export default CustomerGrowth
