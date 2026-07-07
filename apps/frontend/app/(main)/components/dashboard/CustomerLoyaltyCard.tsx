import SkeletonLoader from '../skeleton-loader/SkeletonLoader'
import { IDashboardData } from '@saleshub-tsm/types'
import { TooltipItem } from 'chart.js'
import ChartDataLabels from 'chartjs-plugin-datalabels'
import { Card } from 'primereact/card'
import { Chart } from 'primereact/chart'

type CustomerLoyaltyCardProps = {
  isCustomerLoyaltyValidating: boolean
  customerLoyaltyData?: IDashboardData
}
const CustomerLoyaltyCard = ({
  isCustomerLoyaltyValidating,
  customerLoyaltyData,
}: CustomerLoyaltyCardProps) => {
  const colors = {
    VIP: '#2E7D32',
    LOYAL: '#66BB6A',
    POTENTIAL: '#C5E1A5',
    AT_RISK: '#FFB74D',
    LOST: '#D32F2F',
  }

  const CRR = customerLoyaltyData?.data?.CRR ?? []
  const nooVsExisting = customerLoyaltyData?.data?.nooVsExisting ?? []
  const RFM = customerLoyaltyData?.data?.RFM ?? []

  const rfmLabels = RFM[1]?.map((x) => x.segment) ?? []

  const rfmPeriods = Object.keys(RFM)
    .map((key) => Number(key))
    .sort((a, b) => a - b)

  const rfmDatasets = rfmLabels.map((segment) => ({
    label: segment.replace('_', ' '),
    data: rfmPeriods.map((period) => RFM[period]?.find((x) => x.segment === segment)?.count ?? 0),
    backgroundColor: colors[segment as keyof typeof colors],
    borderRadius: 2,
    borderSkipped: false,
    maxBarThickness: 45,
  }))

  return (
    <div className="mt-4">
      <div className="mb-1">
        <h2 className="text-2xl font-bold m-0">Customer Insights</h2>
      </div>
      <div className="grid mt-2">
        {isCustomerLoyaltyValidating ? (
          <div className="col-12 lg:col-6 xl:col-4">
            <SkeletonLoader type="circle" />
          </div>
        ) : (
          <div className="col-12 lg:col-6 xl:col-4">
            <Card className="text-center">
              <h5>Loyalty Benchmarking</h5>
              <div className="text-xs italic mb-2">
                <i>Customer Stability & Engagement Health Score</i>
              </div>
              <div
                style={{
                  width: '240px',
                  height: '200px',
                  margin: '0 auto',
                }}
              >
                <Chart
                  type="bar"
                  data={{
                    labels: rfmPeriods.map((p) => `${p} Mon`),
                    datasets: rfmDatasets,
                  }}
                  options={{
                    maintainAspectRatio: false,
                    responsive: true,
                    animation: {
                      duration: 1000,
                      easing: 'easeOutQuart',
                    },
                    scales: {
                      x: {
                        stacked: true,
                        grid: {
                          display: false,
                        },
                        title: {
                          display: false,
                        },
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
                    plugins: {
                      legend: {
                        display: false,
                      },
                      tooltip: {
                        callbacks: {
                          label: (ctx: TooltipItem<'bar'>) => {
                            const total = ctx.chart.data.datasets.reduce(
                              (sum, ds) => sum + Number(ds.data[ctx.dataIndex]),
                              0
                            )
                            const value = Number(ctx.raw)
                            const pct = ((value / total) * 100).toFixed(1)

                            return `${ctx.dataset.label}: ${value} (${pct}%)`
                          },
                        },
                      },
                      datalabels: {
                        display: false,
                      },
                    },
                  }}
                  plugins={[ChartDataLabels]}
                  style={{ width: '100%', height: '200px' }}
                />
              </div>
            </Card>
          </div>
        )}

        {isCustomerLoyaltyValidating ? (
          <div className="col-12 lg:col-6 xl:col-4">
            <SkeletonLoader type="circle" />
          </div>
        ) : (
          <div className="col-12 lg:col-6 xl:col-4">
            <Card className="text-center">
              <h5>Rentention Index</h5>
              <div className="text-xs italic mb-2">
                <i>Customer retention by period</i>
              </div>
              <div
                style={{
                  width: '240px',
                  height: '200px',
                  margin: '0 auto',
                }}
              >
                <Chart
                  type="line"
                  data={{
                    labels: Object.keys(CRR).map((p) => `${p} Mon`),
                    datasets: [
                      {
                        label: 'Retention (%)',
                        data: Object.values(CRR).map((x) => x.retention),
                        borderColor: '#1F78FF',
                        backgroundColor: 'rgba(31, 120, 255, 0.2)',
                        fill: true,
                        tension: 0.4, // smooth line
                        pointRadius: 4,
                        pointHoverRadius: 6,
                        pointBackgroundColor: '#1F78FF',
                        pointBorderColor: '#fff',
                        pointBorderWidth: 2,
                      },
                    ],
                  }}
                  options={{
                    maintainAspectRatio: false,
                    responsive: true,
                    animation: {
                      duration: 1000,
                      easing: 'easeOutQuart',
                    },
                    interaction: {
                      mode: 'index',
                      intersect: false,
                    },
                    scales: {
                      x: {
                        grid: {
                          display: false,
                        },
                      },
                      y: {
                        beginAtZero: true,
                        max: 100,
                        ticks: {
                          callback: (value: string | number) => `${value}%`,
                        },
                        title: {
                          display: true,
                          text: 'Retention (%)',
                        },
                      },
                    },
                    plugins: {
                      legend: {
                        display: false,
                      },
                      tooltip: {
                        callbacks: {
                          label: (ctx: TooltipItem<'line'>) => {
                            const item = Object.values(CRR)[ctx.dataIndex]

                            return [
                              `Retention : ${item.retention}%`,
                              `Base Customers : ${item.baseCustomers}`,
                              `Retained Customers : ${item.retainedCustomers}`,
                            ]
                          },
                        },
                      },
                      datalabels: {
                        display: false,
                      },
                    },
                  }}
                  plugins={[ChartDataLabels]}
                  style={{ width: '100%', height: '200px' }}
                />
              </div>
            </Card>
          </div>
        )}
        {isCustomerLoyaltyValidating ? (
          <div className="col-12 lg:col-6 xl:col-4">
            <SkeletonLoader type="circle" />
          </div>
        ) : (
          <div className="col-12 lg:col-6 xl:col-4">
            <Card className="text-center">
              <h5>New vs Existing</h5>
              <div className="text-xs italic mb-2">
                <i>Breakdown of First-Time Buyers vs Existing </i>
              </div>
              <div
                style={{
                  width: '240px',
                  height: '200px',
                  margin: '0 auto',
                }}
              >
                <Chart
                  type="bar"
                  data={{
                    labels: nooVsExisting.map((x) => `${x.period} Mon`),
                    datasets: [
                      {
                        label: 'New Customer',
                        data: nooVsExisting.map((x) => x.data.newCustomer),
                        backgroundColor: '#22C55E',
                        borderRadius: 2,
                        borderSkipped: false,
                        stack: 'customers',
                        maxBarThickness: 40,
                      },
                      {
                        label: 'Existing Customer',
                        data: nooVsExisting.map((x) => x.data.existingCustomer),
                        backgroundColor: '#2563EB',
                        borderRadius: 2,
                        borderSkipped: false,
                        stack: 'customers',
                        maxBarThickness: 40,
                      },
                    ],
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    animation: {
                      duration: 1000,
                      easing: 'easeOutQuart',
                    },
                    scales: {
                      x: {
                        stacked: true,
                        grid: {
                          display: false,
                        },
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
                    interaction: {
                      mode: 'index',
                      intersect: false,
                    },
                    plugins: {
                      legend: {
                        display: false,
                      },
                      tooltip: {
                        callbacks: {
                          footer: (items: TooltipItem<'bar'>[]) => {
                            const index = items[0].dataIndex
                            const item = nooVsExisting[index]

                            return `Total : ${item.data.newCustomer + item.data.existingCustomer}`
                          },
                        },
                      },
                      datalabels: {
                        display: false,
                      },
                    },
                  }}
                  plugins={[ChartDataLabels]}
                  style={{ width: '100%', height: '200px' }}
                />
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}

export default CustomerLoyaltyCard
