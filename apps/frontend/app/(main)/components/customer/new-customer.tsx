'use client'

import { FormData, IResSingle, ISalesPerson, ISubGroup, IVisit } from '@saleshub-tsm/types'
import dayjs from 'dayjs'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useRef, useState } from 'react'

import { BaseDialog, FormDropdown, FormInput, FormTextarea } from '@/components/base'
import { useFetch } from '@/hooks/useFetch'
import { useAuth } from '@/layout/context/AuthContext'
import { useScheduleDialog, useScheduleStore } from '@/stores'
import { useCustomerStore } from '@/stores/customers'

const NewCustomerDialog = () => {
  const { activeDialog, hide } = useScheduleDialog()
  const { isAdmin, user } = useAuth()
  const [localSearch, setLocalSearch] = useState<string>('')
  const { fetchCustomers, customers, setSearch, setLimit, limit, setSlpCode } = useCustomerStore()
  const originalLimit = useRef<number | null>(null)
  const { createVisitSchedule } = useScheduleStore()
  const router = useRouter()

  const { newCustomerForm, setNewCustomerForm, createNewCustomer } = useCustomerStore()

  const [formData, setFormData] = useState<FormData>({
    salesPersonId: null as number | null,
    customer: null,
    scheduleDate: null,
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateForm = () => {
    const errors: Record<string, string> = {}

    if (!newCustomerForm.CardName) {
      errors.CardName = 'Customer name is required'
    }

    if (!newCustomerForm.GroupName) {
      errors.GroupName = 'Group name is required'
    }

    if (!newCustomerForm.subgroup) {
      errors.subgroup = 'Contact person is required'
    }

    if (!newCustomerForm.CntctPrsn) {
      errors.CntctPrsn = 'Contact person is required'
    }

    if (!newCustomerForm.Phone1 && !newCustomerForm.Cellular) {
      errors.Phone1 = 'Phone or mobile number is required'
      errors.Cellular = 'Phone or mobile number is required'
    }

    if (!newCustomerForm.SlpCode) {
      errors.SlpCode = 'Sales person is required'
    }

    if (!newCustomerForm.City) {
      errors.City = 'City is required'
    }

    if (!newCustomerForm.Address) {
      errors.Address = 'Address is required'
    }

    if (errors) {
      setErrors(errors)
    }
    return Object.keys(errors).length === 0
  }

  const { data: salesPersonData, mutate: mutateSalesPerson } = useFetch<IResSingle<ISalesPerson>>(
    'sales-persons',
    { withFilterUser: false }
  )

  const { data: subgroupsData } = useFetch<IResSingle<ISubGroup>>('customers/subgroups')

  const { data: groupsData } = useFetch<IResSingle<{ GroupName: string }>>('customers/groups')

  const salesPersons = salesPersonData?.data

  const subgroupOptions = subgroupsData?.data || []
  const groupOptions =
    groupsData?.data?.map((g) => ({
      label: g.GroupName,
      value: g.GroupName,
    })) || []

  useEffect(() => {
    setNewCustomerForm({})
  }, [])

  useEffect(() => {
    if (isAdmin) {
      mutateSalesPerson()
    } else {
      setNewCustomerForm({
        ...newCustomerForm,
        SlpCode: user?.sales_person?.SlpCode || null,
        SalesName: user?.sales_person?.SlpName || null,
      })
    }
  }, [isAdmin, user])

  const handlePhoneChange =
    (field: 'Phone1' | 'Cellular') => (e: React.ChangeEvent<HTMLInputElement>) => {
      setNewCustomerForm({
        ...newCustomerForm,
        [field]: e.target.value,
      })
      if (errors[field]) {
        setErrors({ ...errors, [field]: '' })
      }
    }

  useEffect(() => {
    if (activeDialog === 'customer') {
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
  const submitHandler = async () => {
    if (validateForm()) {
      const res = await createNewCustomer()

      const paylaod: Partial<IVisit> = {
        sales_person_id: Number(res?.sales_person?.id),
        customer_id: Number(res?.id),
        visit_date: dayjs().format('YYYY-MM-DD'),
      }

      const newVisit = await createVisitSchedule(paylaod)
      if (newVisit?.id) {
        router.push(`/visits/${newVisit.id}`)
      }
      handleCloseDialog()
    }
    return
  }
  const handleSlpChange = (e: any) => {
    if (errors.SlpCode) {
      setErrors({ ...errors, SlpCode: '' })
    }

    const selectedSalesPerson = salesPersons?.find((sp) => sp.SlpCode === e.value)

    setNewCustomerForm({
      ...newCustomerForm,
      SlpCode: e.value,
      SalesName: selectedSalesPerson?.SlpName,
    })
  }

  const salesPersonOptions = useMemo(() => {
    return (
      salesPersons
        ?.filter((sp) => sp.user)
        .map((sp) => ({
          label: sp.SlpName,
          value: sp.SlpCode,
        })) ?? []
    )
  }, [salesPersons])

  const handleCloseDialog = () => {
    setErrors({})
    setNewCustomerForm({
      SlpCode: user?.sales_person?.SlpCode || null,
      SalesName: user?.sales_person?.SlpName || null,
    })
    hide()
  }

  return (
    <BaseDialog
      title="Add New Customer"
      visible={activeDialog === 'customer'}
      onHide={handleCloseDialog}
      onConfirm={submitHandler}
      confirmLabel="Save"
      cancelLabel="Cancel"
      className="mx-auto md:w-30rem"
      style={{ width: '100%', maxWidth: '500px' }}
    >
      <div className="grid">
        <FormInput
          id="CardName"
          label="Customer Name"
          value={newCustomerForm.CardName || ''}
          onChange={(e) => {
            setNewCustomerForm({
              ...newCustomerForm,
              CardName: e.target.value,
            })
            if (errors.CardName) {
              setErrors({ ...errors, CardName: '' })
            }
          }}
          placeholder="Customer Name"
          error={errors.CardName || undefined}
        />

        <FormDropdown
          id="GroupName"
          label="Group"
          value={newCustomerForm.GroupName || null}
          onChange={(e) => {
            setNewCustomerForm({
              ...newCustomerForm,
              GroupName: e.value,
            })
            if (errors.GroupName) {
              setErrors({ ...errors, GroupName: '' })
            }
          }}
          options={groupOptions}
          placeholder="Select Group"
          showClear
          filter
          filterBy="label"
          filterPlaceholder="Search Group"
          filterMatchMode="contains"
          error={errors.GroupName || undefined}
        />

        <FormDropdown
          id="subgroup"
          label="Subgroup"
          value={newCustomerForm.subgroup || null}
          onChange={(e) => {
            setNewCustomerForm({
              ...newCustomerForm,
              subgroup: e.value,
            })
            if (errors.subgroup) {
              setErrors({ ...errors, subgroup: '' })
            }
          }}
          options={subgroupOptions}
          optionLabel="IndName"
          optionValue="IndCode"
          placeholder="Select Subgroup"
          showClear
          filter
          filterBy="label"
          filterPlaceholder="Search Subgroup"
          filterMatchMode="contains"
          error={errors.subgroup || undefined}
        />

        <FormInput
          id="CntctPrsn"
          label="Contact Person"
          value={newCustomerForm.CntctPrsn || ''}
          onChange={(e) => {
            setNewCustomerForm({
              ...newCustomerForm,
              CntctPrsn: e.target.value,
            })
            if (errors.CntctPrsn) {
              setErrors({ ...errors, CntctPrsn: '' })
            }
          }}
          placeholder="Contact Person"
          error={errors.CntctPrsn || undefined}
        />

        <FormInput
          id="Phone1"
          label="Phone"
          value={newCustomerForm.Phone1 || ''}
          onChange={handlePhoneChange('Phone1')}
          placeholder="Phone"
          error={errors.Phone1 || undefined}
        />

        <FormInput
          id="Cellular"
          label="Cellular"
          value={newCustomerForm.Cellular || ''}
          onChange={handlePhoneChange('Cellular')}
          placeholder="Cellular"
          error={errors.Cellular || undefined}
        />

        {isAdmin && (
          <FormDropdown
            id="SalesPerson"
            label="Sales Person"
            value={newCustomerForm.SlpCode || null}
            onChange={handleSlpChange}
            options={salesPersonOptions}
            placeholder="Select Sales Person"
            showClear
            filter
            filterBy="label"
            filterPlaceholder="Search Sales Person"
            filterMatchMode="contains"
            error={errors.SlpCode || undefined}
          />
        )}

        <FormInput
          id="City"
          label="City"
          value={newCustomerForm.City || ''}
          onChange={(e) => {
            setNewCustomerForm({
              ...newCustomerForm,
              City: e.target.value,
            })
            if (errors.City) {
              setErrors({ ...errors, City: '' })
            }
          }}
          error={errors.City || undefined}
        />

        <FormTextarea
          id="Address"
          label="Address"
          value={newCustomerForm.Address || ''}
          onChange={(e) => {
            setNewCustomerForm({
              ...newCustomerForm,
              Address: e.target.value,
            })
            if (errors.Address) {
              setErrors({ ...errors, Address: '' })
            }
          }}
          rows={4}
          className="w-full"
          error={errors.Address || undefined}
        />
      </div>
    </BaseDialog>
  )
}

export default NewCustomerDialog
