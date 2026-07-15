import { ChartCard } from '../base'
import SkeletonLoader from '../skeleton-loader/SkeletonLoader'
import { IDashboardData } from '@saleshub-tsm/types'
import { useContext } from 'react'

import { LayoutContext } from '@/layout/context/layoutcontext'
import { CHART_COLORS } from '@/lib/constants'
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
        backgroundColor: CHART_COLORS.blueLight,
        borderColor: CHART_COLORS.blue,
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

  if (isValidating) {
    return (
      <div className="mt-2">
        <div className="col-12 flex flex-column px-0 gap-3">
          <SkeletonLoader type="rect" />
          <SkeletonLoader type="chart-horizontal" />
        </div>
      </div>
    )
  }

  return (
    <div className="mt-2">
      <div className="col-12 p-0 my-4">
        <ChartCard
          header={headerTitle}
          chartType="bar"
          chartData={chartData}
          chartOptions={options}
          chartHeight="350px"
          className="w-full"
        />
      </div>
    </div>
  )
}

export default RevenueByProductCategory
