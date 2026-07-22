import SkeletonLoader from '../skeleton-loader/SkeletonLoader'
import { IDashboardData } from '@saleshub-tsm/types'
import { TooltipItem } from 'chart.js'
import { Context } from 'chartjs-plugin-datalabels'
import { Card } from 'primereact/card'
import { useEffect, useRef, useState } from 'react'

import { ChartCard } from '@/components/base'
import { CHART_COLORS, MONTH_SHORT } from '@/lib/constants'
import { formatCurrency } from '@/lib/formatter'

type RevenueByAccountNameProps = {
  revenueByAccountCategoryData?: IDashboardData['data']
  isValidating?: boolean
}

const RevenueByAccountName = (props: RevenueByAccountNameProps) => {
  const { revenueByAccountCategoryData, isValidating } = props

  const revenueByAccountCategory = revenueByAccountCategoryData?.revenueByAccountCategory
  const yearlyData = (revenueByAccountCategory?.yearly ?? []).slice(-3)
  const monthlyData = revenueByAccountCategory?.monthly ?? []

  const years = yearlyData.map((y) => y.year)

  const acctRevenue = new Map<string, number>()
  yearlyData.forEach((y) => {
    y.data.forEach((d) => {
      if (!d.acctName) return
      acctRevenue.set(d.acctName, (acctRevenue.get(d.acctName) ?? 0) + d.revenue)
    })
  })

  const accts = Array.from(
    new Set([
      ...yearlyData.flatMap((y) => y.data.map((d) => d.acctName).filter(Boolean)),
      ...monthlyData.flatMap((m) => m.data.map((d) => d.acctName).filter(Boolean)),
    ])
  ).sort((a, b) => (acctRevenue.get(b) ?? 0) - (acctRevenue.get(a) ?? 0))

  const palette = [
    CHART_COLORS.blue,
    CHART_COLORS.green,
    CHART_COLORS.orange,
    CHART_COLORS.red,
    CHART_COLORS.purple,
    CHART_COLORS.cyan,
    CHART_COLORS.pink,
    CHART_COLORS.lime,
    CHART_COLORS.indigo,
  ]

  const [selected, setSelected] = useState<Set<string>>(new Set())
  const defaultAppliedRef = useRef(false)

  useEffect(() => {
    if (!defaultAppliedRef.current && accts.length > 0) {
      setSelected(new Set(accts.slice(0, 3)))
      defaultAppliedRef.current = true
    }
  }, [accts])

  const toggle = (acct: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(acct)) next.delete(acct)
      else next.add(acct)
      return next
    })
  }

  const visibleAccts = accts.filter((a) => selected.has(a))
  const visiblePalette = visibleAccts.map((a) => palette[accts.indexOf(a) % palette.length])

  // =====================
  // YEARLY
  // =====================
  const byAcct: Record<string, number[]> = {}
  const byAcctGrowth: Record<string, number[]> = {}
  accts.forEach((a) => {
    byAcct[a] = years.map(() => 0)
    byAcctGrowth[a] = years.map(() => 0)
  })
  yearlyData.forEach((y, yi) =>
    y.data.forEach((d) => {
      if (!d.acctName) return
      byAcct[d.acctName][yi] = d.revenue
      byAcctGrowth[d.acctName][yi] = d.growth ?? 0
    })
  )

  const chartDataYearly = {
    labels: years.map(String),
    datasets: visibleAccts.map((acct, i) => ({
      label: acct.replace('Revenue ', ''),
      data: byAcct[acct],
      growthData: byAcctGrowth[acct],
      borderColor: visiblePalette[i],
      backgroundColor: visiblePalette[i] + '33',
      pointBackgroundColor: visiblePalette[i],
      borderWidth: 2,
      tension: 0.4,
      pointRadius: 4,
      pointHoverRadius: 6,
      fill: true,
    })),
  }

  const chartOptionsYearly = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: (ctx: TooltipItem<'line'>) => {
            const growth = (ctx.dataset as any).growthData?.[ctx.dataIndex] ?? 0
            const arrow = growth >= 0 ? '▲' : '▼'
            return `${ctx.dataset.label}: ${formatCurrency(Number(ctx.raw), false, true)} (${arrow} ${Math.abs(growth).toFixed(1)}% YoY)`
          },
          footer: (items: TooltipItem<'line'>[]) => {
            const total = items.reduce((sum, item) => sum + Number(item.raw), 0)
            return [
              '_________________________________',
              `Total: ${formatCurrency(total, false, true)}`,
            ]
          },
        },
      },
      datalabels: {
        display: (ctx: Context) => ctx.dataIndex > 0,
        align: 'top',
        anchor: 'end',
        offset: -6,
        font: { size: 9, weight: 'bold' },
        color: (ctx: Context) => {
          const growth = (ctx.dataset as any).growthData?.[ctx.dataIndex] ?? 0
          return growth >= 0 ? '#16A34A' : '#DC2626'
        },
        formatter: (_: number, ctx: Context) => {
          const growth = (ctx.dataset as any).growthData?.[ctx.dataIndex] ?? 0
          return `${growth >= 0 ? '▲' : '▼'} ${Math.abs(growth).toFixed(1)}%`
        },
      },
    },
    scales: {
      x: { grid: { display: false } },
      y: {
        ticks: { callback: (value: string | number) => formatCurrency(Number(value), false, true) },
      },
    },
  }

  // =====================
  // MONTHLY
  // =====================
  const sortedMonths = [...monthlyData].sort((a, b) => a.month - b.month)
  const currentYear = years[years.length - 1] ?? new Date().getFullYear()
  const latestMonth = sortedMonths.length ? sortedMonths[sortedMonths.length - 1].month : 0

  const monthLabels = MONTH_SHORT.slice(0, latestMonth)
  const monthKeys = Array.from({ length: latestMonth }, (_, i) => i + 1)

  const byAcctMonth: Record<string, number[]> = {}
  const byAcctMonthGrowth: Record<string, number[]> = {}
  accts.forEach((a) => {
    byAcctMonth[a] = monthKeys.map(() => 0)
    byAcctMonthGrowth[a] = monthKeys.map(() => 0)
  })

  sortedMonths.forEach((m) => {
    const mi = m.month - 1
    m.data.forEach((d) => {
      if (!d.acctName) return
      if (d.year !== currentYear) return
      byAcctMonth[d.acctName][mi] = d.revenue
      byAcctMonthGrowth[d.acctName][mi] = d.growth ?? 0
    })
  })

  const chartDataMonthly = {
    labels: monthLabels,
    datasets: visibleAccts.map((acct, i) => ({
      label: acct.replace('Revenue ', ''),
      data: byAcctMonth[acct],
      growthData: byAcctMonthGrowth[acct],
      borderColor: visiblePalette[i],
      backgroundColor: visiblePalette[i] + '33',
      pointBackgroundColor: visiblePalette[i],
      borderWidth: 2,
      tension: 0.4,
      pointRadius: 3,
      pointHoverRadius: 6,
      fill: true,
    })),
  }

  const chartOptionsMonthly = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: (ctx: TooltipItem<'line'>) => {
            const growth = (ctx.dataset as any).growthData?.[ctx.dataIndex] ?? 0
            const arrow = growth >= 0 ? '▲' : '▼'
            return `${ctx.dataset.label}: ${formatCurrency(Number(ctx.raw), false, true)} (${arrow} ${Math.abs(growth).toFixed(1)}% YoY)`
          },
          footer: (items: TooltipItem<'line'>[]) => {
            const total = items.reduce((sum, item) => sum + Number(item.raw), 0)
            return [
              '_________________________________',
              `Total: ${formatCurrency(total, false, true)}`,
            ]
          },
        },
      },
      datalabels: {
        display: (ctx: Context) => ctx.dataIndex > 0,
        align: 'top',
        anchor: 'end',
        offset: -6,
        font: { size: 9, weight: 'bold' },
        color: (ctx: Context) => {
          const growth = (ctx.dataset as any).growthData?.[ctx.dataIndex] ?? 0
          return growth >= 0 ? '#16A34A' : '#DC2626'
        },
        formatter: (_: number, ctx: Context) => {
          const growth = (ctx.dataset as any).growthData?.[ctx.dataIndex] ?? 0
          return `${growth >= 0 ? '▲' : '▼'} ${Math.abs(growth).toFixed(1)}%`
        },
      },
    },
    scales: {
      x: { grid: { display: false } },
      y: {
        ticks: { callback: (value: string | number) => formatCurrency(Number(value), false, true) },
      },
    },
  }

  const headerTitle = (
    <div className="flex align-items-center justify-content-between flex-wrap">
      <div>
        <h2 className="text-2xl font-bold">Revenue by Account (COA)</h2>
      </div>
    </div>
  )

  return (
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
                style: { borderRadius: '12px', padding: '1rem' },
              },
              body: {
                style: { height: '100%', padding: '0.5rem', paddingBottom: '2rem' },
              },
              content: {
                style: { padding: '0.5rem', height: '100%' },
              },
            }}
          >
            <div className="flex flex-wrap gap-3 mb-3">
              {accts.map((acct) => {
                const color = palette[accts.indexOf(acct) % palette.length]
                return (
                  <label key={acct} className="flex align-items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selected.has(acct)}
                      onChange={() => toggle(acct)}
                      className="p-checkbox"
                      style={{
                        accentColor: color,
                        borderColor: color,
                      }}
                    />
                    <span className="text-sm">{acct.replace('Revenue ', '')}</span>
                  </label>
                )
              })}
            </div>

            <div className="grid">
              <div className="col-12 xl:col-4 px-2">
                <ChartCard
                  header={<div className="text-center font-bold">Yearly</div>}
                  className="h-full"
                  chartType="line"
                  chartData={chartDataYearly}
                  chartOptions={chartOptionsYearly}
                  chartHeight="350px"
                />
              </div>

              <div className="col-12 xl:col-8 px-2">
                <ChartCard
                  header={<div className="text-center font-bold">Monthly</div>}
                  className="h-full"
                  chartType="line"
                  chartData={chartDataMonthly}
                  chartOptions={chartOptionsMonthly}
                  chartHeight="350px"
                />
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}

export default RevenueByAccountName
