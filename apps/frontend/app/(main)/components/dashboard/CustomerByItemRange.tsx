import SkeletonLoader from '../skeleton-loader/SkeletonLoader'
import { ChartDataset, TooltipItem } from 'chart.js'
import { Card } from 'primereact/card'
import { Chart } from 'primereact/chart'

import { formatCurrency } from '@/lib/formatter'

interface CustomBarDataset extends ChartDataset<'bar', number[]> {
  revenueData?: number[]
}

type CustomerByItemRangeProp = {
  customersByRangeItem?: {
    period: string
    category: string
    customers: number
    revenue: number
  }[]
  isValidating: boolean
}

const CustomerByItemRange = (props: CustomerByItemRangeProp) => {
  const { customersByRangeItem, isValidating } = props

  const categoryLabel = [
    '01-10',
    '11-20',
    '21-30',
    '31-40',
    '41-50',
    '51-60',
    '61-70',
    '71-80',
    '81-90',
    '91-100',
    '>100',
  ]

  const labels = [...new Set(customersByRangeItem?.map((item) => item.period))]

  const datasets = categoryLabel.map((category) => ({
    label: category,

    data: labels.map((period) => {
      const found = customersByRangeItem?.find(
        (item) => item.period === period && item.category === category
      )

      return found?.customers ?? 0
    }),

    revenueData: labels.map((period) => {
      const found = customersByRangeItem?.find(
        (item) => item.period === period && item.category === category
      )
      return found?.revenue ?? 0
    }),

    borderWidth: 1,
  }))

  const chartData = {
    labels,
    datasets,
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,

    interaction: {
      mode: 'index',
      intersect: false,
    },

    plugins: {
      legend: {
        position: 'bottom',
      },

      tooltip: {
        mode: 'index',
        intersect: false,
        callbacks: {
          label: function (context: TooltipItem<'bar'>) {
            // PERUBAHAN: Hapus tanda [] agar menjadi objek tunggal
            let label = context.dataset.label || ''
            if (label) {
              label += ' '
            }

            // Ambil data y (customers)
            const customersCount = context.parsed.y

            // Ambil data revenue dari custom property dataset Anda
            const dataset = context.dataset as CustomBarDataset
            const revenueAmount = dataset.revenueData?.[context.dataIndex] || 0

            const formattedRevenue = formatCurrency(revenueAmount, true, true)

            // Menggunakan padEnd dengan spasi karakter manual agar terhitung di canvas
            return [`${label}: (${customersCount} Customers)`, `${formattedRevenue}`]
          },

          title: function (context: TooltipItem<'bar'>[]) {
            const rawDate = context[0].label

            // Ubah menjadi objek Date
            const date = new Date(rawDate + '-01')

            // Format menjadi nama bulan bahasa Indonesia
            return date.toLocaleDateString('en-EN', {
              month: 'long',
              year: 'numeric',
            })
          },
        },
        bodySpacing: 4,
      },
    },

    scales: {
      x: {
        stacked: true,
      },

      y: {
        stacked: true,
        beginAtZero: true,
        title: {
          display: true,
          text: 'Customers',
        },
      },
    },
  }

  const headerTitle = (
    <div className="flex align-items-center justify-content-between flex-wrap">
      <div>
        <h2 className="text-2xl font-bold">Customers By Item Range</h2>
        <small className="text-color-secondary">
          Display customer count by item range and period
        </small>
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
                    borderRadius: '12px',
                    height: '600px',
                    padding: '1rem',
                  },
                },
                body: {
                  style: {
                    height: '100%',
                    paddingBottom: '2rem',
                  },
                },
                content: {
                  style: {
                    height: '100%',
                  },
                },
              }}
            >
              <div className="w-full h-full">
                <Chart
                  type="bar"
                  data={chartData}
                  options={{
                    ...chartOptions,
                    responsive: true,
                    maintainAspectRatio: false,
                  }}
                  pt={{
                    canvas: {
                      style: {
                        height: '100%',
                        width: '100%',
                      },
                    },
                  }}
                  className="h-full"
                />
              </div>
            </Card>
          </div>
        )}
      </div>
    </>
  )
}

export default CustomerByItemRange
