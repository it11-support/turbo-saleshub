'use client'
import ActiveCustomerCard from './components/dashboard/ActiveCustomerCard'
import CustomerGrowth from './components/dashboard/CustomerGrowth'
import CustomerLoyaltyCard from './components/dashboard/CustomerLoyaltyCard'
import RevenueByProductCategory from './components/dashboard/RevenueByProductCategory'
import TopPerformingChart from './components/dashboard/TopPerformingChart'
import TrendChart from './components/dashboard/TrendChart'
import YoySummary from './components/dashboard/YoySummary'
import { LayoutContext } from '../../layout/context/layoutcontext'
import { IDashboardData, IResObject } from '@saleshub-tsm/types'
import { getCookie } from 'cookies-next'
import { SelectButton } from 'primereact/selectbutton'
import { useContext, useEffect, useState } from 'react'

import 'chartjs-adapter-date-fns'
import { useFetch } from '@/hooks/useFetch'

const Dashboard = () => {
  const { layoutConfig } = useContext(LayoutContext)

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

  const { data, isValidating } = useFetch<IResObject<IDashboardData['data']>>(
    'summary',
    undefined,
    {
      dedupingInterval: 60000,
      revalidateIfStale: false,
      revalidateOnReconnect: true,
    }
  )

  const { data: customerLoyaltyData, isValidating: isCustomerLoyaltyValidating } = useFetch<
    IResObject<IDashboardData['data']>
  >('summary/customer-loyalty', undefined, {
    dedupingInterval: 60000,
    revalidateIfStale: false,
    revalidateOnReconnect: true,
  })

  const { data: activeCustomersData, isValidating: isActiveCustomersValidating } = useFetch<
    IResObject<IDashboardData['data']>
  >('summary/active-customers', undefined, {
    dedupingInterval: 60000,
    revalidateIfStale: false,
    revalidateOnReconnect: true,
  })

  const { data: revenueByCategoryData, isValidating: isRevenueByCategoryValidating } = useFetch<
    IResObject<IDashboardData['data']>
  >('summary/revenue-by-category', undefined, {
    dedupingInterval: 60000,
    revalidateIfStale: false,
    revalidateOnReconnect: true,
  })

  const { data: customerTrendData, isValidating: isCustomerTrendValidating } = useFetch<
    IResObject<IDashboardData['data']>
  >('summary/customer-trend', salesPersonId ? { salesPersonId } : {}, {
    dedupingInterval: 60000,
    revalidateIfStale: false,
    revalidateOnReconnect: true,
  })

  const { summary } = data?.data || {}

  const [period, setPeriod] = useState<'mtd' | 'ytd'>('mtd')

  return (
    <>
      <div className="mb-3">
        <h2 className="text-2xl font-bold">Sales Overview</h2>
      </div>

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

      <YoySummary isValidating={isValidating} summary={summary} period={period} />
      <RevenueByProductCategory
        revenueByCategoryData={revenueByCategoryData?.data}
        period={period}
        isValidating={isRevenueByCategoryValidating}
      />
      <CustomerLoyaltyCard
        isCustomerLoyaltyValidating={isCustomerLoyaltyValidating}
        customerLoyaltyData={customerLoyaltyData?.data}
      />

      <ActiveCustomerCard
        isActiveCustomersValidating={isActiveCustomersValidating}
        activeCustomersData={activeCustomersData?.data}
      />

      <TrendChart isValidating={isValidating} data={data?.data} />
      <CustomerGrowth
        isValidating={isCustomerTrendValidating}
        customerTrendData={customerTrendData?.data}
      />
      <TopPerformingChart isValidating={isValidating} data={data?.data} />
    </>
  )
}

export default Dashboard
