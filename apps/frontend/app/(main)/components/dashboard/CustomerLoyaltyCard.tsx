import SkeletonLoader from '../skeleton-loader/SkeletonLoader'
import { IDashboardData } from '@saleshub-tsm/types'
import { TooltipItem } from 'chart.js'
import ChartDataLabels, { Context } from 'chartjs-plugin-datalabels'
import { Card } from 'primereact/card'
import { Chart } from 'primereact/chart'
import { useContext } from 'react'

import { LayoutContext } from '@/layout/context/layoutcontext'

type CustomerLoyaltyCardProps = {
  isCustomerLoyaltyValidating: boolean
  customerLoyaltyData?: IDashboardData['data']
}
const CustomerLoyaltyCard = ({
  isCustomerLoyaltyValidating,
  customerLoyaltyData,
}: CustomerLoyaltyCardProps) => {
  const { layoutConfig } = useContext(LayoutContext)

  const CRR = customerLoyaltyData?.CRR ?? []
  const nooVsExisting = customerLoyaltyData?.nooVsExisting ?? []
  const baseColor = layoutConfig.colorScheme === 'light' ? '#2d353e' : '#f8f9fa'

  return (
    <div className="mt-4">
      <div className="mb-1">
        <h2 className="text-2xl font-bold m-0">Customer Insights</h2>
      </div>
      <div className="grid mt-2">
        {isCustomerLoyaltyValidating ? (
          <div className="col-12 lg:col-6 xl:col-6">
            <SkeletonLoader type="circle" />
          </div>
        ) : (
          <div className="col-12 lg:col-6 xl:col-6">
            <Card className="text-center">
              <h5>Retention Index</h5>
              <div className="text-xs italic mb-2">
                <i>Customer retention by period</i>
              </div>
              <div
                style={{
                  width: '80%',
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
                        label: 'Base Customers',
                        data: Object.values(CRR).map((x) => x.baseCustomers),
                        borderColor: '#1F78FF',
                        backgroundColor: 'rgba(31, 120, 255, 0.15)',
                        fill: true,
                        tension: 0.4,
                        pointRadius: 4,
                        pointHoverRadius: 6,
                        pointBackgroundColor: '#1F78FF',
                      },
                      {
                        label: 'Retained Customers',
                        data: Object.values(CRR).map((x) => x.retainedCustomers),
                        borderColor: '#22C55E',
                        backgroundColor: 'rgba(34, 197, 94, 0.15)',
                        fill: true,
                        tension: 0.4,
                        pointRadius: 4,
                        pointHoverRadius: 6,
                        pointBackgroundColor: '#22C55E',
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
                        title: {
                          display: false,
                          text: 'Period',
                        },
                      },
                      y: {
                        beginAtZero: true,
                        title: {
                          display: true,
                          text: 'Customers',
                        },
                        ticks: {
                          precision: 0,
                        },
                      },
                    },
                    plugins: {
                      legend: {
                        display: false,
                      },
                      tooltip: {
                        callbacks: {
                          afterBody: (items: TooltipItem<'line'>[]) => {
                            const item = Object.values(CRR)[items[0].dataIndex]

                            return [
                              '─────────────────',
                              `Retention : ${item.retention.toFixed(1)}%`,
                            ]
                          },
                        },
                      },
                      datalabels: {
                        display: (ctx: Context) => ctx.datasetIndex === 1,
                        anchor: 'end',
                        align: 'bottom',
                        offset: 6,
                        color: baseColor,
                        font: {
                          weight: 'bold',
                          size: 10,
                        },
                        formatter: (_: number, context: Context) => {
                          const item = Object.values(CRR)[context.dataIndex]
                          return `${item.retention.toFixed(1)}%`
                        },
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
          <div className="col-12 lg:col-6 xl:col-6">
            <SkeletonLoader type="circle" />
          </div>
        ) : (
          <div className="col-12 lg:col-6 xl:col-46">
            <Card className="text-center">
              <h5>New vs Existing</h5>
              <div className="text-xs italic mb-2">
                <i>Breakdown of First-Time Buyers vs Existing </i>
              </div>
              <div
                style={{
                  width: '80%',
                  height: '200px',
                  margin: '0 auto',
                }}
              >
                <Chart
                  type="line"
                  data={{
                    labels: nooVsExisting.map((x) => `${x.period} Mon`),
                    datasets: [
                      {
                        label: 'New Customer',
                        data: nooVsExisting.map((x) => x.data.newCustomer),

                        borderColor: '#22C55E',
                        backgroundColor: 'rgba(34, 197, 94, 0.15)',
                        fill: true,
                        tension: 0.4,
                        pointRadius: 4,
                        pointHoverRadius: 6,
                        pointBackgroundColor: '#22C55E',
                      },
                      {
                        label: 'Existing Customer',
                        data: nooVsExisting.map((x) => x.data.existingCustomer),
                        borderColor: '#2563EB',
                        backgroundColor: 'rgba(37, 99, 235, 0.15)',
                        fill: true,
                        tension: 0.4,
                        pointRadius: 4,
                        pointHoverRadius: 6,
                        pointBackgroundColor: '#2563EB',
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

                            return [
                              '─────────────────',
                              `Total : ${item.data.newCustomer + item.data.existingCustomer}`,
                            ]
                          },
                        },
                      },
                      datalabels: {
                        display: true,
                        anchor: 'end',
                        align: 'bottom',
                        offset: 6,
                        color: baseColor,
                        font: {
                          weight: 'bold',
                          size: 10,
                        },
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
