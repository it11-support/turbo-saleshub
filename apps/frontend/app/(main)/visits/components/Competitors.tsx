import CompetitorDialog from './CompetitorDialog'
import { CompetitorProduct, IResSingle, RawVisitCompetitor } from '@saleshub-tsm/types'
import { useParams } from 'next/navigation'
import { Badge } from 'primereact/badge'
import { Button } from 'primereact/button'
import { InputNumber } from 'primereact/inputnumber'
import { InputSwitch } from 'primereact/inputswitch'
import { InputText } from 'primereact/inputtext'
import { InputTextarea } from 'primereact/inputtextarea'
import { SelectButton, SelectButtonPassThroughMethodOptions } from 'primereact/selectbutton'
import { useEffect } from 'react'

import { useFetch } from '@/hooks/useFetch'
import { useCompetitorStore } from '@/stores/competitor'

const Competitors = () => {
  const { id } = useParams()
  const {
    selectedCompetitors,
    setCompetitors,
    removeCompetitorFromVisit,
    updateProduct,
    addProductToCompetitor,
    removeProductFromCompetitor,
    syncCompetitors,
  } = useCompetitorStore()

  const stockStatusOptions = [
    {
      label: 'Available',
      value: 'AVAILABLE',
      icon: 'pi pi-check-circle',
      color: 'text-green-500',
    },
    {
      label: 'Low',
      value: 'LOW',
      icon: 'pi pi-exclamation-triangle',
      color: 'text-orange-500',
    },
    {
      label: 'Empty',
      value: 'OUT_OF_STOCK',
      icon: 'pi pi-times-circle',
      color: 'text-red-500',
    },
  ]

  const { data: competitorData, mutate: mutateCompetitors } = useFetch<
    IResSingle<RawVisitCompetitor>
  >(`competitors/${id}`, undefined, { enabled: !!id })

  const competitors = competitorData?.data || []

  useEffect(() => {
    if (competitors && Array.isArray(competitors)) {
      const transformed = competitors.map((item) => ({
        competitor_id: item.competitor_id,
        name: item.competitors.name,
        products: item.competitor_products.map((p: CompetitorProduct) => ({
          id: p?.id?.toString(),
          product_name: p.product_name,
          brand: p.brand || '',
          price: Number(p.price),
          monthly_usage: Number(p.monthly_usage) || 0,
          is_promo: Boolean(p.is_promo),
          notes: p.notes || '',
          stock_status: p.stock_status,
          unit: p.unit || '',
        })),
      }))

      if (selectedCompetitors.length === 0) {
        setCompetitors(transformed)
      }
    }
  }, [competitorData, setCompetitors])

  return (
    <>
      <div className="col-12 xl:col-6 md:col-6 mt-5">
        <h5>Competitors</h5>
      </div>
      {selectedCompetitors.map((c, compIdx) => (
        <div key={compIdx} className="card p-3 mb-4 border-1 border-round surface-border shadow-1">
          {/* Header Kompetitor */}
          <div className="flex justify-content-between align-items-center mb-3">
            <div className="flex align-items-center gap-2">
              <span className="font-bold text-lg">{c.name}</span>
              {!c.competitor_id && <Badge value="New" severity="info" />}
            </div>
            <Button
              icon="pi pi-trash"
              severity="danger"
              text
              onClick={() => {
                removeCompetitorFromVisit(compIdx)
                syncCompetitors(Number(id))
                mutateCompetitors()
              }}
            />
          </div>

          {/* List Produk */}
          <div className="flex flex-column gap-2">
            {c.products.map((p, prodIdx) => (
              <div
                key={prodIdx}
                className="border-1 surface-border border-round mb-3 overflow-hidden"
              >
                {/* Header Produk: Judul & Tombol Hapus */}
                <div className="p-2 flex justify-content-between align-items-center">
                  <span className="text-xs font-bold text-600 ml-2">Product #{prodIdx + 1}</span>
                  {c.products.length > 1 && (
                    <Button
                      icon="pi pi-times"
                      rounded
                      text
                      raised
                      onClick={() => {
                        removeProductFromCompetitor(compIdx, prodIdx)
                        syncCompetitors(Number(id))
                        mutateCompetitors()
                      }}
                      severity="danger"
                      aria-label="Cancel"
                      className="p-0"
                    />
                  )}
                </div>

                {/* Body Produk: Input Fields */}
                <div className="p-3 grid p-fluid">
                  <div className="col-12 md:col-6">
                    <label className="text-xs font-semibold mb-1 block">Product Name</label>
                    <InputText
                      value={p.product_name}
                      onChange={(e) =>
                        updateProduct(compIdx, prodIdx, { product_name: e.target.value })
                      }
                      placeholder="Product Name..."
                    />
                  </div>

                  <div className="col-12 md:col-6">
                    <label className="text-xs font-semibold mb-1 block">Brand</label>
                    <InputText
                      value={p.brand || ''}
                      onChange={(e) => updateProduct(compIdx, prodIdx, { brand: e.target.value })}
                      placeholder="Brand..."
                    />
                  </div>

                  <div className="col-12 md:col-2">
                    <label className="text-xs font-semibold mb-1 block">Price</label>
                    <InputNumber
                      value={p.price}
                      onValueChange={(e) =>
                        updateProduct(compIdx, prodIdx, { price: e.value ?? 0 })
                      }
                      mode="currency"
                      currency="IDR"
                      locale="id-ID"
                      maxFractionDigits={0}
                    />
                  </div>
                  <div className="col-12 md:col-2">
                    <label className="text-xs font-semibold mb-1 block">Monthly Usage</label>
                    <InputNumber
                      value={p.monthly_usage}
                      onValueChange={(e) =>
                        updateProduct(compIdx, prodIdx, { monthly_usage: e.value ?? 0 })
                      }
                      mode="decimal"
                      maxFractionDigits={2}
                      locale="id-ID"
                    />
                  </div>

                  <div className="col-12 md:col-2">
                    <label className="text-xs font-semibold mb-1 block">Unit</label>
                    <InputText
                      value={p.unit || ''}
                      onChange={(e) => updateProduct(compIdx, prodIdx, { unit: e.target.value })}
                      placeholder="e.g Kg, Pcs etc..."
                    />
                  </div>

                  <div className="col-12 md:col-3 flex flex-column ">
                    <label className="text-xs font-semibold mb-1 block">Promo?</label>
                    <InputSwitch
                      checked={p.is_promo}
                      onChange={(e) => updateProduct(compIdx, prodIdx, { is_promo: e.value })}
                    />
                  </div>

                  <div className="col-12 md:col-3">
                    <label className="text-xs font-semibold mb-2 block">Stock Status</label>
                    <SelectButton
                      value={p.stock_status}
                      options={stockStatusOptions}
                      // Template untuk menampilkan Ikon + Teks
                      itemTemplate={(option) => (
                        <div className="flex align-items-center gap-2">
                          <i
                            className={`${option.icon} ${
                              !p.stock_status || p.stock_status !== option.value ? option.color : ''
                            }`}
                          ></i>
                          <span className="font-semibold text-xs md:text-sm">{option.label}</span>
                        </div>
                      )}
                      onChange={(e) =>
                        updateProduct(compIdx, prodIdx, {
                          stock_status: e.value as 'AVAILABLE' | 'LOW' | 'OUT_OF_STOCK',
                        })
                      }
                      className="w-full"
                      pt={{
                        button: ({ context }: SelectButtonPassThroughMethodOptions) => ({
                          className: `flex-1 justify-content-center p-2 ${
                            context.selected ? 'bg-teal-500 text-white' : 'bg-white surface-border'
                          }`,
                        }),
                      }}
                    />
                  </div>
                  <div className="col-12">
                    <label className="text-xs font-semibold mb-1 block">Notes</label>
                    <InputTextarea
                      value={p.notes || ''}
                      onChange={(e) => updateProduct(compIdx, prodIdx, { notes: e.target.value })}
                      placeholder="Add additional notes..."
                      rows={2}
                      autoResize
                    />
                  </div>
                </div>
              </div>
            ))}

            <div className="flex justify-content-center md:justify-content-start mb-3">
              <Button
                label="Add Product"
                icon="pi pi-plus-circle"
                text
                size="small"
                className="p-button-secondary font-medium"
                onClick={() => addProductToCompetitor(compIdx)}
              />
            </div>
          </div>
        </div>
      ))}

      <div className="col-12 xl:col-6 md:col-6">
        <CompetitorDialog />
      </div>
    </>
  )
}

export default Competitors
