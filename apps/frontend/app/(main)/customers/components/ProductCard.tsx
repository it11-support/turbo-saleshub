'use client'

import ProductOverlayPanel from './OverlayPanel'
import { IProduct } from '@saleshub-tsm/types'
import { Card } from 'primereact/card'
import { OverlayPanel } from 'primereact/overlaypanel'
import { useRef } from 'react'

import { formatCurrency } from '@/lib/formatter'

type Props = {
  item: IProduct
}
const ProductCard = (props: Props) => {
  const { item } = props
  const overlayRefs = useRef<Record<string, OverlayPanel | null>>({})

  return (
    <div className="col-12 lg:col-6 xl:col-4" key={item.ItemCode}>
      <Card
        className="mb-3 p-0 h-[180px]"
        pt={{
          root: { style: { minHeight: '100%' } },
          body: { style: { padding: '0.5rem' } },
          content: { style: { padding: '0.5rem' } },
        }}
      >
        <div className="flex items-start gap-2 h-[28px] mb-2">
          <i
            className={`pi pi-star-fill text-xl text-yellow-500 transition-opacity ${
              item.product_developments?.length ? 'opacity-100' : 'opacity-0'
            }`}
          ></i>
          <p
            className={`font-italic transition-opacity text-gray-500 font-semibold ${
              item.product_developments?.length ? 'opacity-100' : 'opacity-0'
            }`}
          >
            Product Focus
          </p>
        </div>

        <div className="flex items-start gap-4 h-full">
          <div className="flex flex-col items-start justify-start">
            <div className="font-bold text-base leading-tight line-clamp-2">
              {item.ItemName}

              <div className="mt-1 text-sm font-semibold mt-3">
                {formatCurrency(Number(item.MinPrice), true, true)} -{' '}
                {formatCurrency(Number(item.MaxPrice), true, true)} / {item.SalUnitMsr}
              </div>
              {item.ProductInfo && (
                <div className="mt-3 text-sm">
                  <span
                    onClick={(e) => overlayRefs.current[item.ItemCode]?.toggle(e)}
                    className="cursor-pointer flex items-center gap-1 text-sm no-underline hover:opacity-80 transition-opacity"
                  >
                    <i className="pi pi-info-circle text-green-500"></i>
                    <span className="text-green-500 text-sm ">Info</span>
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>
      {item.ProductInfo && <ProductOverlayPanel item={item} overlayRefs={overlayRefs} />}
    </div>
  )
}

export default ProductCard
