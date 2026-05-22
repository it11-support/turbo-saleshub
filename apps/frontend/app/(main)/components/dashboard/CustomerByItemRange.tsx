import SkeletonLoader from '../skeleton-loader/SkeletonLoader'
import { Card } from 'primereact/card'
import { Chart } from 'primereact/chart'

type CustomerByItemRangeProp = {
  customersByRangeItem?: {
    period: string
    category: string
    customers: number
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
        <h3 className="m-0">Customers By Item Range</h3>
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
