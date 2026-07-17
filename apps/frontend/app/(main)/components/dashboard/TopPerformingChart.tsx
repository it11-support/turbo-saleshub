import TopProductChart from './TopProductChart'
import { IDashboardData } from '@saleshub-tsm/types'
import { useContext } from 'react'

import { LayoutContext } from '@/layout/context/layoutcontext'

type TopPerformingChartProps = {
  isValidating: boolean
  data?: IDashboardData['data']
}
const TopPerformingChart = ({ isValidating, data }: TopPerformingChartProps) => {
  const { productRevenueDistributor, productRevenueGrocery, productRevenueAll } = data || {}

  const productRevenueDistributorLabel = productRevenueDistributor?.map((item) => item.ItemName)
  const productRevenueDistributorData = productRevenueDistributor?.map((item) => item.revenue)
  const { layoutConfig } = useContext(LayoutContext)

  const baseColor = layoutConfig.colorScheme === 'light' ? '#2d353e' : '#f8f9fa'
  const productRevenueGroceryLabel = productRevenueGrocery?.map((item) => item.ItemName)
  const productRevenueGroceryData = productRevenueGrocery?.map((item) => item.revenue)

  const productRevenueAllLabel = productRevenueAll?.map((item) => item.ItemName)
  const productRevenueAllData = productRevenueAll?.map((item) => item.revenue)

  const charts = [
    {
      title: 'Top Performing Distributor Products',
      labels: productRevenueDistributorLabel,
      values: productRevenueDistributorData,
    },
    {
      title: 'Top Performing Trading Products',
      labels: productRevenueGroceryLabel,
      values: productRevenueGroceryData,
    },
    {
      title: 'Top Performing Products (All Products)',
      labels: productRevenueAllLabel,
      values: productRevenueAllData,
    },
  ]

  return (
    <div className="grid mt-2">
      {charts.map((chart) => (
        <div key={chart.title} className="col-12 lg:col-12 xl:col-6 p-2">
          <TopProductChart
            title={chart.title}
            labels={chart.labels}
            values={chart.values}
            isLoading={isValidating}
            baseColor={baseColor}
          />
        </div>
      ))}
    </div>
  )
}

export default TopPerformingChart
