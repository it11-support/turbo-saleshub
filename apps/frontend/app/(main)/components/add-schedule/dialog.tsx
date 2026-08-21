'use client'

import { FormData, IResSingle, ISalesPerson, IVisit } from '@saleshub-tsm/types'
import { useEffect, useRef, useState } from 'react'
import { mutate } from 'swr'

import { BaseDialog, FormAutoComplete, FormCalendar, FormDropdown } from '@/components/base'
import { useFetch } from '@/hooks/useFetch'
import { useAuth } from '@/layout/context/AuthContext'
import { createUrl } from '@/lib/api'
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
    {
      withFilterUser: false,
    }
  )

  const salesPersons = salesPersonData?.data || []

  const validateForm = () => {
    const newErrors: Record<keyof FormData, string> = {
      salesPersonId: '',
      customer: '',
      scheduleDate: '',
    }

    // Sales Person hanya wajib untuk mode dengan SLP
    if (isAdmin && !formData.salesPersonId) {
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
  }, [isAdmin, mutateSalesPerson])

  useEffect(() => {
    if (activeDialog === 'schedule') {
      const salesPersonId = isAdmin ? null : Number(user?.sales_person?.id)

      setFormData((prev) => ({
        ...prev,
        salesPersonId,
        customer: null,
      }))

      if (isAdmin) {
        setSlpCode(null)
      } else {
        setSlpCode(null)
      }

      originalLimit.current = limit
      setLimit(100)
    } else {
      if (originalLimit.current !== null) {
        setLimit(originalLimit.current)
      }

      setFormData({
        salesPersonId: null,
        customer: null,
        scheduleDate: null,
      })

      setLocalSearch('')

      // Reset customer source
      setSlpCode(null)
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
  }, [activeDialog, formData.salesPersonId, localSearch, fetchCustomers, setSearch])

  useEffect(() => {
    if (!isAdmin || !formData.salesPersonId) return

    const slp = salesPersons?.find((sp) => sp.id === formData.salesPersonId)

    if (slp?.SlpCode != null) {
      setSlpCode(Number(slp.SlpCode))
    } else {
      setSlpCode(null)
    }

    // Admin menggunakan SLP, bukan potential customer
  }, [isAdmin, formData.salesPersonId, salesPersons, setSlpCode])

  useEffect(() => {
    if (customers.length === 0 && localSearch) {
      setErrors((prev) => ({
        ...prev,
        customer: 'Customer not found',
      }))
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
    if (!validateForm()) return

    try {
      const salesPersonId = isAdmin
        ? formData.salesPersonId
          ? Number(formData.salesPersonId)
          : undefined
        : user?.sales_person?.id
          ? Number(user.sales_person.id)
          : undefined

      const payload: Partial<IVisit> = {
        ...(salesPersonId ? { sales_person_id: salesPersonId } : {}),
        customer_id: Number(formData.customer?.id),
        visit_date: formData.scheduleDate,
      }

      const userId = isAdmin ? undefined : Number(user?.id)

      await createVisitSchedule(payload, userId)

      const dateStr = formData.scheduleDate
        ? new Date(formData.scheduleDate).toISOString().slice(0, 10)
        : new Date().toISOString().slice(0, 10)

      const schedulePayload: Record<string, any> = {
        page: 1,
        pageSize: 25,
        date: dateStr,
      }

      if (salesPersonId) {
        schedulePayload.salesPersonId = String(salesPersonId)
      }

      if (userId) {
        schedulePayload.userId = String(userId)
      }

      const scheduleUrl = createUrl('schedule', schedulePayload)
      mutate(scheduleUrl)

      hide()
    } catch (error) {
      console.error('CREATE SCHEDULE ERROR:', error)
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
              setFormData({
                ...formData,
                salesPersonId: e.value,
                customer: null,
              })

              if (errors.salesPersonId) {
                setErrors({
                  ...errors,
                  salesPersonId: '',
                })
              }
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
            setFormData({
              ...formData,
              customer: e.value,
            })

            if (e.value && typeof e.value !== 'string') {
              setErrors((prev) => ({
                ...prev,
                customer: '',
              }))
            }
          }}
          field="CardName"
          dropdown
          virtualScrollerOptions={{ itemSize: 38 }}
          // disabled={!formData.salesPersonId}
          error={errors.customer || undefined}
        />

        <FormCalendar
          id="scheduledDate"
          label="Set Visit Date"
          value={formData.scheduleDate}
          minDate={minDate}
          onChange={(e) => {
            setFormData({
              ...formData,
              scheduleDate: e.value as Date,
            })

            if (errors.scheduleDate) {
              setErrors({
                ...errors,
                scheduleDate: '',
              })
            }
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
