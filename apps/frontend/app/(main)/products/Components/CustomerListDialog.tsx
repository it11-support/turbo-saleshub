'use client'

import { Button } from 'primereact/button'
import { Column } from 'primereact/column'
import { DataTable } from 'primereact/datatable'
import { InputText } from 'primereact/inputtext'
import { useMemo, useState } from 'react'

import { BaseDialog } from '@/components/base'
import { formatCurrency } from '@/lib/formatter'

interface ProductCustomer {
  CardCode: string
  CardName: string | null
  lastPurchase: Date | null
  purchaseCount: number
  totalQty: number
  totalSales: number
  unitMsr?: string | null
}

interface CustomerListDialogProps {
  visible: boolean
  onHide: () => void
  title?: string
  customers: ProductCustomer[]
  productName?: string
}

const CustomerListDialog = ({
  visible,
  onHide,
  title = 'Customer List',
  customers,
  productName,
}: CustomerListDialogProps) => {
  const [search, setSearch] = useState('')

  const filteredCustomers = useMemo(() => {
    if (!search) return customers
    const keyword = search.toLowerCase()
    return customers.filter(
      (c) =>
        c.CardName?.toLowerCase().includes(keyword) || c.CardCode?.toLowerCase().includes(keyword)
    )
  }, [customers, search])

  const lastPurchaseTemplate = (customer: ProductCustomer) => {
    const date = customer.lastPurchase ? new Date(customer.lastPurchase) : null
    return <span className="text-sm">{date ? date.toLocaleDateString('id-ID') : '-'}</span>
  }

  const qtyTemplate = (customer: ProductCustomer) => {
    const unit = customer.unitMsr || '-'
    return (
      <span className="font-semibold">
        {customer.totalQty.toLocaleString('id-ID')} {unit}
      </span>
    )
  }

  return (
    <BaseDialog
      title={title}
      visible={visible}
      onHide={onHide}
      showFooter={false}
      style={{ width: '90vw', maxWidth: '900px' }}
      className="customer-list-dialog"
    >
      <div className="flex flex-column gap-3">
        {productName && (
          <div className="text-sm text-600">
            Product: <strong className="text-800">{productName}</strong>
          </div>
        )}

        <div className="p-inputgroup">
          <InputText
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search customer by name or code..."
            className="w-full"
          />
          {search && (
            <Button icon="pi pi-times" className="p-button-danger" onClick={() => setSearch('')} />
          )}
        </div>

        <DataTable
          value={filteredCustomers}
          emptyMessage="No customers found for this product"
          size="small"
          className="text-sm"
        >
          <Column
            header="Code / Name"
            body={(c: ProductCustomer) => (
              <div className="flex flex-column">
                <span className="font-semibold text-800">{c.CardCode}</span>
                <span className="text-sm text-600">{c.CardName || '-'}</span>
              </div>
            )}
            sortable
            style={{ minWidth: '220px' }}
          />
          <Column
            header="Last Purchase"
            body={(c: ProductCustomer) => lastPurchaseTemplate(c)}
            sortable
            style={{ minWidth: '140px' }}
          />
          <Column field="purchaseCount" header="Purchases" sortable style={{ minWidth: '120px' }} />
          <Column
            header="Total Qty"
            body={(c: ProductCustomer) => qtyTemplate(c)}
            sortable
            style={{ minWidth: '140px' }}
          />
          <Column
            header="Total Sales"
            body={(c: ProductCustomer) => (
              <span className="font-semibold">
                {formatCurrency(Number(c.totalSales), true, true)}
              </span>
            )}
            sortable
            style={{ minWidth: '160px' }}
          />
        </DataTable>

        <div className="text-sm text-600 mt-2">
          Showing {filteredCustomers.length} of {customers.length} customer(s)
        </div>
      </div>
    </BaseDialog>
  )
}

export default CustomerListDialog
