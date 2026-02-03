'use client'

import { LayoutContext } from '../../layout/context/layoutcontext'
import { TooltipItem } from 'chart.js'
import ChartDataLabels, { Context } from 'chartjs-plugin-datalabels'
import { Card } from 'primereact/card'
import { Chart } from 'primereact/chart'
import { Knob } from 'primereact/knob'
import { ProgressSpinner } from 'primereact/progressspinner'
import { useContext, useEffect } from 'react'

import { useAuth } from '@/layout/context/AuthContext'
import { formatCurrency } from '@/lib/formatter'
import { useDashboardStore } from '@/stores'

import 'chartjs-adapter-date-fns'

const Dashboard = () => {
  const { layoutConfig } = useContext(LayoutContext)
  const dashboard = useDashboardStore()
  const { isAdmin } = useAuth()

  const {
    fetchSalesSummary,
    monthToDateSummary,
    revenueTrend,
    orderTrend,
    customerTrend,
    aovTrend,
    slpRevenue,
    productRevenueDistributor,
    productRevenueGrocery,
    loading,
    newVsReturning,
    CRR,
    RPR,
    RFM,
  } = dashboard

  const applyLightTheme = () => {}

  const applyDarkTheme = () => {}

  useEffect(() => {
    fetchSalesSummary()
  }, [])

  useEffect(() => {
    if (layoutConfig.colorScheme === 'light') {
      applyLightTheme()
    } else {
      applyDarkTheme()
    }
  }, [layoutConfig.colorScheme])

  const revenuLabel = revenueTrend.map((item) => item.period)
  const revenueData = revenueTrend.map((item) => item.revenue)

  const trendLabel = orderTrend.map((item) => item.period)
  const trendData = orderTrend.map((item) => item.order)

  const customerLabel = customerTrend.map((item) => item.period)
  const customerData = customerTrend.map((item) => item.activeCustomers)

  const aovLabel = aovTrend.map((item) => item.period)
  const aovData = aovTrend.map((item) => item.aov)

  const slpRevenueLabel = slpRevenue.map((item) => item.slp)
  const slpRevenueData = slpRevenue.map((item) => item.revenue)

  const productRevenueDistributorLabel = productRevenueDistributor.map((item) => item.ItemName)
  const productRevenueDistributorData = productRevenueDistributor.map((item) => item.revenue)

  const productRevenueGroceryLabel = productRevenueGrocery.map((item) => item.ItemName)
  const productRevenueGroceryData = productRevenueGrocery.map((item) => item.revenue)

  const newVsReturningLabel = ['New Customer', 'Returning Customer']
  const newVsReturningData = [newVsReturning.newCustomer, newVsReturning.returningCustomer]

  const baseColor = layoutConfig.colorScheme === 'light' ? '#2d353e' : '#f8f9fa'

  const rfmLabels = RFM.map((item) => {
    return item.segment.replace('_', ' ')
  })

  const rfmData = RFM.map((item) => {
    return item.count
  })

  return (
    <>
      {loading ? (
        <div
          className="absolute top-0 left-0 w-full h-full flex align-items-center justify-content-center bg-white-alpha-60 z-2"
          style={{ borderRadius: '6px' }}
        >
          <ProgressSpinner style={{ width: '50px', height: '50px' }} strokeWidth="8" />
        </div>
      ) : (
        <>
          <div className="grid">
            {Object.keys(monthToDateSummary).map((itemKey) => {
              const isMoney = itemKey === 'revenue' || itemKey === 'aov'
              return (
                monthToDateSummary[itemKey].current && (
                  <div className="col-12 lg:col-6 xl:col-3" key={itemKey}>
                    <Card
                      pt={{
                        root: {
                          style: {
                            border: `1px solid ${
                              monthToDateSummary[itemKey]?.growthPercent > 0
                                ? 'var(--green-500)'
                                : 'var(--red-500)'
                            }`,
                            borderRadius: '12px',
                          },
                        },
                      }}
                    >
                      <div className="flex justify-content-between mb-3">
                        <div>
                          <span className="block text-500 font-medium mb-3">
                            {itemKey.toUpperCase()}
                          </span>
                          <div className="text-900 font-medium text-xl">
                            {formatCurrency(
                              Number(monthToDateSummary[itemKey]?.current),
                              true,
                              isMoney
                            )}
                          </div>
                        </div>
                        <div
                          className="flex align-items-center justify-content-center border-round"
                          style={{ width: '2.5rem', height: '2.5rem' }}
                        >
                          <i className="pi pi-chart-line text-blue-500 text-xl" />
                        </div>
                      </div>
                      <span
                        className={`${
                          monthToDateSummary[itemKey]?.growthPercent > 0
                            ? 'text-green-500'
                            : 'text-red-500'
                        } font-medium`}
                      >
                        {monthToDateSummary[itemKey]?.growthPercent != null
                          ? `${monthToDateSummary[itemKey].growthPercent.toFixed(2)} %`
                          : '0.00 %'}

                        {monthToDateSummary[itemKey]?.diff > 0 ? (
                          <i className="ml-1 pi pi-arrow-up-right text-green-500 text-sm" />
                        ) : (
                          <i className="ml-1 pi pi-arrow-down-right text-red-500 text-sm" />
                        )}
                      </span>
                      <span className="ml-2 text-500">vs last month</span>
                    </Card>
                  </div>
                )
              )
            })}
          </div>
          <div className="grid mt-4">
            <div className="col-12 lg:col-6 xl:col-3">
              <Card className="text-center">
                <h5>Customer Loyalty</h5>
                <p className="text-sm">Based on RFM</p>
                <div
                  style={{
                    width: '200px',
                    height: '200px',
                    margin: '0 auto',
                  }}
                >
                  <Chart
                    type="pie"
                    data={{
                      labels: rfmLabels,
                      datasets: [
                        {
                          data: rfmData,
                          backgroundColor: [
                            '#FFD700', // VIP = gold
                            '#4CAF50', // LOYAL = green
                            '#2196F3', // POTENTIAL = blue
                            '#FF9800', // AT_RISK = orange
                            '#9E9E9E', // LOST = gray
                          ],
                          hoverBackgroundColor: [
                            '#FFC700',
                            '#43A047',
                            '#1E88E5',
                            '#FB8C00',
                            '#757575',
                          ],
                          borderWidth: 1,
                        },
                      ],
                    }}
                    options={{
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          display: false,
                          position: 'bottom',
                        },
                        datalabels: {
                          color: '#0F0F0F',
                          anchor: 'center',
                          formatter: (value: number, context: Context) => {
                            let sum = 0
                            const dataArr = context.chart.data.datasets[0].data
                            const dataLAbel = context.chart.data.labels?.[context.dataIndex]
                            dataArr.forEach((value) => {
                              if (typeof value === 'number' && !isNaN(value)) {
                                sum += value
                              }
                            })
                            const percentage = ((value * 100) / sum).toFixed(2) + '%\n'
                            return percentage + dataLAbel
                          },
                        },
                      },
                    }}
                    plugins={[ChartDataLabels]}
                    style={{ width: '100%', height: '100%' }}
                  />
                </div>
              </Card>
            </div>

            {CRR > 0 && (
              <div className="col-12 lg:col-6 xl:col-3">
                <Card className="text-center">
                  <h5>Customer Retention Rate</h5>
                  <p className="text-sm">Last 3 Months</p>
                  <Knob
                    value={Number(CRR.toFixed(2))}
                    readOnly
                    min={0}
                    max={100}
                    size={200}
                    valueTemplate="{value}%"
                    valueColor={'var(--green-500)'}
                  />
                </Card>
              </div>
            )}

            {RPR > 0 && (
              <div className="col-12 lg:col-6 xl:col-3">
                <Card className="text-center">
                  <h5>Repeat Purchase Rate</h5>
                  <p className="text-sm">Current Month</p>
                  <Knob
                    value={Number(CRR.toFixed(2))}
                    readOnly
                    min={0}
                    max={100}
                    size={200}
                    valueTemplate="{value}%"
                    valueColor={'var(--orange-500)'}
                  />
                </Card>
              </div>
            )}

            <div className="col-12 lg:col-6 xl:col-3">
              <Card className="text-center">
                <h5>New vs Returning</h5>
                <p className="text-sm">Last 3 Months</p>
                <div
                  style={{
                    width: '200px',
                    height: '200px',
                    margin: '0 auto',
                  }}
                >
                  <Chart
                    type="pie"
                    data={{
                      labels: newVsReturningLabel,
                      datasets: [
                        {
                          data: newVsReturningData,
                          backgroundColor: ['#FF9F43', '#007BFF'],
                          borderWidth: 1,
                        },
                      ],
                    }}
                    options={{
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          display: false,
                          position: 'bottom',
                        },
                        datalabels: {
                          color: '#0F0F0F',
                          anchor: 'center',
                          formatter: (value: number, context: Context) => {
                            let sum = 0
                            const dataArr = context.chart.data.datasets[0].data
                            const dataLAbel = context.chart.data.labels?.[context.dataIndex]
                            dataArr.forEach((value) => {
                              if (typeof value === 'number' && !isNaN(value)) {
                                sum += value
                              }
                            })
                            const percentage = ((value * 100) / sum).toFixed(2) + '%\n'
                            return percentage + dataLAbel
                          },
                        },
                      },
                    }}
                    plugins={[ChartDataLabels]}
                    style={{ width: '100%', height: '100%' }}
                  />
                </div>
              </Card>
            </div>
          </div>
          <div className="grid mt-4 ">
            <div className="col-12 lg:col-12 xl:col-6">
              <Card>
                <Chart
                  type="bar"
                  data={{
                    labels: revenuLabel,
                    datasets: [{ data: revenueData, label: 'Revenue Trend' }],
                  }}
                  options={{
                    plugins: {
                      tooltip: {
                        callbacks: {
                          label: function (context: TooltipItem<'bar'>) {
                            return formatCurrency(context.parsed.y, true, true)
                          },
                          title: function (context: TooltipItem<'bar'>[]) {
                            const date = new Date(context[0].parsed.x)
                            return date.toLocaleString('en-US', { month: 'short', year: 'numeric' })
                          },
                        },
                      },
                    },
                    scales: {
                      x: {
                        grid: {
                          display: false,
                        },
                        type: 'time',
                        time: {
                          unit: 'month',
                          displayFormats: {
                            month: 'MMM yyyy',
                          },
                        },
                      },
                      y: {
                        grid: {
                          display: false,
                        },
                        ticks: {
                          callback: function (value: string) {
                            return formatCurrency(value, false, true)
                          },
                        },
                      },
                    },
                  }}
                />
              </Card>
            </div>
            <div className="col-12 lg:col-12 xl:col-6">
              <Card>
                <Chart
                  type="bar"
                  data={{
                    labels: trendLabel,
                    datasets: [{ data: trendData, label: 'Order Trend' }],
                  }}
                  options={{
                    plugins: {
                      tooltip: {
                        callbacks: {
                          label: function (context: TooltipItem<'bar'>) {
                            return formatCurrency(context.parsed.y, true, false)
                          },
                          title: function (context: TooltipItem<'bar'>[]) {
                            const date = new Date(context[0].parsed.x)
                            return date.toLocaleString('en-US', { month: 'short', year: 'numeric' })
                          },
                        },
                      },
                    },
                    scales: {
                      x: {
                        grid: {
                          display: false,
                        },
                        type: 'time',
                        time: {
                          unit: 'month',
                          displayFormats: {
                            month: 'MMM yyyy',
                          },
                        },
                      },
                      y: {
                        grid: {
                          display: false,
                        },
                        ticks: {
                          callback: function (value: string) {
                            return formatCurrency(value, false, false)
                          },
                        },
                      },
                    },
                  }}
                />
              </Card>
            </div>
            <div className="col-12 lg:col-12 xl:col-6">
              <Card>
                <Chart
                  type="bar"
                  data={{
                    labels: customerLabel,
                    datasets: [{ data: customerData, label: 'Customer Trend' }],
                  }}
                  options={{
                    plugins: {
                      tooltip: {
                        callbacks: {
                          label: function (context: TooltipItem<'bar'>) {
                            return formatCurrency(context.parsed.y, true, false)
                          },
                          title: function (context: TooltipItem<'bar'>[]) {
                            const date = new Date(context[0].parsed.x)
                            return date.toLocaleString('en-US', { month: 'short', year: 'numeric' })
                          },
                        },
                      },
                    },
                    scales: {
                      x: {
                        grid: {
                          display: false,
                        },
                        type: 'time',
                        time: {
                          unit: 'month',
                          displayFormats: {
                            month: 'MMM yyyy',
                          },
                        },
                      },
                      y: {
                        grid: {
                          display: false,
                        },
                        ticks: {
                          callback: function (value: string) {
                            return formatCurrency(value, false, false)
                          },
                        },
                      },
                    },
                  }}
                />
              </Card>
            </div>
            <div className="col-12 lg:col-12 xl:col-6">
              <Card>
                <Chart
                  type="bar"
                  data={{ labels: aovLabel, datasets: [{ data: aovData, label: 'AOV Trend' }] }}
                  options={{
                    plugins: {
                      tooltip: {
                        callbacks: {
                          label: function (context: TooltipItem<'bar'>) {
                            return formatCurrency(context.parsed.y, true, true)
                          },
                          title: function (context: TooltipItem<'bar'>[]) {
                            const date = new Date(context[0].parsed.x)
                            return date.toLocaleString('en-US', { month: 'short', year: 'numeric' })
                          },
                        },
                      },
                    },
                    scales: {
                      x: {
                        grid: {
                          display: false,
                        },
                        type: 'time',
                        time: {
                          unit: 'month',
                          displayFormats: {
                            month: 'MMM yyyy',
                          },
                        },
                      },
                      y: {
                        grid: {
                          display: false,
                        },
                        ticks: {
                          callback: function (value: string) {
                            return formatCurrency(value, false, true)
                          },
                        },
                      },
                    },
                  }}
                />
              </Card>
            </div>
          </div>
          <div className="grid mt-2 ">
            <div className="col-12 lg:col-12 xl:col-6">
              <Card>
                <div style={{ position: 'relative', width: '100%', height: '500px' }}>
                  <Chart
                    width="100%"
                    height="100%"
                    type="bar"
                    data={{
                      labels: productRevenueDistributorLabel,
                      datasets: [
                        {
                          data: productRevenueDistributorData,
                          label: 'Top Performing Distributor Product',
                        },
                      ],
                    }}
                    options={{
                      indexAxis: 'y',
                      maintainAspectRatio: false,
                      plugins: {
                        datalabels: {
                          display: true,
                          color: baseColor,
                          align: 'end',
                          anchor: 'start',
                          clip: false,
                          clamp: true,
                          formatter: (_: number | string, context: Context) => {
                            return context.chart.data.labels?.[context.dataIndex]
                          },
                          font: {
                            size: 10,
                          },
                        },
                        tooltip: {
                          callbacks: {
                            label: function (context: TooltipItem<'bar'>) {
                              return formatCurrency(context.parsed.x, true, true)
                            },
                            title: function (context: TooltipItem<'bar'>[]) {
                              return context[0].label
                            },
                          },
                        },
                      },
                      scales: {
                        x: {
                          ticks: {
                            callback: function (value: string) {
                              return formatCurrency(value, false, true)
                            },
                          },
                        },
                        y: {
                          grid: {
                            display: false,
                          },
                          ticks: {
                            display: false,
                          },
                        },
                      },
                    }}
                    plugins={[ChartDataLabels]}
                  />
                </div>
              </Card>
            </div>

            <div className="col-12 lg:col-12 xl:col-6">
              <Card>
                <div style={{ position: 'relative', width: '100%', height: '500px' }}>
                  <Chart
                    width="100%"
                    height="100%"
                    type="bar"
                    data={{
                      labels: productRevenueGroceryLabel,
                      datasets: [
                        {
                          data: productRevenueGroceryData,
                          label: 'Top Performing Grocery Product',
                        },
                      ],
                    }}
                    options={{
                      indexAxis: 'y',
                      maintainAspectRatio: false,
                      plugins: {
                        datalabels: {
                          display: true,
                          color: baseColor,
                          align: 'end',
                          anchor: 'start',
                          clip: false,
                          clamp: true,
                          formatter: (_: number | string, context: Context) => {
                            return context.chart.data.labels?.[context.dataIndex]
                          },
                          font: {
                            size: 10,
                          },
                        },
                        tooltip: {
                          callbacks: {
                            label: function (context: TooltipItem<'bar'>) {
                              return formatCurrency(context.parsed.x, true, true)
                            },
                            title: function (context: TooltipItem<'bar'>[]) {
                              return context[0].label
                            },
                          },
                        },
                      },
                      scales: {
                        x: {
                          ticks: {
                            callback: function (value: string) {
                              return formatCurrency(value, false, true)
                            },
                          },
                        },
                        y: {
                          grid: {
                            display: false,
                          },
                          ticks: {
                            display: false,
                          },
                        },
                      },
                    }}
                    plugins={[ChartDataLabels]}
                  />
                </div>
              </Card>
            </div>
            {isAdmin && (
              <div className="col-12 lg:col-12 xl:col-6">
                <Card>
                  <div style={{ position: 'relative', width: '100%', height: '500px' }}>
                    <Chart
                      width="100%"
                      height="100%"
                      type="bar"
                      data={{
                        labels: slpRevenueLabel,
                        datasets: [
                          {
                            data: slpRevenueData,
                            label: 'Top Performing Salesperson',
                            barPercentage: 0.9,
                            categoryPercentage: 0.5,
                          },
                        ],
                      }}
                      options={{
                        indexAxis: 'y',
                        maintainAspectRatio: false,
                        plugins: {
                          datalabels: {
                            display: true,
                            color: baseColor,
                            align: 'end',
                            anchor: 'start',
                            clip: false,
                            clamp: true,
                            formatter: (_: number | string, context: Context) => {
                              return context.chart.data.labels?.[context.dataIndex]
                            },
                            font: {
                              size: 12,
                            },
                          },
                          tooltip: {
                            callbacks: {
                              label: function (context: TooltipItem<'bar'>) {
                                return formatCurrency(context.parsed.x, true, true)
                              },
                              title: function (context: TooltipItem<'bar'>[]) {
                                return context[0].label
                              },
                            },
                          },
                        },
                        scales: {
                          x: {
                            ticks: {
                              callback: function (value: string) {
                                return formatCurrency(value, false, true)
                              },
                            },
                          },
                          y: {
                            grid: {
                              display: false,
                            },
                            ticks: {
                              display: false,
                            },
                          },
                        },
                      }}
                      plugins={[ChartDataLabels]}
                    />
                  </div>
                </Card>
              </div>
            )}
          </div>
        </>
      )}
    </>
  )
}

export default Dashboard
