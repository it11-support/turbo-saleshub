'use client'

import ProductOverlayPanel from '../../customers/components/OverlayPanel'
import CustomBadge from '../custom/badge'
import CustomChip from '../custom/chip'
import { IVisitItemConcern, ProductWithFrequency } from '@saleshub-tsm/types'
import { Button } from 'primereact/button'
import { Card } from 'primereact/card'
import { OverlayPanel } from 'primereact/overlaypanel'
import { RefObject, useRef } from 'react'

import { formatCurrency } from '@/lib/formatter'

type Props = {
  item: ProductWithFrequency
  category?: string
  visitItemConcerns?: IVisitItemConcern[]
  overlayRefs: RefObject<Record<string, OverlayPanel | null>>
  setSelectedProduct: (item: ProductWithFrequency | null) => void
  setShowOfferDialog: (show: boolean) => void
}
const ProductOfferCard = (props: Props) => {
  const { item, category, visitItemConcerns, setSelectedProduct, setShowOfferDialog } = props
  const overlayRefs = useRef<Record<string, OverlayPanel | null>>({})

  const handleProductOffer = (item: ProductWithFrequency) => {
    setSelectedProduct(item)
    setShowOfferDialog(true)
  }

  return (
    <Card
      className="mb-3 min-h-[180px]"
      pt={{
        root: { style: { minHeight: '100%' } },
        body: { style: { padding: '0.5rem' } },
        content: { style: { padding: '0.5rem' } },
      }}
    >
      <div className="flex items-start gap-4 h-full">
        <div className="flex flex-col items-start justify-start">
          <div className="font-bold text-base leading-tight line-clamp-2 text-color-secondary">
            {item.ItemName}
            <div className="mt-3 flex flex-wrap gap-2">
              {item.product_developments?.length ? (
                <CustomChip
                  label="Product Focus"
                  removable={false}
                  color="var(--purple-300)"
                  icon="pi pi-star"
                />
              ) : null}
              <CustomChip label={item.ItmsGrpNam} removable={false} />
              {item.Distributor === 'Y' && (
                <CustomChip label="Distributor" removable={false} color="var(--green-500)" />
              )}
              {item.ProductCategory && (
                <CustomChip label={category} removable={false} color="var(--orange-500)" />
              )}
            </div>
            <div className="mt-3 text-sm font-semibold text-primary">
              {formatCurrency(Number(item.MinPrice), true, true)} -{' '}
              {formatCurrency(Number(item.MaxPrice), true, true)}
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

      <div className="flex items-center mt-3 border-top-1 surface-border pt-3">
        <Button
          size="small"
          outlined
          label="Offer"
          icon="pi pi-arrow-circle-up"
          severity="success"
          onClick={() => handleProductOffer(item)}
        />
      </div>

      {visitItemConcerns?.map((c) => (
        <div key={`category-${item.ItemCode}-${c.id}`} className="mt-2 p-2 surface-50 border-round">
          <div className="flex justify-content-between align-items-center">
            <div className="font-semibold text-sm">{c.category.name}</div>
            <CustomBadge value={c.status.status} />
          </div>
          <div className="text-xs text-secondary mt-1">{c.notes}</div>
        </div>
      ))}
      {item.ProductInfo && <ProductOverlayPanel item={item} overlayRefs={overlayRefs} />}
    </Card>
  )
}

export default ProductOfferCard
