import SkeletonLoader from '../../components/skeleton-loader/SkeletonLoader'
import { CustomerRevenueSummary, ICustomer, IResObject } from '@saleshub-tsm/types'
import { Chart } from 'primereact/chart'

import { useFetch } from '@/hooks/useFetch'
import { formatCurrency } from '@/lib/formatter'

const MONTH_RANGE = 12
const TARGET_MULTIPLIER = 0.23

type RevenueAndTargetProps = {
  customer?: ICustomer
}

const AvgRevenueAndTarget = ({ customer }: RevenueAndTargetProps) => {
  const { data: customerRevenueData, isLoading } = useFetch<IResObject<CustomerRevenueSummary>>(
    customer?.id ? `customers/${customer.id}/avg-revenue` : null
  )

  const currentRevenue = customerRevenueData?.data?.currentRevenue ?? 0
  const totalRevenue = customerRevenueData?.data?.totalRevenue ?? 0
  const averageRevenue = totalRevenue / MONTH_RANGE
  const targetRevenue = averageRevenue + averageRevenue * TARGET_MULTIPLIER
  const isEmpty = currentRevenue === 0 && totalRevenue === 0

  const percentage = targetRevenue > 0 ? (currentRevenue / targetRevenue) * 100 : 0

  const isOverTarget = percentage > 100

  const targetPart = Math.min(currentRevenue, targetRevenue)
  const overPart = Math.max(currentRevenue - targetRevenue, 0)
  const remainingPart = Math.max(targetRevenue - currentRevenue, 0)

  const formatShort = (value: number) => formatCurrency(value, true, true) ?? 'Rp. 0'

  const shouldShowSkeleton = !customer || (customer.id != null && !customerRevenueData)

  const chartData = {
    labels: [''],
    datasets: [
      {
        label: 'Target',
        data: [targetPart],
        backgroundColor: '#3b82f6',
        stack: 'revenue',
        borderSkipped: false,
        borderRadius: 0,
        barThickness: 30,
      },
      {
        label: 'Over',
        data: [overPart],
        backgroundColor: '#22c55e',
        stack: 'revenue',
        borderSkipped: false,
        borderRadius: 0,
        barThickness: 30,
      },
      {
        label: 'Remaining',
        data: [remainingPart],
        backgroundColor: '#e5e7eb',
        stack: 'revenue',
        borderSkipped: false,
        borderRadius: 0,
        barThickness: 30,
      },
    ],
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y' as const,
    animation: false,
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
        max: Math.max(currentRevenue, targetRevenue, 1),
      },
      y: {
        stacked: true,
        display: false,
      },
    },
  }

  const exceededAmount = Math.max(currentRevenue - targetRevenue, 0)
  const exceededPercentage = Math.max(percentage - 100, 0)

  if (shouldShowSkeleton) {
    return (
      <div className="border-radius-12 mb-2">
        <SkeletonLoader type="rect" />
      </div>
    )
  }

  if (!customer || isLoading) {
    return (
      <div className="border-radius-12 mb-2">
        <SkeletonLoader type="rect" />
      </div>
    )
  }

  return (
    <>
      <Chart
        type="bar"
        data={chartData}
        options={chartOptions}
        style={{ width: '100%', height: '24px' }}
        plugins={[]}
      />

      <div className="mt-4">
        <div className="flex justify-content-between align-items-center">
          <div>
            <div className="text-3xl font-bold">{percentage.toFixed(2)}%</div>

            <div className="text-500 text-sm">
              {isEmpty ? 'No Revenue Data' : 'of Monthly Target'}
            </div>
          </div>

          {isOverTarget && (
            <span className="bg-green-100 text-green-700 px-3 py-2 border-round text-sm font-semibold">
              +{(percentage - 100).toFixed(2)}%
            </span>
          )}
        </div>

        <div className="grid mt-4">
          <div className="col-6">
            <div className="surface-100 border-round p-3 h-full">
              <div className="text-500 text-sm mb-2">Target</div>

              <div className="text-xl font-semibold text-blue-600">
                {formatShort(targetRevenue)}
              </div>
            </div>
          </div>

          <div className="col-6">
            <div className="surface-100 border-round p-3 h-full">
              <div className="text-500 text-sm mb-2">Current Revenue</div>

              <div className="text-xl font-semibold text-green-600">
                {formatShort(currentRevenue)}
              </div>
            </div>
          </div>

          <div className="col-6 mt-3">
            <div className="surface-100 border-round p-3 h-full">
              <div className="text-500 text-sm mb-2">Monthly Average Revenue</div>

              <div className="text-xl font-semibold">{formatShort(averageRevenue)}</div>
            </div>
          </div>

          <div className="col-6 mt-3">
            <div className="surface-100 border-round p-3 h-full">
              <div className="text-500 text-sm mb-2">Remaining to Target</div>

              <div
                className={`text-xl font-semibold ${
                  remainingPart > 0 ? 'text-orange-600' : 'text-green-600'
                }`}
              >
                {remainingPart > 0 ? (
                  <div className="text-xl font-semibold text-orange-600">
                    {formatShort(remainingPart)}
                  </div>
                ) : (
                  <div className="flex flex-column gap-1">
                    <div className="text-xl font-semibold text-green-600">
                      +{formatShort(exceededAmount)}
                    </div>

                    <div className="text-sm text-green-600">
                      {exceededPercentage.toFixed(1)}% above target
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {isEmpty && !isLoading && (
        <div className="mt-4 flex align-items-center gap-2 border-round bg-blue-50 p-3">
          <i className="pi pi-info-circle text-blue-500" />
          <span className="text-sm text-blue-700">
            No revenue has been recorded for this month.
          </span>
        </div>
      )}
    </>
  )
}

export default AvgRevenueAndTarget
