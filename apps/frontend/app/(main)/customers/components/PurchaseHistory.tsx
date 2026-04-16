'use client'

import SummaryChart from './SummaryChart'
import { ILastPurchase } from '@saleshub-tsm/types'
import { formatDate } from 'date-fns'
import { Card } from 'primereact/card'

import { formatCurrency } from '@/lib/formatter'

export type PurchaseHistoryProps = {
  purchaseHistory?: {
    lastPurchase: ILastPurchase[]
    ordersByRange: { current: number; last3Months: number; last6Months: number }
    invoiceCountByRange: { current: number; last3Months: number; last6Months: number }
    purchaseValue: { current: number; last3Months: number; last6Months: number }
  }
  summary: {
    month: string
    totalSales: number
    activeItems: number
  }[]
}
const PurchaseHistory = (props: PurchaseHistoryProps) => {
  const { purchaseHistory, summary } = props

  const orders = {
    ...purchaseHistory?.ordersByRange,
    label: 'Order Summary',
    key: 'orders',
  }

  const invoices = {
    ...purchaseHistory?.invoiceCountByRange,
    label: 'Invoice Summary',
    key: 'invoices',
  }

  const spending = {
    ...purchaseHistory?.purchaseValue,
    label: 'Purchase Value',
    key: 'value',
  }

  return (
    <div>
      <SummaryChart summary={summary} />
      <div className="p0">
        {purchaseHistory && purchaseHistory.lastPurchase && (
          <div className="flex flex-column gap-2">
            {purchaseHistory.lastPurchase && (
              <Card
                className="mb-3 shadow-2 px-0"
                title="Recent Purchases"
                pt={{
                  body: { className: 'p-3' },
                  content: { className: 'p-0' },
                }}
              >
                <div className="card-text">
                  <div className="flex justify-content-end gap-2 mb-3">
                    <span className="font-semibold">Purchase Date</span>
                    <span className="font-semibold">
                      {formatDate(purchaseHistory.lastPurchase?.[0].DocDate as Date, 'yyyy-MM-dd')}
                    </span>
                  </div>
                </div>

                <div className="w-full">
                  <div className="grid">
                    {purchaseHistory.lastPurchase.map((item: ILastPurchase, idx) => (
                      <div key={idx} className="col-12 md:col-6 lg:col-4">
                        <Card
                          className="mb-3 p-3 h-[180px] shadow-1 px-0"
                          pt={{
                            root: {
                              style: {
                                minHeight: '100%',
                              },
                            },
                          }}
                        >
                          <h5 className="text-gray-500 font-semibold">{item.Dscription}</h5>
                          {item.hasRetur && (
                            <div className="flex items-center gap-1 text-red-500 text-xs font-semibold mb-2">
                              <i className="pi pi-tag text-xs"></i>
                              <span className="uppercase tracking-wider">Retur</span>
                            </div>
                          )}
                          <div className="flex flex-column justify-content-between gap-1 text-sm">
                            <div className="flex flex-row justify-content-start gap-2 font-semibold">
                              <p>Qty</p>
                              <p>
                                {item.QtyKg} {item.unitMsr}
                              </p>
                            </div>
                            <div className="flex flex-row justify-content-start gap-3 font-semibold">
                              <p>Price</p>
                              <p>{formatCurrency(item.PriceBefDisc, true, true)}</p>
                            </div>
                            <div className="flex flex-row justify-content-start gap-3 font-semibold">
                              <p>Total</p>
                              <p>{formatCurrency(item.TotalSales, true, true)}</p>
                            </div>
                          </div>
                        </Card>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="w-full">
                  <div className="grid mt-5">
                    {[spending, orders, invoices].map((item, idx) => (
                      <div className="col-12 sm:col-6 md:col-4" key={idx}>
                        <Card
                          className="mb-3 p-3 h-[180px] shadow-2 px-0"
                          title={item.label}
                          pt={{
                            root: {
                              style: {
                                background: 'var(--green-600)',
                                color: '#ffffff',
                                borderRadius: '12px',
                                boxShadow: '0 6px 20px rgba(0,0,0,.25)',
                              },
                            },
                          }}
                        >
                          <div className="flex flex-column gap-2">
                            <div className="flex justify-content-between">
                              <span className="font-semibold">Current Month</span>
                              <span className="font-semibold">
                                {formatCurrency(item.current as number, true, item.key === 'value')}
                              </span>
                            </div>
                            <div className="flex justify-content-between">
                              <span className="font-semibold">Last 3 Months</span>
                              <span className="font-semibold">
                                {formatCurrency(
                                  item.last3Months as number,
                                  true,
                                  item.key === 'value'
                                )}
                              </span>
                            </div>
                            <div className="flex justify-content-between">
                              <span className="font-semibold">Last 6 Months</span>
                              <span className="font-semibold">
                                {formatCurrency(
                                  item.last6Months as number,
                                  true,
                                  item.key === 'value'
                                )}
                              </span>
                            </div>
                          </div>
                        </Card>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default PurchaseHistory
