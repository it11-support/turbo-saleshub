import SkeletonLoader from '../skeleton-loader/SkeletonLoader'
import { IDashboardData } from '@saleshub-tsm/types'
import ChartDataLabels from 'chartjs-plugin-datalabels'
import { Card } from 'primereact/card'
import { Chart as PrimeChart } from 'primereact/chart'
import { useContext } from 'react'

import { LayoutContext } from '@/layout/context/layoutcontext'
import { formatCurrency } from '@/lib/formatter'

type RevenueByCategoryProps = {
  revenueByCategoryData?: IDashboardData
  period: 'mtd' | 'ytd'
  isValidating?: boolean
}
const RevenueByProductCategory = ({
  revenueByCategoryData,
  period,
  isValidating,
}: RevenueByCategoryProps) => {
  const { layoutConfig } = useContext(LayoutContext)

  const revenueByCategory = revenueByCategoryData?.data.revenueByCategory
  const baseColor = layoutConfig.colorScheme === 'light' ? '#2d353e' : '#f8f9fa'

  const sorted = [...(revenueByCategory ?? [])].sort((a, b) => {
    if (a.category === 'GROCERIES') return -1
    if (b.category === 'GROCERIES') return 1

    return b[period] - a[period]
  })
  const total = sorted.reduce((acc, item) => acc + item[period], 0)
  const chartData = {
    labels: sorted.map((item) =>
      item.category === 'GROCERIES' ? 'NON DIST. PRODUCT' : item.category
    ),
    datasets: [
      {
        data: sorted.map((item) => item[period]),
        backgroundColor: 'rgba(59, 130, 246, 0.18)',
        borderColor: '#3B82F6',
        borderWidth: 1,
        borderRadius: 2,
      },
    ],
  }
  const options = {
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      datalabels: {
        color: baseColor,
        display: true,
        align: 'end',
        anchor: 'start',
        clip: false,
        clamp: true,
        formatter: (value: number) => {
          const contribution = (value / total) * 100
          return `${formatCurrency(value)} (${contribution.toFixed(1)}%)`
        },
        font: { size: 11, weight: 'bold' },
      },
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: (ctx: any) =>
            new Intl.NumberFormat('id-ID', {
              style: 'currency',
              currency: 'IDR',
              maximumFractionDigits: 0,
            }).format(ctx.raw),
        },
      },
    },
    scales: {
      x: {
        ticks: {
          callback(value: any) {
            return new Intl.NumberFormat('us-US', {
              notation: 'compact',
              maximumFractionDigits: 1,
            }).format(Number(value))
          },
        },
      },
    },
  }

  const headerTitle = (
    <div className="flex align-items-center justify-content-between flex-wrap">
      <div>
        <h2 className="text-2xl font-bold">
          Revenue by Distributor Product & Non Dist. Product (Trading)
        </h2>
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
              <div className="w-full xl:w-6">
                <PrimeChart
                  type="bar"
                  data={chartData}
                  options={options}
                  plugins={[ChartDataLabels]}
                  className="w-full"
                  style={{ height: '350px' }}
                />
              </div>
            </Card>
          </div>
        )}
      </div>
    </>
  )
}

export default RevenueByProductCategory
