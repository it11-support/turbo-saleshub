import SkeletonLoader from '../skeleton-loader/SkeletonLoader'
import { IDashboardData } from '@saleshub-tsm/types'
import { formatDate } from 'date-fns'
import { Card } from 'primereact/card'
import { Column } from 'primereact/column'
import { DataTable } from 'primereact/datatable'

import { formatCurrency } from '@/lib/formatter'

type ActiveCustomerCardProps = {
  isActiveCustomersValidating: boolean
  activeCustomersData?: IDashboardData
}

const ActiveCustomerCard = ({
  isActiveCustomersValidating,
  activeCustomersData,
}: ActiveCustomerCardProps) => {
  const activeCustomers = activeCustomersData?.data?.activeCustomers
  const baseCustomers = activeCustomers?.baseCustomer
  const nonActive = activeCustomers?.noActive
  const activeThisMonth = activeCustomers?.activeThisMonth

  return (
    <div className="mt-2">
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
                        {baseCustomers?.total ?? 0}
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
    </div>
  )
}

export default ActiveCustomerCard
