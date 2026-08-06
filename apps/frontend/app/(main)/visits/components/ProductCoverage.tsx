import ProductCoverageDetail from './ProductCoverageDetail'
import SkeletonLoader from '../../components/skeleton-loader/SkeletonLoader'
import { ICustomer, IResObject, ProductCoverageSummary } from '@saleshub-tsm/types'
import { Button } from 'primereact/button'
import { Chart } from 'primereact/chart'
import { useState } from 'react'

import { useFetch } from '@/hooks/useFetch'
import { formatDate } from '@/lib/dateUtils'

type Props = {
  customer?: ICustomer
}

const ProductCoverage = ({ customer }: Props) => {
  const [visible, setVisible] = useState(false)
  const { data, isLoading } = useFetch<IResObject<ProductCoverageSummary>>(
    customer?.id ? `customers/${customer.id}/product-coverage` : null
  )

  if (!customer || isLoading || !data) {
    return (
      <div className="border-radius-12 mb-2">
        <SkeletonLoader type="rect" />
      </div>
    )
  }

  const summary = data.data?.summary
  const total = summary?.totalItems ?? 0
  const ordered = summary?.orderedItems ?? 0
  const remaining = total - ordered

  const coverage = summary?.coverage ?? 0

  const isEmpty = total === 0

  const recentPurchase = summary?.lastPurchaseDate ?? null

  const chartData = {
    labels: [''],
    datasets: [
      {
        label: 'Ordered',
        data: [ordered],
        backgroundColor: '#22c55e',
        stack: 'coverage',
        borderRadius: 0,
        borderSkipped: false,
        barThickness: 30,
      },
      {
        label: 'Remaining',
        data: [remaining],
        backgroundColor: '#e5e7eb',
        stack: 'coverage',
        borderRadius: 0,
        borderSkipped: false,
        barThickness: 30,
      },
    ],
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: false,
    indexAxis: 'y' as const,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        enabled: false,
      },
    },
    scales: {
      x: {
        stacked: true,
        display: false,
        beginAtZero: true,
        max: Math.max(total, 1),
      },
      y: {
        stacked: true,
        display: false,
      },
    },
  }

  return (
    <>
      <Chart
        type="bar"
        data={chartData}
        options={chartOptions}
        style={{ width: '100%', height: '24px' }}
      />

      <div className="mt-4">
        <div className="flex justify-content-between align-items-center">
          <div>
            <div className="text-3xl font-bold">{coverage.toFixed(2)}%</div>

            <div className="text-500 text-sm">Product Coverage</div>
          </div>

          {!isEmpty && (
            <span className="bg-green-100 text-green-700 px-3 py-2 border-round text-sm font-semibold">
              {ordered} / {total}
            </span>
          )}
        </div>

        <div className="mt-4 px-2 grid grid-cols-1 gap-3 md:grid-cols-3">
          <div className="rounded-lg surface-100 p-3">
            <div className="text-sm text-500 mb-2">All Time Products</div>
            <div className="text-2xl font-semibold">{total}</div>
          </div>

          <div className="rounded-lg surface-100 p-3">
            <div className="text-sm text-500 mb-2">Ordered This Month</div>
            <div className="text-2xl font-semibold text-green-600">{ordered}</div>
          </div>

          <div className="rounded-lg surface-100 p-3">
            <div className="text-sm text-500 mb-2">Last Purchase</div>
            <div className="text-lg font-semibold">{formatDate(recentPurchase)}</div>
          </div>
        </div>
      </div>

      {!isEmpty && (
        <Button
          label="View Details"
          icon="pi pi-list"
          outlined
          className=" mt-4"
          onClick={() => setVisible(true)}
        />
      )}

      {isEmpty && (
        <div className="mt-4 flex align-items-center gap-2 border-round bg-blue-50 p-3">
          <i className="pi pi-info-circle text-blue-500" />
          <span className="text-sm text-blue-700">No product purchase history found.</span>
        </div>
      )}

      <ProductCoverageDetail
        visible={visible}
        onHide={() => setVisible(false)}
        productCoverage={data.data as ProductCoverageSummary}
      />
    </>
  )
}

export default ProductCoverage
