import SkeletonLoader from '../skeleton-loader/SkeletonLoader'
import { IDashboardData } from '@saleshub-tsm/types'
import ChartDataLabels, { Context } from 'chartjs-plugin-datalabels'
import { Card } from 'primereact/card'
import { Chart } from 'primereact/chart'
import { Knob } from 'primereact/knob'

type CustomerLoyaltyCardProps = {
  period: 'mtd' | 'ytd'
  isCustomerLoyaltyValidating: boolean
  customerLoyaltyData?: IDashboardData
}
const CustomerLoyaltyCard = ({
  isCustomerLoyaltyValidating,
  customerLoyaltyData,
  period,
}: CustomerLoyaltyCardProps) => {
  const CRR = customerLoyaltyData?.data?.CRR
  const nooVsExisting = customerLoyaltyData?.data?.nooVsExisting
  const RPR = customerLoyaltyData?.data?.RPR
  const RFM = customerLoyaltyData?.data?.RFM

  const rfmLabels = RFM?.map((item) => {
    return item.segment.replace('_', ' ')
  })

  const rfmData = RFM?.map((item) => {
    return item.count
  })

  const selectedNooVsExisting = nooVsExisting?.[period]

  const newVsReturningLabel = ['New Customer', 'Returning Customer']
  const newVsReturningData = [
    selectedNooVsExisting?.newCustomer,
    selectedNooVsExisting?.existingCustomer,
  ]

  return (
    <>
      <div className="grid mt-2">
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
    </>
  )
}

export default CustomerLoyaltyCard
