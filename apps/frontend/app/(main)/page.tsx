'use client'

import { LayoutContext } from '../../layout/context/layoutcontext'
import { TooltipItem } from 'chart.js'
import ChartDataLabels, { Context } from 'chartjs-plugin-datalabels'
import { Card } from 'primereact/card'
import { Chart } from 'primereact/chart'
import { Knob } from 'primereact/knob'
import { ProgressSpinner } from 'primereact/progressspinner'
import { RadioButton } from 'primereact/radiobutton'
import { useContext, useEffect, useState } from 'react'

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
    slpRevenue,
    productRevenueDistributor,
    productRevenueGrocery,
    loading,
    newVsReturning,
    CRR,
    RPR,
    RFM,
    monthlyTrend,
    summary,
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

  const trendLabel = monthlyTrend.map(
    (item) => `${item.year}-${item.month.toString().padStart(2, '0')}`
  )
  const revenueData = monthlyTrend.map((item) => item.revenue)

  const trendData = monthlyTrend.map((item) => item.orders)

  const customerData = monthlyTrend.map((item) => item.customers)

  const aovData = monthlyTrend.map((item) => item.revenue / item.orders)

  const slpRevenueLabel = slpRevenue.map((item) => item.slp)
  const slpRevenueData = slpRevenue.map((item) => item.revenue)

  const productRevenueDistributorLabel = productRevenueDistributor.map((item) => item.ItemName)
  const productRevenueDistributorData = productRevenueDistributor.map((item) => item.revenue)

  const productRevenueGroceryLabel = productRevenueGrocery.map((item) => item.ItemName)
  const productRevenueGroceryData = productRevenueGrocery.map((item) => item.revenue)

  const newVsReturningLabel = ['New Customer', 'Returning Customer']
  const newVsReturningData = [newVsReturning.newCustomer, newVsReturning.returningCustomer]

  const baseColor = layoutConfig.colorScheme === 'light' ? '#2d353e' : '#f8f9fa'
  const [period, setPeriod] = useState<'mtd' | 'ytd'>('mtd')

  const rfmLabels = RFM.map((item) => {
    return item.segment.replace('_', ' ')
  })

  const rfmData = RFM.map((item) => {
    return item.count
  })

  const selectedSummary = summary[period]

  const mappedSummary = {
    revenue: {
      current: selectedSummary?.current.revenue,
      last: selectedSummary?.previous.revenue,
      growthPercent: selectedSummary?.growth.revenue,
      diff: selectedSummary?.current.revenue - selectedSummary?.previous.revenue,
    },
    orders: {
      current: selectedSummary?.current.orders,
      last: selectedSummary?.previous.orders,
      growthPercent: selectedSummary?.growth.orders,
      diff: selectedSummary?.current.orders - selectedSummary?.previous.orders,
    },
    customers: {
      current: selectedSummary?.current.customers,
      last: selectedSummary?.previous.customers,
      growthPercent: selectedSummary?.growth.customers,
      diff: selectedSummary?.current.customers - selectedSummary?.previous.customers,
    },
    aov: {
      current: selectedSummary?.current.aov,
      last: selectedSummary?.previous.aov,
      growthPercent: selectedSummary?.growth.aov,
      diff: selectedSummary?.current.aov - selectedSummary?.previous.aov,
    },
  }

  const summaryKeys = ['revenue', 'orders', 'customers', 'aov'] as const

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
          <div className="flex flex-wrap gap-3 my-2">
            <div className="flex align-items-center">
              <RadioButton
                inputId="ytd"
                name="period"
                value="mtd"
                onChange={(e) => setPeriod(e.value)}
                checked={period === 'mtd'}
              />
              <label htmlFor="ytd" className="ml-2">
                MTD
              </label>
            </div>
            <div className="flex align-items-center">
              <RadioButton
                inputId="ytd"
                name="period"
                value="ytd"
                onChange={(e) => setPeriod(e.value)}
                checked={period === 'ytd'}
              />
              <label htmlFor="ytd" className="ml-2">
                YTD
              </label>
            </div>
          </div>
          <div className="grid">
            {summaryKeys.map((itemKey) => {
              const isMoney = itemKey === 'revenue' || itemKey === 'aov'
              return (
                mappedSummary[itemKey].current && (
                  <div className="col-12 lg:col-6 xl:col-3" key={itemKey}>
                    <Card
                      pt={{
                        root: {
                          style: {
                            border: `1px solid ${
                              mappedSummary[itemKey]?.growthPercent > 0
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
                            {formatCurrency(Number(mappedSummary[itemKey]?.current), true, isMoney)}
                          </div>
                        </div>
                        <div
                          className="flex align-items-center justify-content-center border-round"
                          style={{ width: '2.5rem', height: '2.5rem' }}
                        >
                          <i className="pi pi-chart-line text-blue-500 text-xl" />
                        </div>
                      </div>
                      <div className="text-400 font-medium text-sm">
                        Previous {period === 'mtd' ? 'Month' : 'Year'}
                        <span className="ml-2">
                          {formatCurrency(Number(mappedSummary[itemKey]?.last), true, isMoney)}
                        </span>
                      </div>
                      <span
                        className={`${
                          mappedSummary[itemKey]?.growthPercent > 0
                            ? 'text-green-500'
                            : 'text-red-500'
                        } font-medium`}
                      >
                        {mappedSummary[itemKey]?.growthPercent != null
                          ? `${mappedSummary[itemKey].growthPercent.toFixed(2)} %`
                          : '0.00 %'}

                        {mappedSummary[itemKey]?.diff > 0 ? (
                          <i className="ml-1 pi pi-arrow-up-right text-green-500 text-sm" />
                        ) : (
                          <i className="ml-1 pi pi-arrow-down-right text-red-500 text-sm" />
                        )}
                      </span>
                      <span className="ml-2 text-500">
                        vs last {period === 'mtd' ? 'month' : 'year'}
                      </span>
                    </Card>
                  </div>
                )
              )
            })}
          </div>
          <div className="grid mt-4">
            <div className="col-12 lg:col-6 xl:col-3">
              <Card className="text-center">
                <h5>Loyalty Benchmarking</h5>
                <div className="text-xs italic">
                  <i>
                    Overall health score of customer relationships based on stability and recurring
                    engagement
                  </i>
                </div>
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
                  <h5>Rentention Index</h5>
                  <div className="text-xs italic">
                    <i>
                      Percentage of customers from the previous period who remained active in the
                      last 3 months.
                    </i>
                  </div>
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
                  <h5>Purchase Frequency</h5>
                  <div className="text-xs italic">
                    <i>
                      Percentage of customers who placed two or more separate orders within the last
                      3 months
                    </i>
                  </div>
                  <Knob
                    value={Number(RPR.toFixed(2))}
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
                <h5>Acquisition vs. Loyalty</h5>
                <div className="text-xs italic">
                  <i>Breakdown of first-time buyers compared to returning existing customers</i>
                </div>
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
                    labels: trendLabel,
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
                    labels: trendLabel,
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
                  data={{ labels: trendLabel, datasets: [{ data: aovData, label: 'AOV Trend' }] }}
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
