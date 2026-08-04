import { CompetitorProduct, VisitCompetitor } from '@saleshub-tsm/types'
import { Card } from 'primereact/card'
import { Tag } from 'primereact/tag'

import { formatCurrency } from '@/lib/formatter'

type VisitCompetitorProps = {
  competitors: VisitCompetitor[]
}
const VisitCompetitiors = ({ competitors }: VisitCompetitorProps) => {
  if (!competitors?.length) return null
  return (
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
                              {product.monthly_usage !== undefined ? product.monthly_usage : '-'} /{' '}
                              {product.unit || 'unit'}
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
  )
}

export default VisitCompetitiors
