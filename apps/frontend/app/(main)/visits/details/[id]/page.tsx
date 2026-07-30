'use client'

import { groupVisitItems } from '../../functions/groupVisitItems'
import {
  CompetitorProduct,
  IInquiry,
  IResObject,
  IVisit,
  IVisitItem,
  VisitCompetitor,
} from '@saleshub-tsm/types'
import { useParams } from 'next/navigation'
import { Card } from 'primereact/card'
import { Tag } from 'primereact/tag'

import OfferedProduct from '@/app/(main)/components/product/OfferedProduct'
import VisitDetailHeader from '@/app/(main)/customers/components/VisitDetailHeader'
import { useFetch } from '@/hooks/useFetch'
import { formatCurrency } from '@/lib/formatter'

interface IInquiryResponse {
  inquiries: IInquiry[]
}
const VisitDetailsPage = () => {
  const { id } = useParams()

  const { data: visitDetailsData } = useFetch<IResObject<IVisit>>(
    `visit/${id}/details`,
    undefined,
    { enabled: !!id }
  )

  const { data: inquiriesData } = useFetch<IResObject<IInquiryResponse>>(
    `inquiry/${id}`,
    undefined,
    {
      enabled: !!id,
    }
  )

  const salesVisit = visitDetailsData?.data as IVisit

  const customer = salesVisit?.customer
  const inquiries = inquiriesData?.data?.inquiries || []
  const visit_items = salesVisit?.visit_items

  const visitCompetitors = visitDetailsData?.data?.visit_competitors || []

  const competitors: VisitCompetitor[] = visitCompetitors.map((vc) => ({
    competitor_id: vc.competitor_id,
    name: vc.competitors?.name,
    products: vc.competitor_products,
  }))
  const { distributor: offeredDistributor, groceries: offeredGroceries } = groupVisitItems(
    visit_items ?? []
  )

  return (
    <>
      <VisitDetailHeader customer={customer} salesVisit={salesVisit} />

      {((offeredDistributor?.length ?? 0) > 0 || (offeredGroceries?.length ?? 0) > 0) && (
        <div className="card p-3">
          <h5 className="ml-2">Offered Items</h5>

          {/* ================= DISTRIBUTOR ================= */}
          {(offeredDistributor?.length ?? 0) > 0 && (
            <Card className="w-full h-full shadow-none px-0" title="DISTRIBUTOR">
              {offeredDistributor?.map(
                (distributorItem: { category: string; items: IVisitItem[] }) => {
                  const category = distributorItem.category
                  const visitItems = distributorItem.items
                  return (
                    <div key={`distributor-${category}`} className="py-3">
                      <h5>{category}</h5>
                      <div className="grid">
                        {visitItems.map((visitItem) => {
                          return (
                            <OfferedProduct
                              visitItem={visitItem}
                              key={visitItem.id.toString()}
                              defaultOpen={false}
                            />
                          )
                        })}
                      </div>
                    </div>
                  )
                }
              )}
            </Card>
          )}

          {/* ================= GROCERIES ================= */}
          {(offeredGroceries?.length ?? 0) > 0 && (
            <Card className="w-full h-full shadow-none px-0" title="GROCERIES">
              <div className="grid">
                {offeredGroceries?.map((groceriesItem: IVisitItem) => {
                  return (
                    <OfferedProduct
                      defaultOpen={false}
                      visitItem={groceriesItem}
                      key={groceriesItem.id.toString()}
                    />
                  )
                })}
              </div>
            </Card>
          )}
        </div>
      )}

      {inquiries.length > 0 && (
        <div className="card">
          <h5 className="ml-2">Product Inquiries</h5>
          <div className="grid">
            {inquiries.map((inquiry: IInquiry) => (
              <div className="col-12 md:col-12 lg:col-12 flex" key={`inquiry-${inquiry.id}`}>
                <Card className="w-full h-full p-2">
                  <div className="flex flex-column w-full gap-3">
                    <div className="flex w-full align-items-start gap-3">
                      <div className="w-9 flex flex-column text-xs text-color-secondary font-medium pt-1">
                        <div className="text-lg font-bold text-color line-height-2">
                          {inquiry.product_name}
                        </div>
                        <div className="text-sm py-2 text-color-secondary line-height-3">
                          {inquiry.notes}
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            ))}
          </div>
        </div>
      )}

      {competitors.length > 0 && (
        <div className="card">
          <h5 className="ml-2">Competitors</h5>
          {/* Competitor */}
          {competitors.map((competitor: VisitCompetitor) => (
            <div className="col-12" key={`competitor-${competitor.competitor_id}`}>
              <Card className="w-full">
                <div className="flex flex-column gap-2">
                  {/* HEADER */}
                  <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center gap-2 pb-3 border-bottom-1 surface-border">
                    <div>
                      <div className="text-2xl font-bold text-900">{competitor.name}</div>

                      <div className="text-sm text-500 mt-1">
                        {competitor.products.length} Product
                        {competitor.products.length > 1 ? 's' : ''}
                      </div>
                    </div>
                  </div>

                  <h6 className="mb-1 ml-1">Competitor Products</h6>
                  {/* PRODUCT LIST */}
                  <div className="flex flex-column gap-2">
                    {competitor.products.map((product: CompetitorProduct) => (
                      <div
                        key={`product-${product.id}`}
                        className="surface-border border-round-sm border-1 p-3 lg:p-4"
                      >
                        {/* TOP SECTION */}
                        <div className="flex flex-column lg:flex-row lg:justify-content-between lg:align-items-start gap-3">
                          {/* LEFT */}
                          <div className="flex-1">
                            <div className="grid">
                              {/* PRODUCT */}
                              <div className="col-12">
                                <div className="text-500 text-sm mb-1">Product</div>

                                <div className="text-lg font-semibold text-900 line-height-3">
                                  {product.product_name}
                                </div>
                              </div>

                              {/* BRAND */}
                              <div className="col-12">
                                <div className="text-500 text-sm mb-1">Brand</div>

                                <div className="text-lg font-semibold text-900">
                                  {product.brand || '-'}
                                </div>
                              </div>

                              {/* PRICE + PROMO */}
                              <div className="col-12 md:col-2">
                                <div className="text-500 text-sm mb-1">Price</div>

                                <div className="flex align-items-center gap-2 flex-wrap">
                                  <div className="font-semibold text-900">
                                    {formatCurrency(Number(product.price), true, true)} /{' '}
                                    {product.unit || 'unit'}
                                  </div>

                                  {product.is_promo && <Tag value="Promo" severity="danger" />}
                                </div>
                              </div>

                              <div className="col-6 md:col-2">
                                <div className="text-500 text-sm mb-1">Monthly Usage</div>

                                <div className="font-semibold text-900">
                                  {product.monthly_usage !== undefined
                                    ? product.monthly_usage
                                    : '-'}{' '}
                                  / {product.unit || 'unit'}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* NOTES */}
                        {product.notes && (
                          <div className="mt-4 pt-3 border-top-1 surface-border">
                            <div className="text-500 text-sm mb-2">Notes</div>

                            <div className="surface-100 border-round-lg p-3 text-700 line-height-3">
                              {product.notes}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            </div>
          ))}
        </div>
      )}
    </>
  )
}

export default VisitDetailsPage
