'use client'

import { useParams, useRouter } from 'next/navigation'
import { Button } from 'primereact/button'
import { Card } from 'primereact/card'
import { Checkbox } from 'primereact/checkbox'
import { Divider } from 'primereact/divider'
import { InputTextarea } from 'primereact/inputtextarea'
import { useEffect } from 'react'

import useIsMobile from '@/layout/mobile/useIsMobile'
import { formatCurrency } from '@/lib/formatter'
import { parsePhone } from '@/lib/phoneParser'
import { useSalesVisit, useScheduleStore } from '@/stores'

const VisitsPage = () => {
  const salesVisitStore = useSalesVisit()
  const {
    fetchSalesVisit,
    salesVisit,
    offeredItems,
    setOfferedItems,
    syncOfferedItems,
    loading,
    visitNote,
    setVisitNote,
    endVisit,
  } = salesVisitStore
  const { fetchScheduleByDate, currentDate } = useScheduleStore()
  const { id } = useParams()
  const router = useRouter()
  const isMobile = useIsMobile()

  useEffect(() => {
    fetchSalesVisit(Number(id))
  }, [])

  const handleToggleOffered = (productId: number, checked?: boolean) => {
    const value = checked ?? false
    const next = value
      ? offeredItems.some((i) => i.product_id === productId)
        ? offeredItems.map((i) => (i.product_id === productId ? { ...i, offered: true } : i))
        : [...offeredItems, { product_id: productId, offered: true, notes: '' }]
      : offeredItems.filter((i) => i.product_id !== productId)

    setOfferedItems(next)
  }

  const handleChangeNote = (itemId: number, notes: string) => {
    setOfferedItems(offeredItems.map((x) => (x.product_id === itemId ? { ...x, notes } : x)))
  }

  const handleEndVisit = async () => {
    await syncOfferedItems()
    await endVisit().then(() => {
      fetchScheduleByDate(salesVisit.sales_person_id, currentDate)
      router.back()
    })
  }

  const { suggestedItems, customer } = salesVisit

  return (
    <>
      <div className="card p-3">
        <div className="col-12 flex justify-content-start align-items-center">
          <Button
            label="Back"
            icon="pi pi-chevron-left"
            severity="danger"
            size="small"
            outlined
            onClick={() => history.back()}
          />
        </div>
        <p className="m-0 text-2xl">{customer?.CardName}</p>
        <div className="flex-1 px-0 py-2">
          {customer?.subgroup && (
            <div className="p-2">
              <p className="m-0">
                <i className="pi pi-tags mr-2" style={{ color: 'var(--teal-500)' }}></i>
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
        </div>
        <Divider />

        <div className="grid">
          <div className="col-12 xl:col-6 md:col-6">
            <div className="p-2">
              <label htmlFor={`note-${salesVisit.id}`} className="block mb-2">
                Visit Note
              </label>
              <InputTextarea
                id={`note-${salesVisit.id}`}
                rows={2}
                autoResize
                value={visitNote}
                onChange={(e) => setVisitNote(e.target.value)}
                placeholder="Visit notes"
                className="w-full"
              />
            </div>
          </div>
        </div>
        <Divider />
        <h5 className="ml-2">Suggested Items</h5>

        <div className="grid">
          {suggestedItems?.map((item) => {
            const offeredItem = offeredItems.find((i) => i.product_id === item.id)

            return (
              <div className="col-12 lg:col-6 xl:col-4" key={item.ItemCode}>
                <Card
                  className="mb-3 min-h-[180px]"
                  pt={{
                    root: {
                      style: {
                        minHeight: '100%',
                      },
                    },
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
                    {/* IMAGE */}
                    {/* <div className="w-[80px] h-[80px] flex-shrink-0 flex items-center justify-center">
                      <ProductImage code={item.ItemCode} alt={item.ItemName || ''} />
                    </div> */}

                    {/* TEXT */}
                    <div className="flex flex-col items-start justify-start">
                      <div className="font-bold text-base leading-tight line-clamp-2">
                        {item.ItemName}
                        <div className="mt-1 text-sm font-semibold mt-3">
                          {formatCurrency(Number(item.MinPrice), true, true)} -{' '}
                          {formatCurrency(Number(item.MaxPrice), true, true)}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="grid py-2">
                      <div className="col-12 md:col-4">
                        <div className="field-checkbox mb-0">
                          <Checkbox
                            inputId={`${item.ItemCode}`}
                            value={true}
                            checked={offeredItem?.offered ?? false}
                            onChange={(e) => handleToggleOffered(Number(item.id), e.checked)}
                          />
                          <label htmlFor={`${item.ItemCode}`}>Offered</label>
                        </div>
                      </div>
                    </div>
                  </div>
                  {(offeredItem?.offered ?? false) && (
                    <div className="col-12">
                      <div className="field">
                        <label htmlFor={`note-${item.id}`} className="block mb-1">
                          Notes
                        </label>
                        <InputTextarea
                          id={`note-${item.ItemCode}`}
                          rows={2}
                          autoResize
                          value={offeredItem?.notes || ''}
                          onChange={(e) => handleChangeNote(Number(item.id), e.target.value)}
                          placeholder="e.g. Customer response"
                          className="w-full"
                        />
                      </div>
                    </div>
                  )}
                </Card>
              </div>
            )
          })}
        </div>

        <div
          className={isMobile ? 'fixed left-0 right-0 z-50 border-t px-5 pt-3' : ''}
          style={
            isMobile
              ? {
                  bottom: 'calc(52px + env(safe-area-inset-bottom))',
                  backgroundColor: 'var(--surface-card)',
                }
              : {}
          }
        >
          <div className="w-full sm:max-w-full md:max-w-md lg:max-w-full xl:max-w-full mx-auto">
            <div className="w-full flex flex-wrap align-items-center justify-content-center gap-3">
              {salesVisit?.status && salesVisit.status.toLowerCase() !== 'completed' && (
                <Button
                  label="Save"
                  size="small"
                  icon="pi pi-save"
                  severity="warning"
                  disabled={!offeredItems.length || offeredItems.some((i) => !i.offered)}
                  onClick={async () => {
                    await syncOfferedItems().then(() => {
                      fetchScheduleByDate(salesVisit.sales_person_id, currentDate)
                      router.back()
                    })
                  }}
                  loading={loading}
                />
              )}

              {offeredItems.length > 0 && offeredItems.some((i) => i.offered) && (
                <Button
                  label="End Visit"
                  size="small"
                  icon="pi pi-check-circle"
                  severity="success"
                  disabled={!offeredItems.length}
                  onClick={handleEndVisit}
                  loading={loading}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default VisitsPage
