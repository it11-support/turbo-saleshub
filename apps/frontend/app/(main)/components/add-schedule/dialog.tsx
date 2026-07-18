'use client'

import { FormData, IResSingle, ISalesPerson, IVisit } from '@saleshub-tsm/types'
import { useEffect, useRef, useState } from 'react'

import { BaseDialog, FormAutoComplete, FormCalendar, FormDropdown } from '@/components/base'
import { useFetch } from '@/hooks/useFetch'
import { useAuth } from '@/layout/context/AuthContext'
import { useScheduleDialog, useScheduleStore } from '@/stores'
import { useCustomerStore } from '@/stores/customers'

const AddScheduleDialog = () => {
  const { activeDialog, hide } = useScheduleDialog()
  const { isAdmin, user } = useAuth()
  const [localSearch, setLocalSearch] = useState<string>('')
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

  const { data: salesPersonData, mutate: mutateSalesPerson } = useFetch<IResSingle<ISalesPerson>>(
    'sales-persons',
    { withFilterUser: false }
  )

  const salesPersons = salesPersonData?.data || []

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
      mutateSalesPerson()
    }
  }, [isAdmin])

  useEffect(() => {
    if (activeDialog === 'schedule') {
      const slpId = isAdmin ? null : Number(user?.sales_person?.id)
      setFormData((prev) => ({ ...prev, salesPersonId: slpId }))

      originalLimit.current = limit
      setLimit(100)
    } else {
      if (originalLimit.current !== null) setLimit(originalLimit.current)
      setFormData({ salesPersonId: null, customer: null, scheduleDate: null })
      setLocalSearch('')
    }
  }, [activeDialog, user, isAdmin])

  useEffect(() => {
    if (!activeDialog && originalLimit.current !== null) {
      setLimit(originalLimit.current)
    }
  }, [activeDialog])

  useEffect(() => {
    if (!activeDialog || !formData.salesPersonId) return

    const delay = setTimeout(() => {
      setSearch(localSearch)
      fetchCustomers()
    }, 500)

    return () => clearTimeout(delay)
  }, [localSearch, formData.salesPersonId])

  useEffect(() => {
    if (formData.salesPersonId) {
      const slp = salesPersons?.find((sp) => sp.id === formData.salesPersonId)

      setSlpCode(Number(slp?.SlpCode))
    }
  }, [formData.salesPersonId])

  useEffect(() => {
    if (customers.length === 0 && localSearch) {
      setErrors((prev) => ({ ...prev, customer: 'Customer not found' }))
    }
  }, [customers, localSearch])

  const salesPersonOptions =
    salesPersons
      ?.filter((sp) => sp.user)
      .map((sp: ISalesPerson) => ({
        label: sp.SlpName,
        value: sp.id,
      })) ?? []

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
    <BaseDialog
      title="Add Visit Schedule"
      visible={activeDialog === 'schedule'}
      onHide={hide}
      onConfirm={handleCreateSchedule}
      confirmLabel="Save"
      cancelLabel="Cancel"
    >
      <div className="grid">
        {isAdmin && (
          <FormDropdown
            id="salesPersonId"
            label="Sales Person"
            value={formData.salesPersonId}
            options={salesPersonOptions}
            onChange={(e) => {
              setFormData({ ...formData, salesPersonId: e.value, customer: null })
              if (errors.salesPersonId) setErrors({ ...errors, salesPersonId: '' })
            }}
            error={errors.salesPersonId || undefined}
            showClear
          />
        )}

        <FormAutoComplete
          id="customer"
          label="Select Customer"
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
          disabled={!formData.salesPersonId}
          error={errors.customer || undefined}
        />

        <FormCalendar
          id="scheduledDate"
          label="Set Visit Date"
          value={formData.scheduleDate}
          minDate={minDate}
          onChange={(e) => {
            setFormData({ ...formData, scheduleDate: e.value as Date })
            if (errors.scheduleDate) setErrors({ ...errors, scheduleDate: '' })
          }}
          showIcon
          required
          showButtonBar
          error={errors.scheduleDate || undefined}
        />
      </div>
    </BaseDialog>
  )
}

export default AddScheduleDialog
