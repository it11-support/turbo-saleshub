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

  const [errors, setErrors] = useState<Record<keyof FormData, string>>({
    salesPersonId: '',
    customer: '',
    scheduleDate: '',
  })

  const validateForm = () => {
    const newErrors: Record<keyof FormData, string> = {
      salesPersonId: '',
      customer: '',
      scheduleDate: '',
    }

    if (!formData.salesPersonId) {
      newErrors.salesPersonId = 'Sales Person is required'
    }

    if (!formData.customer) {
      newErrors.customer = 'Customer is required'
    } else if (typeof formData.customer === 'string' || !formData.customer.CardCode) {
      newErrors.customer = 'Please select a valid customer'
    }

    if (!formData.scheduleDate) {
      newErrors.scheduleDate = 'Schedule Date is required'
    }

    setErrors((prev) => ({
      ...prev,
      ...newErrors,
    }))

    return !Object.values(newErrors).some((err) => err !== '')
  }

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

  useEffect(() => {
    if (customers.length === 0 && localSearch) {
      setErrors((prev) => ({ ...prev, customer: 'Customer not found' }))
    }
  }, [customers, localSearch])
  const handleCreateSchedule = async () => {
    if (validateForm()) {
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
                if (errors.salesPersonId) setErrors({ ...errors, salesPersonId: '' })
              }}
              clearIcon="pi pi-times "
              className={`${errors.salesPersonId ? 'p-invalid' : ''}`}
              showClear
            />
            {errors.salesPersonId && <small className="p-error">{errors.salesPersonId}</small>}
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
              if (e.value && typeof e.value !== 'string') {
                setErrors((prev) => ({ ...prev, customer: '' }))
              }
            }}
            field="CardName"
            dropdown
            virtualScrollerOptions={{ itemSize: 38 }}
            className={`${errors.customer ? 'p-invalid' : ''}`}
          />
          {errors.customer && <small className="p-error">{errors.customer}</small>}
        </div>

        <div className="inline-flex flex-column gap-2 w-full my-2">
          <label htmlFor="scheduledDate" className="text-primary-400 font-semibold">
            Set Visit Date
          </label>
          <Calendar
            inputId="scheduledDate"
            value={formData.scheduleDate}
            minDate={minDate}
            onChange={(e) => {
              setFormData({ ...formData, scheduleDate: e.value as Date })
              if (errors.scheduleDate) setErrors({ ...errors, scheduleDate: '' })
            }}
            showIcon
            required
            showButtonBar
            className={`${errors.scheduleDate ? 'p-invalid' : ''}`}
          />
          {errors.scheduleDate && <small className="p-error">{errors.scheduleDate}</small>}
        </div>
      </>
    </Dialog>
  )
}
