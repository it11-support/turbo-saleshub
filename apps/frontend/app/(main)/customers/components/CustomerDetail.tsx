'use client'

import CustomerRangeMeter from './CustomerRangeMeter'
import { getMonthlySummary } from './functions'
import ProductCard from './ProductCard'
import PurchaseHistory from './PurchaseHistory'
import { faIdBadge } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { ICustomer, SuggestedItemsGrouped } from '@saleshub-tsm/types'
import { Accordion, AccordionTab } from 'primereact/accordion'
import { Column } from 'primereact/column'
import { DataTable } from 'primereact/datatable'
import { Divider } from 'primereact/divider'
import { TabPanel, TabView } from 'primereact/tabview'
import { useState } from 'react'

import useIsMobile from '@/layout/mobile/useIsMobile'
import { getActiveItems } from '@/lib/customers'
import { formatCurrency } from '@/lib/formatter'
import { parsePhone } from '@/lib/phoneParser'
import { ILastPurchase } from '@/types/customer'

export interface Props {
  customer: ICustomer | null
  suggestedItems: SuggestedItemsGrouped
  purchaseHistory?: {
    lastPurchase: ILastPurchase[]
    ordersByRange: { current: number; last3Months: number; last6Months: number }
    invoiceCountByRange: { current: number; last3Months: number; last6Months: number }
    purchaseValue: { current: number; last3Months: number; last6Months: number }
  }
}

