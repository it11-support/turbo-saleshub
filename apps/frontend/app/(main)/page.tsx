'use client'

import SkeletonLoader from './components/skeleton-loader/SkeletonLoader'
import { fetcher } from './lib'
import { LayoutContext } from '../../layout/context/layoutcontext'
import { IDashboardData } from '@saleshub-tsm/types'
import { TooltipItem } from 'chart.js'
import ChartDataLabels, { Context } from 'chartjs-plugin-datalabels'
import { getCookie } from 'cookies-next'
import { formatDate } from 'date-fns'
import { Card } from 'primereact/card'
import { Chart } from 'primereact/chart'
import { Column } from 'primereact/column'
import { DataTable } from 'primereact/datatable'
import { Knob } from 'primereact/knob'
import { SelectButton } from 'primereact/selectbutton'
import { useContext, useEffect, useState } from 'react'
import useSWR from 'swr'

import { useAuth } from '@/layout/context/AuthContext'
import { createUrl } from '@/lib/api'
import { formatCurrency } from '@/lib/formatter'

import 'chartjs-adapter-date-fns'

const Dashboard = () => {
  const { layoutConfig } = useContext(LayoutContext)

  const { isAdmin } = useAuth()

  const applyLightTheme = () => {}

  const applyDarkTheme = () => {}

  useEffect(() => {
    if (layoutConfig.colorScheme === 'light') {
      applyLightTheme()
    } else {
      applyDarkTheme()
    }
  }, [layoutConfig.colorScheme])

  const userCookie = getCookie('userData')
  const userData = userCookie ? JSON.parse(String(userCookie)) : null

  const salesPersonId = userData?.sales_person?.id

  const payload = {
    ...(salesPersonId ? { salesPersonId } : {}),
  }

  const url = createUrl('summary', payload)

  const { data, isValidating } = useSWR<IDashboardData>(url, fetcher, {
    revalidateOnFocus: false,
    keepPreviousData: true,
    dedupingInterval: 60000,
    revalidateIfStale: false,
    revalidateOnReconnect: true,
  })

  const apiCustomerLoyalty = createUrl('summary/customer-loyalty')

  const { data: customerLoyaltyData, isValidating: isCustomerLoyaltyValidating } =
    useSWR<IDashboardData>(apiCustomerLoyalty, fetcher, {
      revalidateOnFocus: false,
      keepPreviousData: true,
      dedupingInterval: 60000,
      revalidateIfStale: false,
      revalidateOnReconnect: true,
    })

  const apiActiveCustomers = createUrl('summary/active-customers')

  const { data: activeCustomersData, isValidating: isActiveCustomersValidating } =
    useSWR<IDashboardData>(apiActiveCustomers, fetcher, {
      revalidateOnFocus: false,
      keepPreviousData: true,
      dedupingInterval: 60000,
      revalidateIfStale: false,
      revalidateOnReconnect: true,
    })

  const CRR = customerLoyaltyData?.data?.CRR
  const nooVsExisting = customerLoyaltyData?.data?.nooVsExisting
  const RPR = customerLoyaltyData?.data?.RPR
  const RFM = customerLoyaltyData?.data?.RFM

  const activeCustomers = activeCustomersData?.data?.activeCustomers

  const { slpRevenue, productRevenueDistributor, productRevenueGrocery, monthlyTrend, summary } =
    data?.data || {}

  const trendLabel = monthlyTrend?.map(
    (item) => `${item.year}-${item.month.toString().padStart(2, '0')}`
  )

  const revenueData = monthlyTrend?.map((item) => item.revenue)

  const trendData = monthlyTrend?.map((item) => item.orders)

  const customerData = monthlyTrend?.map((item) => item.customers)

  const slpRevenueLabel = slpRevenue?.map((item) => item.slp)
  const slpRevenueData = slpRevenue?.map((item) => item.revenue)

  const productRevenueDistributorLabel = productRevenueDistributor?.map((item) => item.ItemName)
  const productRevenueDistributorData = productRevenueDistributor?.map((item) => item.revenue)

  const productRevenueGroceryLabel = productRevenueGrocery?.map((item) => item.ItemName)
  const productRevenueGroceryData = productRevenueGrocery?.map((item) => item.revenue)

  const baseColor = layoutConfig.colorScheme === 'light' ? '#2d353e' : '#f8f9fa'
  const [period, setPeriod] = useState<'mtd' | 'ytd'>('mtd')

  const basCustomers = activeCustomers?.baseCustomer
  const activeThisMonth = activeCustomers?.activeThisMonth
  const nonActive = activeCustomers?.noActive

  const rfmLabels = RFM?.map((item) => {
    return item.segment.replace('_', ' ')
  })

  const rfmData = RFM?.map((item) => {
    return item.count
  })

  const selectedSummary = summary?.[period]

  const selectedNooVsExisting = nooVsExisting?.[period]
  const newVsReturningLabel = ['New Customer', 'Returning Customer']
  const newVsReturningData = [
    selectedNooVsExisting?.newCustomer,
    selectedNooVsExisting?.existingCustomer,
  ]

  const mappedSummary = {
    revenue: {
      current: selectedSummary?.current.revenue,
      last: selectedSummary?.previous.revenue,
      growthPercent: selectedSummary?.growth.revenue,
      diff: (selectedSummary?.current?.revenue ?? 0) - (selectedSummary?.previous?.revenue ?? 0),
    },
    orders: {
      current: selectedSummary?.current.orders,
      last: selectedSummary?.previous.orders,
      growthPercent: selectedSummary?.growth.orders,
      diff: (selectedSummary?.current?.orders ?? 0) - (selectedSummary?.previous?.orders ?? 0),
    },
    customers: {
      current: selectedSummary?.current.customers,
      last: selectedSummary?.previous.customers,
      growthPercent: selectedSummary?.growth.customers,
      diff: (selectedSummary?.current?.customers ?? 0) - (selectedSummary?.previous.customers ?? 0),
    },
  }

  const summaryKeys = ['revenue', 'orders', 'customers'] as const

  return (
    <>
      <div className="flex flex-wrap gap-3 my-2">
        <div className="flex align-items-center">
          <SelectButton
            pt={{
              button: {
                className: 'p-button-sm p-2',
              },
            }}
            allowEmpty={false}
            value={period}
            onChange={(e) => setPeriod(e.value)}
            optionLabel="label"
            options={[
              { label: 'MTD', value: 'mtd' },
              { label: 'YTD', value: 'ytd' },
            ]}
          />
        </div>
      </div>
      <div className="grid">
        {(isValidating ? summaryKeys : summaryKeys).map((itemKey, index) => {
          if (isValidating) {
            return (
              <div className="col-12 lg:col-6 xl:col-4" key={`skeleton-${index}`}>
                <SkeletonLoader type="rect" />
              </div>
            )
          }

          const isMoney = itemKey === 'revenue'

          if (!mappedSummary[itemKey]?.current) return null

          return (
            <div className="col-12 lg:col-6 xl:col-4" key={itemKey}>
              <Card
                pt={{
                  root: {
                    style: {
                      border: `1px solid ${
                        (mappedSummary[itemKey]?.growthPercent ?? 0) > 0
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
                    <span className="block text-500 font-medium mb-3">{itemKey.toUpperCase()}</span>
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
                  {period === 'mtd' ? 'Same Month Last Year' : 'Same Period Last Year'}
                  <span className="ml-2">
                    {formatCurrency(Number(mappedSummary[itemKey]?.last), true, isMoney)}
                  </span>
                </div>

                <span
                  className={`${
                    (mappedSummary[itemKey]?.growthPercent ?? 0) > 0
                      ? 'text-green-500'
                      : 'text-red-500'
                  } font-medium`}
                >
                  {mappedSummary[itemKey]?.growthPercent != null
                    ? `${mappedSummary[itemKey]?.growthPercent?.toFixed(2)} %`
                    : '0.00 %'}

                  {mappedSummary[itemKey]?.diff > 0 ? (
                    <i className="ml-1 pi pi-arrow-up-right text-green-500 text-sm" />
                  ) : (
                    <i className="ml-1 pi pi-arrow-down-right text-red-500 text-sm" />
                  )}
                </span>

                <span className="ml-2 text-500">YoY</span>
              </Card>
            </div>
          )
        })}
      </div>

      <div className="grid mt-4">
        {isCustomerLoyaltyValidating ? (
          <div className="col-12 lg:col-6 xl:col-3">
            <SkeletonLoader type="circle" />
          </div>
        ) : (
          <div className="col-12 lg:col-6 xl:col-3">
            <Card className="text-center">
              <h5>Loyalty Benchmarking</h5>
              <div className="text-xs italic mb-2">
                <i>Customer Stability & Engagement Health Score</i>
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
        )}

        {isCustomerLoyaltyValidating ? (
          <div className="col-12 lg:col-6 xl:col-3">
            <SkeletonLoader type="circle" />
          </div>
        ) : (
          <div className="col-12 lg:col-6 xl:col-3">
            <Card className="text-center">
              <h5>Rentention Index</h5>
              <div className="text-xs italic mb-2">
                <i>3-Month Customer Retention Rate</i>
              </div>
              <Knob
                value={Number((CRR ?? 0).toFixed(2))}
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

        {isCustomerLoyaltyValidating ? (
          <div className="col-12 lg:col-6 xl:col-3">
            <SkeletonLoader type="circle" />
          </div>
        ) : (
          <div className="col-12 lg:col-6 xl:col-3">
            <Card className="text-center">
              <h5>Purchase Frequency</h5>
              <div className="text-xs italic mb-2">
                <i>Repeat Purchase Frequency</i>
              </div>
              <Knob
                value={Number((RPR ?? 0).toFixed(2))}
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

        {isCustomerLoyaltyValidating ? (
          <div className="col-12 lg:col-6 xl:col-3">
            <SkeletonLoader type="circle" />
          </div>
        ) : (
          <div className="col-12 lg:col-6 xl:col-3">
            <Card className="text-center">
              <h5>New vs Existing</h5>
              <div className="text-xs italic mb-2">
                <i>Breakdown of First-Time Buyers vs Existing </i>
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
        )}
      </div>
      {isActiveCustomersValidating ? (
        <div className="col-12 flex flex-column px-0 gap-3">
          <SkeletonLoader type="rect" />
          <SkeletonLoader type="chart-horizontal" />
        </div>
      ) : (
        <div className="grid my-3">
          {/* ROW 1: CARD SUMMARY LEBAR (Full Width) */}
          <div className="col-12">
            <Card pt={{ root: { style: { borderRadius: '12px', border: '' } } }}>
              <div className="grid align-items-center">
                {/* Base Customers */}
                <div className="col-12 md:col-3 border-right-1 surface-border">
                  <div className="flex flex-column align-items-center md:align-items-start p-3">
                    <span className="text-500 font-medium mb-2 uppercase">Base Customers</span>
                    <div className="flex align-items-center">
                      <i className="pi pi-users text-blue-500 text-3xl mr-3" />
                      <span className="text-900 font-bold text-4xl">
                        {basCustomers?.total ?? 0}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Active This Month */}
                <div className="col-12 md:col-3 border-right-1 surface-border">
                  <div className="flex flex-column align-items-center md:align-items-start p-3">
                    <span className="text-500 font-medium mb-2 uppercase">
                      No Transaction Customers
                    </span>
                    <div className="flex align-items-center">
                      <i className="pi pi-times-circle text-red-500 text-3xl mr-3" />
                      <span className="text-900 font-bold text-4xl">{nonActive?.total ?? 0}</span>
                    </div>
                    <div className="flex align-items-center mt-2"></div>
                  </div>
                </div>

                <div className="col-12 md:col-3 border-right-1 surface-border">
                  <div className="flex flex-column align-items-center md:align-items-start p-3">
                    <span className="text-500 font-medium mb-2 uppercase">Active This Month</span>
                    <div className="flex align-items-center">
                      <i className="pi pi-check-circle text-green-500 text-3xl mr-3" />
                      <span className="text-900 font-bold text-4xl">
                        {activeThisMonth?.total ?? 0}
                      </span>
                    </div>
                    <div className="flex align-items-center mt-2"></div>
                  </div>
                </div>

                {/* Penetration & Progress */}
                <div className="col-12 md:col-3">
                  <div className="flex flex-column p-3">
                    <div className="flex justify-content-between align-items-center mb-2">
                      <span className="text-500 font-medium uppercase">Penetration Rate</span>
                      <span className="text-purple-600 font-bold text-2xl">
                        {activeThisMonth?.penetration.toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 border-round" style={{ height: '12px' }}>
                      <div
                        className="bg-purple-500 border-round transition-all duration-1000"
                        style={{
                          width: `${activeThisMonth?.penetration}%`,
                          height: '100%',
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* ROW 2: NON ACTIVE CUSTOMERS TABLE */}
          <div className="col-12 mt-4">
            <Card
              title="Non Active Customers"
              subTitle={`Non Active Customers This Month (Total: ${nonActive?.total})`}
              pt={{ root: { style: { borderRadius: '12px', padding: '1rem' } } }}
            >
              <DataTable
                value={nonActive?.customers}
                paginator
                rows={10}
                rowsPerPageOptions={[10, 25, 50]}
                className="p-datatable-sm"
                filterDisplay="menu"
                emptyMessage="Hebat! Semua customer sudah bertransaksi."
              >
                <Column field="CardCode" header="Code" sortable filter style={{ width: '15%' }} />
                <Column
                  field="CardName"
                  header="Customer Name"
                  sortable
                  filter
                  style={{ width: '35%' }}
                />
                <Column
                  field="avgRevenuePerMonth"
                  header="AVG Revenue/Month"
                  sortable
                  filter
                  body={(row) => formatCurrency(row.avgRevenuePerMonth, true, true)}
                  style={{ width: '15%' }}
                />
                <Column
                  field="totalItems"
                  header="Total Items"
                  sortable
                  filter
                  body={(row) => `${row.totalItems} items`}
                  style={{ width: '15%' }}
                />
                <Column
                  field="lastTransactionDate"
                  header="Last Transaction"
                  sortable
                  filter
                  style={{ width: '20%' }}
                  body={(row) => formatDate(row.lastTransactionDate, ' MMMM d, yyyy')}
                />
                <Column
                  field="SalesName"
                  header="Sales Person"
                  sortable
                  filter
                  style={{ width: '30%' }}
                />
              </DataTable>
            </Card>
          </div>
        </div>
      )}

      <div className="grid mt-4 ">
        {isValidating ? (
          <SkeletonLoader type="chart-vertical" />
        ) : (
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
        )}

        {isValidating ? (
          <SkeletonLoader type="chart-vertical" />
        ) : (
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
        )}

        {isValidating ? (
          <SkeletonLoader type="chart-vertical" />
        ) : (
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
        )}
      </div>
      <div className="grid mt-2 ">
        {isValidating ? (
          <SkeletonLoader type="chart-horizontal" />
        ) : (
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
        )}

        <div className="col-12 flex flex-column px-0 gap-3">
          {isValidating ? (
            <SkeletonLoader type="chart-horizontal" />
          ) : (
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
          )}
          {isAdmin && (
            <div className="col-12 lg:col-12 xl:col-6">
              {isValidating ? (
                <SkeletonLoader type="chart-horizontal" />
              ) : (
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
              )}
            </div>
          )}
        </div>
      </div>
    </>
  )
}

export default Dashboard
