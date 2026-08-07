import { ProductCoverageSummary } from '@saleshub-tsm/types'
import { Button } from 'primereact/button'
import { Dialog } from 'primereact/dialog'
import { InputText } from 'primereact/inputtext'
import { useMemo, useState } from 'react'

import { formatDate } from '@/lib/dateUtils'
import { formatCurrency } from '@/lib/formatter'

type Props = {
  visible: boolean
  onHide: () => void
  productCoverage: ProductCoverageSummary
}

const ProductCoverageDetail = ({ visible, onHide, productCoverage }: Props) => {
  const [keyword, setKeyword] = useState('')

  const { summary, items } = productCoverage
  const filteredItems = useMemo(() => {
    if (!keyword.trim()) return items

    const search = keyword.toLowerCase()

    return items.filter(
      (item) =>
        item.product.ItemCode.toLowerCase().includes(search) ||
        item.product.ItemName?.toLowerCase().includes(search)
    )
  }, [items, keyword])

  const keyProductCount = filteredItems.filter((item) => item.isKeyProduct).length

  return (
    <Dialog
      visible={visible}
      onHide={onHide}
      header="Product Coverage Details"
      style={{ width: '900px', maxWidth: '95vw' }}
      maximizable
      draggable={false}
      blockScroll
    >
      <div className="flex flex-column gap-3">
        <div className="text-sm text-500">
          {summary.orderedItems} of {summary.totalItems} products ordered this month (
          {summary.coverage.toFixed(2)}%)
        </div>
        <div className="col-12 sm:col-6 md:col-4">
          <div className="p-inputgroup flex-1">
            <span className="p-inputgroup-addon">
              <i className="pi pi-search" />
            </span>
            <InputText
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Search..."
              className="w-full p-inputtext-sm"
            />
            {keyword && (
              <Button icon="pi pi-times" severity="danger" onClick={() => setKeyword('')} />
            )}
          </div>
        </div>

        <div className="flex flex-column gap-2 max-h-30rem overflow-auto">
          {filteredItems.map((item, index) => (
            <div key={item.product.ItemCode}>
              {index === 0 && keyProductCount > 0 && (
                <div className="mb-2 flex align-items-center gap-2">
                  <i className="pi pi-star-fill text-yellow-500" />
                  <span className="font-semibold">Key Products ({keyProductCount})</span>
                </div>
              )}

              {index === keyProductCount && (
                <>
                  <div className="my-4 " />

                  <div className="mb-2 flex align-items-center gap-2">
                    <i className="pi pi-box text-500" />
                    <span className="font-semibold">
                      All Other Products ({filteredItems.length - keyProductCount})
                    </span>
                  </div>
                </>
              )}

              <div
                className={`border-round border-1 p-3 flex justify-content-between align-items-center ${item.isKeyProduct ? 'border-left-4 border-green-400' : 'border-200'}`}
              >
                <div className="flex align-items-start gap-3">
                  <div
                    className={`font-semibold ${item.isKeyProduct ? 'text-yellow-600' : 'text-500'}`}
                    style={{ width: 28 }}
                  >
                    #{index + 1}
                  </div>

                  <div>
                    <div className="flex align-items-center gap-2 flex-wrap">
                      <span className="font-semibold">{item.product.ItemName}</span>

                      <small className="text-500">({item.product.ItemCode})</small>
                    </div>

                    {item.revenueMtd! > 0 && (
                      <div className="mt-2 border-t ">
                        <div className="text-xs tracking-wide text-500">Revenue (MTD)</div>
                        <div className="text-lg font-semibold">
                          {formatCurrency(item.revenueMtd, true, true)}
                        </div>
                      </div>
                    )}
                    <div className="mt-1 text-sm text-500">
                      Last Purchase • {formatDate(item.lastPurchaseDate)}
                    </div>
                  </div>
                </div>

                {item.orderedThisMonth ? (
                  <div
                    className="flex align-items-center gap-2 text-green-600"
                    title="Purchased this month"
                  >
                    <i className="pi pi-shopping-cart text-lg" />
                  </div>
                ) : (
                  <div
                    className="flex align-items-center gap-2 text-red-500"
                    title="Not purchased this month"
                  >
                    <i className="pi pi-times-circle text-lg" />
                  </div>
                )}
              </div>
            </div>
          ))}

          {filteredItems.length === 0 && (
            <div className="py-6 text-center text-500">No products found.</div>
          )}
        </div>
      </div>
    </Dialog>
  )
}

export default ProductCoverageDetail
