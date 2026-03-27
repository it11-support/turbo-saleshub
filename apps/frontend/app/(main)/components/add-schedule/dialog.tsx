import { ICustomer, ISalesPerson, IVisit } from '@saleshub-tsm/types'
import { AutoComplete } from 'primereact/autocomplete'
import { Button } from 'primereact/button'
import { Calendar } from 'primereact/calendar'
import { Dialog } from 'primereact/dialog'
import { Dropdown } from 'primereact/dropdown'
import { Nullable } from 'primereact/ts-helpers'
import { useEffect, useRef, useState } from 'react'

import { useAuth } from '@/layout/context/AuthContext'
import { useScheduleDialog, useScheduleStore, useUserStore } from '@/stores'
import { useCustomerStore } from '@/stores/customers'

interface FormData {
  salesPersonId: number | null
  customer: ICustomer | null
  scheduleDate: Nullable<Date> | null
}

export default function AddScheduleDialog() {
  const { open, hide } = useScheduleDialog()
  const { isAdmin, user } = useAuth()
  const [localSearch, setLocalSearch] = useState<string>('')
  const { fetchSalesPersons, salesPersons } = useUserStore()
  const { fetchCustomers, customers, setSearch, setLimit, limit, setSlpCode } = useCustomerStore()
  const originalLimit = useRef<number | null>(null)
  const { createVisitSchedule } = useScheduleStore()

  const [formData, setFormData] = useState<FormData>({
    salesPersonId: null as number | null,
    customer: null,
    scheduleDate: null,
  })

  const minDate = new Date()

  useEffect(() => {
    if (isAdmin) {
      fetchSalesPersons(false)
    }
  }, [isAdmin])

  useEffect(() => {
    if (open) {
      const slpId = isAdmin ? null : Number(user?.sales_person?.id)
      setFormData((prev) => ({ ...prev, salesPersonId: slpId }))

      originalLimit.current = limit
      setLimit(100)
    } else {
      if (originalLimit.current !== null) setLimit(originalLimit.current)
      setFormData({ salesPersonId: null, customer: null, scheduleDate: null })
      setLocalSearch('')
    }
  }, [open, user, isAdmin])

  useEffect(() => {
    if (!open && originalLimit.current !== null) {
      setLimit(originalLimit.current)
    }
  }, [open])

  useEffect(() => {
    if (!open || !formData.salesPersonId) return

    const delay = setTimeout(() => {
      setSearch(localSearch)
      fetchCustomers()
    }, 500)

    return () => clearTimeout(delay)
  }, [localSearch, formData.salesPersonId])

  useEffect(() => {
    if (formData.salesPersonId) {
      const slp = salesPersons.find((sp) => sp.id === formData.salesPersonId)
      setSlpCode(Number(slp?.SlpCode))
    }
  }, [formData.salesPersonId])

  const handleCreateSchedule = async () => {
    try {
      const paylaod: Partial<IVisit> = {
        sales_person_id: Number(formData.salesPersonId),
        customer_id: Number(formData.customer?.id),
        visit_date: formData.scheduleDate,
      }

      await createVisitSchedule(paylaod)
      hide()
    } catch (error) {
      console.error(error)
      throw error
    }
  }

  return (
    <Dialog
      dismissableMask
      blockScroll
      header="Add Visit Schedule"
      visible={open}
      style={{ width: '100%', maxWidth: '500px' }}
      className="mx-auto md:w-30rem"
      onHide={hide}
      footer={
        <div className="flex justify-end">
          <Button
            outlined
            icon="pi pi-times"
            // size="small"
            severity="danger"
            className="btn btn-primary mr-2"
            onClick={hide}
            label="Cancel"
          />
          <Button
            outlined
            icon="pi pi-save"
            // size="small"
            severity="success"
            className="btn btn-primary mr-2"
            onClick={handleCreateSchedule}
            label="Save"
          />
        </div>
      }
    >
      <>
        {isAdmin && (
          <div className="inline-flex flex-column gap-2 w-full my-2">
            <label htmlFor="slpCode" className="text-primary-400 font-semibold">
              Sales Person
            </label>
            <Dropdown
              inputId="slpCode"
              value={formData.salesPersonId}
              options={salesPersons
                .filter((sp) => sp.user)
                .map((sp: ISalesPerson) => ({
                  label: sp.SlpName,
                  value: sp.id,
                }))}
              onChange={(e) => {
                setFormData({ ...formData, salesPersonId: e.value, customer: null })
              }}
              clearIcon="pi pi-times"
              showClear
            />
          </div>
        )}

        <div className="inline-flex flex-column gap-2 w-full my-2">
          <label htmlFor="customer" className="text-primary-400 font-semibold">
            Select Customer
          </label>
          <AutoComplete
            disabled={!formData.salesPersonId}
            inputId="customer"
            value={formData.customer}
            suggestions={customers}
            completeMethod={(e) => setLocalSearch(e.query ?? '')}
            onDropdownClick={(e) => {
              setLocalSearch(e.query ?? '')
              fetchCustomers()
            }}
            onChange={(e) => {
              setFormData({ ...formData, customer: e.value })
            }}
            field="CardName"
            dropdown
            virtualScrollerOptions={{ itemSize: 38 }}
          />
        </div>

        <div className="inline-flex flex-column gap-2 w-full my-2">
          <label htmlFor="scheduledDate" className="text-primary-400 font-semibold">
            Set Visit Date
          </label>
          <Calendar
            inputId="scheduledDate"
            value={formData.scheduleDate}
            minDate={minDate}
            onChange={(e) => setFormData({ ...formData, scheduleDate: e.value as Date })}
            showIcon
            required
          />
        </div>
      </>
    </Dialog>
  )
}
