'use client'

import { LayoutContext } from '../../layout/context/layoutcontext'
import { useContext, useEffect } from 'react'

import { formatCurrency } from '@/lib/formatter'
import { useDashboardStore } from '@/stores'

const Dashboard = () => {
  const { layoutConfig } = useContext(LayoutContext)
  const dashboard = useDashboardStore()

  const { monthToDateSummary } = dashboard

  const applyLightTheme = () => {}

  const applyDarkTheme = () => {}

  useEffect(() => {
    dashboard.fetchSalesSummary()
  }, [])

  useEffect(() => {
    if (layoutConfig.colorScheme === 'light') {
      applyLightTheme()
    } else {
      applyDarkTheme()
    }
  }, [layoutConfig.colorScheme])

  return (
    <>
      <div className="grid">
        {Object.keys(monthToDateSummary).map((itemKey) => {
          const isMoney = itemKey === 'revenue' || itemKey === 'aov'
          return (
            monthToDateSummary[itemKey].current && (
              <div className="col-12 lg:col-6 xl:col-3" key={itemKey}>
                <div className="card mb-0">
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
                </div>
              </div>
            )
          )
        })}
      </div>
    </>
  )
}

export default Dashboard