type CustomerPurchase = {
  ItemCode: string
  ItemName: string
  QtyKg: number
  TotalSales: number
  count: number
  lastInvDate: Date
}
export const CustomerDetail = (props: Props) => {
  const { customer, suggestedItems, purchaseHistory } = props

  const allTimeActiveItems = getActiveItems(customer!)
  const sixMonthActiveItems = getActiveItems(customer!, 6)
  const threeMonthActiveItems = getActiveItems(customer!, 3)
  const summary = getMonthlySummary(customer?.sales_invoices || [])
  const isMobile = useIsMobile(768)
  const [active, setActive] = useState<number | null>(null)

  const formatDate = (value?: Date | string | null) => {
    if (!value) return ''

    // Konversi string ke Date jika perlu
    const date = value instanceof Date ? value : new Date(value)

    // Pastikan valid
    if (isNaN(date.getTime())) return ''

    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
    })
  }

  const salesBodyTemplate = (rowData: CustomerPurchase) => {
    return (
      <>
        <span className="p-column-title">Sales</span>
        {formatCurrency(rowData.TotalSales)}
      </>
    )
  }

  const lastInvDateBody = (rowData: CustomerPurchase) => {
    return (
      <>
        <span className="p-column-title">Last Invoice Date</span>
        {formatDate(rowData.lastInvDate)}
      </>
    )
  }

  const distributorItems = suggestedItems.distributor

  const opts = Array.from(new Set(distributorItems.map((item) => item.ProductCategory))).map(
    (category) => ({
      label: category,
      value: category,
    })
  )

  return (
    <>
      <TabView>
        <TabPanel header="Detail" leftIcon="pi pi-building mr-2">
          {customer?.subgroup && (
            <div className="p-2">
              <p className="m-0">
                <i className="pi pi-shopping-bag mr-2"></i>
                {customer?.subgroup.IndDesc}
              </p>
            </div>
          )}
          <div className="p-2">
            <p className="m-0">
              {customer?.Address} <span className="font-bold">[{customer?.City}]</span>
            </p>
          </div>
          {customer?.CntctPrsn && (
            <div className="p-2">
              <p className="m-0">
                <i className="pi pi-user mr-2" />
                {customer?.CntctPrsn}
              </p>
            </div>
          )}
          {customer?.Phone1 && (
            <div className="p-2">
              {parsePhone(customer?.Phone1).map((phone, index) => (
                <p className="m-0" key={index}>
                  {phone.number && phone.isMobile && <i className="pi pi-mobile mr-2" />}
                  {phone.number && !phone.isMobile && <i className="pi pi-phone mr-2" />}
                  {phone.number}
                </p>
              ))}
            </div>
          )}
          {customer?.Cellular && (
            <div className="p-2">
              {parsePhone(customer?.Cellular).map((phone, index) => (
                <p className="m-0" key={index}>
                  {phone.number && phone.isMobile && <i className="pi pi-mobile mr-2" />}
                  {phone.number && !phone.isMobile && <i className="pi pi-phone mr-2" />}
                  {phone.number}
                </p>
              ))}
            </div>
          )}

          {customer?.SlpCode && customer.SlpCode > 0 && (
            <>
              <Divider />
              <div className="p-2">
                <p className="m-0">
                  <FontAwesomeIcon icon={faIdBadge} className="mr-2" />
                  {customer?.SalesName}
                </p>
              </div>
            </>
          )}
        </TabPanel>
        <TabPanel header="Active Items" rightIcon="pi pi-shopping-cart ml-2">
          {allTimeActiveItems.length > 0 && (
            <>
              <p className="m-0 text-lg mb-2">Customer Active Items</p>
              <CustomerRangeMeter value={allTimeActiveItems.length} />
            </>
          )}
          <Accordion activeIndex={0} className="mt-5">
            <AccordionTab
              header={`3 Months Item ${
                threeMonthActiveItems.length > 0 ? `(${threeMonthActiveItems.length} items)` : ''
              }`}
            >
              <p className="m-0 text-lg mb-2">
                {threeMonthActiveItems.length > 0
                  ? `Total Active Items (${threeMonthActiveItems.length})`
                  : 'No Active Items'}
              </p>
              {threeMonthActiveItems.length > 0 && (
                <DataTable
                  value={threeMonthActiveItems}
                  paginator
                  rows={10}
                  paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                >
                  <Column field="ItemCode" header="Item Code" sortable hidden={isMobile}></Column>
                  <Column field="ItemName" header="Item Name" sortable></Column>
                  <Column
                    field="TotalSales"
                    header="Total Sales"
                    body={salesBodyTemplate}
                    sortable
                  ></Column>
                  <Column field="count" header="Total Orders" sortable></Column>
                  <Column
                    field="lastInvDate"
                    header="Last Invoice"
                    sortable
                    body={lastInvDateBody}
                    hidden={isMobile}
                  ></Column>
                </DataTable>
              )}
            </AccordionTab>
            <AccordionTab
              header={`6 Months Item ${
                sixMonthActiveItems.length > 0 ? `(${sixMonthActiveItems.length} items) ` : ''
              }`}
            >
              <p className="m-0 text-lg mb-2">
                Total Active Items{' '}
                <span className="font-bold">{sixMonthActiveItems.length} items</span>
              </p>
              {sixMonthActiveItems.length > 0 && (
                <DataTable
                  value={sixMonthActiveItems}
                  paginator
                  rows={10}
                  paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                >
                  <Column field="ItemCode" header="Item Code" sortable hidden={isMobile}></Column>
                  <Column field="ItemName" header="Item Name" sortable></Column>
                  <Column
                    field="TotalSales"
                    header="Total Sales"
                    body={salesBodyTemplate}
                    sortable
                  ></Column>
                  <Column field="count" header="Total Orders" sortable></Column>
                  <Column
                    field="lastInvDate"
                    header="Last Invoice"
                    sortable
                    body={lastInvDateBody}
                    hidden={isMobile}
                  ></Column>
                </DataTable>
              )}
            </AccordionTab>
            <AccordionTab
              header={`All time Item ${
                allTimeActiveItems.length > 0 ? `(${allTimeActiveItems.length} items)` : ''
              }`}
            >
              <p className="m-0 text-lg mb-2">
                Total Active Items{' '}
                <span className="font-bold">{allTimeActiveItems.length} items</span>
              </p>
              {allTimeActiveItems.length > 0 && (
                <DataTable
                  value={allTimeActiveItems}
                  paginator
                  rows={10}
                  paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                >
                  <Column field="ItemCode" header="Item Code" sortable hidden={isMobile}></Column>
                  <Column field="ItemName" header="Item Name" sortable></Column>
                  <Column
                    field="TotalSales"
                    header="Total Sales"
                    body={salesBodyTemplate}
                    sortable
                  ></Column>
                  <Column field="count" header="Total Orders" sortable></Column>
                  <Column
                    field="lastInvDate"
                    header="Last Invoice"
                    sortable
                    body={lastInvDateBody}
                    hidden={isMobile}
                  ></Column>
                </DataTable>
              )}
            </AccordionTab>
          </Accordion>
        </TabPanel>

        <TabPanel header="Recommended Items" rightIcon="pi pi-star ml-2">
          <Accordion activeIndex={active} onTabChange={(e) => setActive(e.index as number)}>
            {(['distributor', 'groceries'] as const).map((groupKey) => {
              const items = suggestedItems?.[groupKey] ?? []
              if (items.length === 0) return null
              const isDistributor = groupKey === 'distributor'
              return (
                <AccordionTab header={groupKey.toUpperCase()} key={groupKey}>
                  <div key={groupKey}>
                    <div className="grid">
                      {isDistributor &&
                        opts.length > 0 &&
                        opts.map((opt) => (
                          <div className="col-12" key={opt.label}>
                            <div className="mb-3 p-3">
                              <div className="px-4">
                                <span className="font-bold text-lg">{opt.label}</span>
                              </div>
                              <div className="grid">
                                {items
                                  .filter((item) => item.ProductCategory === opt.value)
                                  .map((item) => (
                                    <ProductCard key={item.ItemCode} item={item} />
                                  ))}
                              </div>
                            </div>
                          </div>
                        ))}
                      {items
                        .filter((item) => item.Distributor !== 'Y')
                        .map((item) => (
                          <ProductCard key={item.ItemCode} item={item} />
                        ))}
                    </div>
                  </div>
                </AccordionTab>
              )
            })}
          </Accordion>
        </TabPanel>
        <TabPanel header="Purchase History" rightIcon="pi pi-history ml-2">
          <PurchaseHistory {...{ purchaseHistory }} summary={summary} />
        </TabPanel>
      </TabView>
    </>
  )
}
