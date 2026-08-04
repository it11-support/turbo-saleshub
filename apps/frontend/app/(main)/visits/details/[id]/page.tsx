'use client'

import VisitCompetitiors from '../../components/VisitCompetitors'
import { groupVisitItems } from '../../functions/groupVisitItems'
import { IInquiry, IResObject, IVisit, IVisitItem, VisitCompetitor } from '@saleshub-tsm/types'
import { useParams } from 'next/navigation'
import { Card } from 'primereact/card'

import OfferedProduct from '@/app/(main)/components/product/OfferedProduct'
import VisitDetailHeader from '@/app/(main)/customers/components/VisitDetailHeader'
import { useFetch } from '@/hooks/useFetch'

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

      {competitors.length > 0 && <VisitCompetitiors competitors={competitors} />}
    </>
  )
}

export default VisitDetailsPage
