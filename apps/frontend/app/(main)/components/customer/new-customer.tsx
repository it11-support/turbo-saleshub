'use client'

import { fetcher } from '../../lib'
import { FormData, IResSingle, ISalesPerson, IVisit } from '@saleshub-tsm/types'
import dayjs from 'dayjs'
import { useRouter } from 'next/navigation'
import { Button } from 'primereact/button'
import { Dialog } from 'primereact/dialog'
import { Dropdown, DropdownChangeEvent } from 'primereact/dropdown'
import { InputText } from 'primereact/inputtext'
import { InputTextarea } from 'primereact/inputtextarea'
import { useEffect, useMemo, useRef, useState } from 'react'
import useSWR from 'swr'

import { useAuth } from '@/layout/context/AuthContext'
import { createUrl } from '@/lib/api'
import { useScheduleDialog, useScheduleStore } from '@/stores'
import { useCustomerStore } from '@/stores/customers'

type CustomerPhone = 'Phone1' | 'Cellular'

export default function NewCustomerDialog() {
  const { activeDialog, hide } = useScheduleDialog()
  const { isAdmin, user } = useAuth()
  const [localSearch, setLocalSearch] = useState<string>('')
  const { fetchCustomers, customers, setSearch, setLimit, limit, setSlpCode } = useCustomerStore()
  const originalLimit = useRef<number | null>(null)
  const { createVisitSchedule } = useScheduleStore()
  const router = useRouter()

  const {
    newCustomerForm,
    setNewCustomerForm,
    fetchCustomerGroupOptions,
    groupOptions,
    fetchSubgroupOptions,
    subgroupOptions,
    createNewCustomer,
  } = useCustomerStore()

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

  const apiSalesPerson = createUrl('sales-persons', { withFilterUser: false })

  const { data: salesPersonData, mutate: mutateSalesPerson } = useSWR<IResSingle<ISalesPerson>>(
    apiSalesPerson,
    fetcher,
    {
      keepPreviousData: true,
      revalidateOnFocus: false,
    }
  )

  const salesPersons = salesPersonData?.data

  useEffect(() => {
    setNewCustomerForm({})
    fetchSubgroupOptions()
    fetchCustomerGroupOptions()
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

  const validateInput = (event: React.FormEvent<HTMLInputElement>, validatePattern: boolean) => {
    const target = event.target as HTMLInputElement

    if (errors[target.id]) {
      setErrors({ ...errors, [target.id]: '' })
    }

    if (validatePattern) {
      setNewCustomerForm({
        ...newCustomerForm,
        [target.id as CustomerPhone]: target.value,
      })

      return
    }

    target.value = newCustomerForm[target.id as CustomerPhone] || ''
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
  const handleSlpChange = (e: DropdownChangeEvent) => {
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
    return salesPersons
      ?.filter((sp) => sp.user)
      .map((sp) => ({
        label: sp.SlpName,
        value: sp.SlpCode,
      }))
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
    <Dialog
      dismissableMask
      blockScroll
      header="Add New Customer"
      visible={activeDialog === 'customer'}
      style={{ width: '100%', maxWidth: '500px' }}
      className="mx-auto md:w-30rem"
      onHide={handleCloseDialog}
      footer={
        <div className="flex justify-end">
          <Button
            outlined
            icon="pi pi-times"
            // size="small"
            severity="danger"
            className="btn btn-primary mr-2"
            onClick={handleCloseDialog}
            label="Cancel"
          />
          <Button
            outlined
            icon="pi pi-save"
            // size="small"
            severity="success"
            className="btn btn-primary mr-2"
            onClick={submitHandler}
            label="Save"
          />
        </div>
      }
    >
      <>
        <div className="grid">
          <div className="col-12">
            <div className="">
              <div className="p-fluid formgrid grid">
                <div className="field col-12 md:col-12">
                  <label htmlFor="CardName" className="block font-bold mb-2 text-secondary">
                    Customer Name
                  </label>
                  <InputText
                    id="CardName"
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
                    className={`w-full h-11 ${errors.CardName ? 'p-invalid' : ''}`}
                  />
                  {errors.CardName && <small className="p-error">{errors.CardName}</small>}
                </div>
                <div className="field col-12 md:col-12">
                  <label htmlFor="GroupName" className="block font-bold mb-2 text-secondary">
                    Group
                  </label>
                  <Dropdown
                    clearIcon="pi pi-times"
                    showClear
                    filter
                    filterBy="label"
                    filterPlaceholder="Search Group"
                    filterMatchMode="contains"
                    inputId="GroupName"
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
                    className={`w-full h-11 flex items-center ${
                      errors.GroupName ? 'p-invalid' : ''
                    }`}
                  />
                  {errors.GroupName && <small className="p-error">{errors.GroupName}</small>}
                </div>
                <div className="field col-12 md:col-12">
                  <label htmlFor="subgroup" className="block font-bold mb-2 text-secondary">
                    Subgroup
                  </label>
                  <Dropdown
                    inputId="subgroup"
                    clearIcon="pi pi-times"
                    showClear
                    filter
                    filterBy="label"
                    filterPlaceholder="Search Subgroup"
                    filterMatchMode="contains"
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
                    placeholder="Select Subgroup"
                    className={`w-full h-11 flex items-center ${
                      errors.subgroup ? 'p-invalid' : ''
                    }`}
                  />
                  {errors.subgroup && <small className="p-error">{errors.subgroup}</small>}
                </div>
                <div className="field col-12 md:col-12">
                  <label htmlFor="CntctPrsn" className="block font-bold mb-2 text-secondary">
                    Contact Person
                  </label>
                  <InputText
                    id="CntctPrsn"
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
                    className={`w-full h-11 ${errors.CntctPrsn ? 'p-invalid' : ''}`}
                  />
                  {errors.CntctPrsn && <small className="p-error">{errors.CntctPrsn}</small>}
                </div>
                <div className="field col-12 md:col-6">
                  <label htmlFor="Phone1" className="block font-bold mb-2 text-secondary">
                    Phone
                  </label>
                  <InputText
                    id="Phone1"
                    keyfilter={/^[+]?(\d{1,12})?$/}
                    validateOnly
                    value={newCustomerForm.Phone1 || ''}
                    onInput={validateInput}
                    placeholder="Phone"
                    className={`w-full h-11 ${errors.Phone1 ? 'p-invalid' : ''}`}
                  />
                  {errors.Phone1 && <small className="p-error">{errors.Phone1}</small>}
                </div>

                <div className="field col-12 md:col-6">
                  <label htmlFor="Cellular" className="block font-bold mb-2 text-secondary">
                    Cellular
                  </label>
                  <InputText
                    id="Cellular"
                    validateOnly
                    value={newCustomerForm.Cellular || ''}
                    keyfilter={/^[+]?(\d{1,14})?$/}
                    onInput={validateInput}
                    placeholder="Cellular"
                    className={`w-full h-11 ${errors.Cellular ? 'p-invalid' : ''}`}
                  />
                  {errors.Cellular && <small className="p-error">{errors.Cellular}</small>}
                </div>
                {isAdmin && (
                  <div className="field col-12 md:col-12">
                    <label htmlFor="SalesPerson" className="block font-bold mb-2 text-secondary">
                      Sales Person
                    </label>
                    <Dropdown
                      clearIcon="pi pi-times"
                      showClear
                      filter
                      filterBy="label"
                      filterPlaceholder="Search Sales Person"
                      filterMatchMode="contains"
                      inputId="SalesPerson"
                      value={newCustomerForm.SlpCode || null}
                      onChange={handleSlpChange}
                      onClick={() => {
                        if (isAdmin && salesPersons?.length === 0) {
                          mutateSalesPerson()
                        }
                      }}
                      options={salesPersonOptions}
                      placeholder="Select Sales Person"
                      className={`w-full h-11 flex items-center ${
                        errors.SlpCode ? 'p-invalid' : ''
                      }`}
                    />
                    {errors.SlpCode && <small className="p-error">{errors.SlpCode}</small>}
                  </div>
                )}
                <div className="field col-12 md:col-12">
                  <label htmlFor="City" className="block font-bold mb-2 text-secondary">
                    City
                  </label>
                  <InputText
                    id="City"
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
                    className={`w-full h-11 ${errors.City ? 'p-invalid' : ''}`}
                  />
                  {errors.City && <small className="p-error">{errors.City}</small>}
                </div>

                <div className="field col-12">
                  <label htmlFor="Address" className="block font-bold mb-2 text-secondary">
                    Address
                  </label>
                  <InputTextarea
                    id="Address"
                    rows={2}
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
                    className={`${errors.Address ? 'p-invalid' : ''}`}
                  />
                  {errors.Address && <small className="p-error">{errors.Address}</small>}
                </div>
              </div>
            </div>
          </div>
        </div>
      </>
    </Dialog>
  )
}
