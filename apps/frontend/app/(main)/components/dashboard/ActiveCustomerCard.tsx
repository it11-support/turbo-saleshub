import { exportToExcel } from './functions'
import { fetcher } from '../../lib'
import CustomerCell from '../customer/CustomerCell'
import SkeletonLoader from '../skeleton-loader/SkeletonLoader'
import { IDashboardData, IResSingle, ISalesPerson } from '@saleshub-tsm/types'
import { formatDate } from 'date-fns'
import { Button } from 'primereact/button'
import { Card } from 'primereact/card'
import { Column } from 'primereact/column'
import { DataTable } from 'primereact/datatable'
import { Dialog } from 'primereact/dialog'
import { Dropdown } from 'primereact/dropdown'
import { useMemo, useState } from 'react'
import useSWR from 'swr'

import { useAuth } from '@/layout/context/AuthContext'
import { createUrl } from '@/lib/api'
import { formatCurrency } from '@/lib/formatter'

type ActiveCustomerCardProps = {
  isActiveCustomersValidating: boolean
  activeCustomersData?: IDashboardData
}

const ActiveCustomerCard = ({
  isActiveCustomersValidating,
  activeCustomersData,
}: ActiveCustomerCardProps) => {
  const { isAdmin } = useAuth()
  const activeCustomers = activeCustomersData?.data?.activeCustomers
  const nonActive = activeCustomers?.nonActive
  const [showExport, setShowExport] = useState(false)
  const [selectedSlp, setSelectedSlp] = useState<number | null | undefined>(-1)

  const apiSalesPerson = createUrl('sales-persons', { withFilterUser: false })

  const { data: salesPersonData, mutate: mutateSalesPerson } = useSWR<IResSingle<ISalesPerson>>(
    apiSalesPerson,
    fetcher
  )

  const salesPersons = salesPersonData?.data

  const salesPersonOptions = useMemo(() => {
    return (
      salesPersons
        ?.filter((sp) => sp.user)
        .map((sp) => ({
          label: sp.SlpName,
          value: sp.SlpCode,
        })) || []
    )
  }, [salesPersons])

  const options = useMemo(() => {
    return [{ label: '-- All Sales Persons --', value: -1 }, ...salesPersonOptions]
  }, [salesPersonOptions])

  const filteredActiveCustomers = useMemo(() => {
    if (selectedSlp === -1) return nonActive?.customers || []

    return nonActive?.customers.filter((customer) => customer.SlpCode === selectedSlp) || []
  }, [nonActive?.customers, selectedSlp])

  const headerTitle = (
    <div className="flex align-items-center justify-content-between flex-wrap px-4 py-2">
      <div>
        <h3 className="m-0">List Of Lagged Transactions</h3>
        <small className="text-color-secondary">{`Lagged Transactions This Month (Total: ${nonActive?.total})`}</small>
      </div>
      {isAdmin && (
        <div className="flex gap-2">
          <Button
            label="Export"
            icon="pi pi-download"
            className="p-button-outlined p-button-sm"
            onClick={() => setShowExport(true)}
          />
        </div>
      )}
    </div>
  )

  return (
    <>
      <div className="mt-2">
        {isActiveCustomersValidating ? (
          <div className="col-12 flex flex-column px-0 gap-3">
            <SkeletonLoader type="rect" />
            <SkeletonLoader type="chart-horizontal" />
          </div>
        ) : (
          <div className="grid my-3">
            <div className="col-12 mt-4">
              <Card
                header={headerTitle}
                pt={{ root: { style: { borderRadius: '12px', padding: '1rem' } } }}
              >
                <DataTable
                  value={nonActive?.customers}
                  paginator
                  rows={10}
                  rowsPerPageOptions={[10, 25, 50]}
                  className="p-datatable-sm"
                  filterDisplay="menu"
                  emptyMessage="All customers are active."
                >
                  <Column field="CardCode" header="Code" sortable filter style={{ width: '15%' }} />
                  <Column
                    field="CardName"
                    header="Customer Name"
                    sortable
                    filter
                    body={(row) => <CustomerCell rowData={row} />}
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

      <Dialog
        header="Export Non Active Customers"
        visible={showExport}
        onHide={() => {
          if (!showExport) return
          setShowExport(false)
        }}
        style={{ width: '50vw' }}
        breakpoints={{ '960px': '75vw', '641px': '100vw' }}
      >
        <div className="field col-12 md:col-12">
          <label htmlFor="SalesPerson" className="block font-bold mb-2 text-secondary">
            Sales Person
          </label>
          <Dropdown
            clearIcon="pi pi-times"
            showClear
            inputId="SalesPerson"
            optionLabel="label"
            optionValue="value"
            value={selectedSlp}
            onChange={(e) => setSelectedSlp(e.value)}
            onClick={() => {
              if (salesPersons?.length === 0) {
                mutateSalesPerson()
              }
            }}
            options={options}
            placeholder="Select Sales Person"
            className={`w-full h-11 flex items-center`}
          />
        </div>

        <div className="flex justify-end mt-4 gap-2">
          {/* Close button */}
          <Button
            label="Close"
            icon="pi pi-times"
            className="p-button-sm p-button-danger p-button-outlined"
            onClick={() => setShowExport(false)}
          />

          <Button
            label="Export"
            icon="pi pi-download"
            className="p-button-sm p-button-success p-button-outlined"
            onClick={() => exportToExcel(filteredActiveCustomers)}
          />
        </div>
      </Dialog>
    </>
  )
}

export default ActiveCustomerCard
