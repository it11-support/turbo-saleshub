import { exportToExcel } from './functions'
import CustomerCell from '../customer/CustomerCell'
import SkeletonLoader from '../skeleton-loader/SkeletonLoader'
import { ICustomerExtended, IDashboardData, IResSingle, ISalesPerson } from '@saleshub-tsm/types'
import { formatDate, subMonths } from 'date-fns'
import { Button } from 'primereact/button'
import { Card } from 'primereact/card'
import { Dialog } from 'primereact/dialog'
import { Dropdown } from 'primereact/dropdown'
import { SelectButton } from 'primereact/selectbutton'
import { useMemo, useState } from 'react'

import { BaseDataTable } from '@/components/base'
import { useFetch } from '@/hooks/useFetch'
import { useAuth } from '@/layout/context/AuthContext'
import { formatCurrency } from '@/lib/formatter'

type ActiveCustomerCardProps = {
  isActiveCustomersValidating: boolean
  activeCustomersData?: IDashboardData['data']
}

const ActiveCustomerCard = ({
  isActiveCustomersValidating,
  activeCustomersData,
}: ActiveCustomerCardProps) => {
  const { isAdmin } = useAuth()
  const [filter, setFilter] = useState<0 | 1 | 2 | 3>(0)
  const activeCustomers = activeCustomersData?.activeCustomers
  const nonActive = activeCustomers?.nonActive
  const [showExport, setShowExport] = useState(false)
  const [selectedSlp, setSelectedSlp] = useState<number | null | undefined>(-1)

  const { data: salesPersonData, mutate: mutateSalesPerson } = useFetch<IResSingle<ISalesPerson>>(
    'sales-persons',
    { withFilterUser: false }
  )

  const salesPersons = salesPersonData?.data || []

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

  const filterItems = [
    { name: '1 M', value: 1 },
    { name: '2 M', value: 2 },
    { name: '3 M', value: 3 },
    { name: '> 3 M', value: 0 },
  ]

  const options = useMemo(() => {
    return [{ label: '-- All Sales Persons --', value: -1 }, ...salesPersonOptions]
  }, [salesPersonOptions])

  const filteredActiveCustomers = useMemo(() => {
    let customers = nonActive?.customers || []

    if (selectedSlp !== -1) {
      customers = customers.filter((customer) => customer.SlpCode === selectedSlp)
    }

    const now = new Date()

    if (filter > 0) {
      const start = subMonths(now, filter + 1)
      const end = subMonths(now, filter)

      customers = customers.filter((customer) => {
        if (!customer.lastTransactionDate) return false

        const date = new Date(customer.lastTransactionDate)
        return date >= start && date < end
      })
    } else if (filter === 0) {
      const moreThan3Months = subMonths(now, 4)

      customers = customers.filter((customer) => {
        if (!customer.lastTransactionDate) return false

        const date = new Date(customer.lastTransactionDate)
        return date < moreThan3Months
      })
    }

    return customers
  }, [nonActive?.customers, selectedSlp, filter])

  const headerTitle = (
    <div className="flex align-items-center justify-content-between flex-wrap py-2">
      <div>
        <h3 className="m-0">List Of Lagged Transactions</h3>
        <small className="text-color-secondary">{`Lagged Transactions This Month (Total: ${filteredActiveCustomers.length})`}</small>
        <div className="flex justify-content-start mt-4">
          <SelectButton
            value={filter}
            onChange={(e) => setFilter(e.value as 0 | 1 | 2 | 3)}
            optionLabel="name"
            options={filterItems}
          />
        </div>
      </div>
      {isAdmin && (
        <div className="flex gap-2 mt-4">
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

  const columns = [
    {
      field: 'CardCode',
      header: 'Code',
      sortable: true,
      filter: false,
      style: { width: '8%' },
    },
    {
      field: 'CardName',
      header: 'Customer Name',
      sortable: true,
      filter: false,
      body: (row: ICustomerExtended) => <CustomerCell rowData={row} />,
      style: { width: '30%' },
    },
    {
      field: 'avgRevenuePerMonth',
      header: 'AVG Revenue/Month',
      sortable: true,
      filter: false,
      body: (row: ICustomerExtended) => formatCurrency(Number(row.avgRevenuePerMonth), true, true),
      style: { width: '15%' },
    },
    {
      field: 'totalItems',
      header: 'Total Items',
      sortable: true,
      filter: false,
      body: (row: ICustomerExtended) => `${row.totalItems} items`,
      style: { width: '15%' },
    },
    {
      field: 'lastTransactionDate',
      header: 'Last Transaction',
      sortable: true,
      filter: false,
      style: { width: '15%' },
      body: (row: ICustomerExtended) => formatDate(row.lastTransactionDate, ' MMMM d, yyyy'),
    },
    {
      field: 'SalesName',
      header: 'Sales Person',
      sortable: true,
      style: { width: '30%' },
    },
  ]

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
              <Card>
                <BaseDataTable<ICustomerExtended>
                  value={filteredActiveCustomers}
                  columns={columns}
                  paginator
                  rows={10}
                  rowsPerPageOptions={[10, 25, 50]}
                  className="p-datatable-sm"
                  emptyMessage="All customers are active."
                  header={headerTitle}
                  globalFilterFields={['CardCode', 'CardName', 'SalesName']}
                />
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
          setSelectedSlp(-1)
        }}
        style={{ width: '20vw' }}
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
