'use client'
import ActiveCustomerCard from './components/dashboard/ActiveCustomerCard'
import CustomerByItemRange from './components/dashboard/CustomerByItemRange'
import CustomerLoyaltyCard from './components/dashboard/CustomerLoyaltyCard'
import RevenueByProductCategory from './components/dashboard/RevenueByProductCategory'
import TopPerformingChart from './components/dashboard/TopPerformingChart'
import TrendChart from './components/dashboard/TrendChart'
import YoySummary from './components/dashboard/YoySummary'
import { fetcher } from './lib'
import { LayoutContext } from '../../layout/context/layoutcontext'
import { IDashboardData } from '@saleshub-tsm/types'
import { getCookie } from 'cookies-next'
import { SelectButton } from 'primereact/selectbutton'
import { useContext, useEffect, useState } from 'react'
import useSWR from 'swr'

import { createUrl } from '@/lib/api'

import 'chartjs-adapter-date-fns'

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

  const customerByItemRangeUrl = createUrl('summary/customer-by-range-item')

  const { data: customerByItemRange, isValidating: isCustomerByItemRangeValidating } =
    useSWR<IDashboardData>(customerByItemRangeUrl, fetcher, {
      revalidateOnFocus: false,
      keepPreviousData: true,
      dedupingInterval: 60000,
      revalidateIfStale: false,
      revalidateOnReconnect: true,
    })

  const customerByRangeItem = customerByItemRange?.data.customersByRangeItem || []

  const { data: activeCustomersData, isValidating: isActiveCustomersValidating } =
    useSWR<IDashboardData>(apiActiveCustomers, fetcher, {
      revalidateOnFocus: false,
      keepPreviousData: true,
      dedupingInterval: 60000,
      revalidateIfStale: false,
      revalidateOnReconnect: true,
    })

  const apiRevenueByCategory = createUrl('summary/revenue-by-category')

  const { data: revenueByCategoryData, isValidating: isRevenueByCategoryValidating } =
    useSWR<IDashboardData>(apiRevenueByCategory, fetcher, {
      revalidateOnFocus: false,
      keepPreviousData: true,
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
        revenueByCategoryData={revenueByCategoryData}
        period={period}
        isValidating={isRevenueByCategoryValidating}
      />
      <CustomerLoyaltyCard
        isCustomerLoyaltyValidating={isCustomerLoyaltyValidating}
        customerLoyaltyData={customerLoyaltyData}
      />

      <CustomerByItemRange
        isValidating={isCustomerByItemRangeValidating}
        customersByRangeItem={customerByRangeItem}
      />

      <ActiveCustomerCard
        isActiveCustomersValidating={isActiveCustomersValidating}
        activeCustomersData={activeCustomersData}
      />

      <TrendChart isValidating={isValidating} data={data} />

      <TopPerformingChart isValidating={isValidating} data={data} />
    </>
  )
}

export default Dashboard
