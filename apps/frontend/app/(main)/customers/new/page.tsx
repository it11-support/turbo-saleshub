'use client'

import NavButton from '../components/NavButton'
import { IVisit } from '@saleshub-tsm/types'
import dayjs from 'dayjs'
import { useRouter } from 'next/navigation'
import { Button } from 'primereact/button'
import { Dropdown, DropdownChangeEvent } from 'primereact/dropdown'
import { InputText } from 'primereact/inputtext'
import { InputTextarea } from 'primereact/inputtextarea'
import { useEffect, useMemo, useState } from 'react'

import { useAuth } from '@/layout/context/AuthContext'
import { useScheduleStore } from '@/stores'
import { useCustomerStore } from '@/stores/customers'
import { useUserStore } from '@/stores/user'

type CustomerPhone = 'Phone1' | 'Cellular'
const NewCustomerPage = () => {
  const {
    newCustomerForm,
    setNewCustomerForm,
    fetchCustomerGroupOptions,
    groupOptions,
    fetchSubgroupOptions,
    subgroupOptions,
    createNewCustomer,
  } = useCustomerStore()

  const { fetchSalesPersons, salesPersons } = useUserStore()
  const { isAdmin, user } = useAuth()
  const router = useRouter()
  const [errors, setErrors] = useState<Record<string, string>>({})
  const { createVisitSchedule } = useScheduleStore()
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

    if (!newCustomerForm.Cellular) {
      errors.Cellular = 'Mobile phone number is required'
    }

    if (!newCustomerForm.SlpCode) {
      errors.SlpCode = 'Sales person is required'
    }

    if (!newCustomerForm.City) {
      errors.City = 'City is required'
    }

    if (!newCustomerForm.Phone1) {
      errors.Phone1 = 'Phone number is required'
    }

    if (!newCustomerForm.Address) {
      errors.Address = 'Address is required'
    }

    if (errors) {
      setErrors(errors)
    }
    return Object.keys(errors).length === 0
  }
  useEffect(() => {
    setNewCustomerForm({})
    fetchSubgroupOptions()
    fetchCustomerGroupOptions()
  }, [])

  useEffect(() => {
    if (isAdmin) {
      fetchSalesPersons(false)
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

  const salesPersonOptions = useMemo(() => {
    return salesPersons
      .filter((sp) => sp.user)
      .map((sp) => ({
        label: sp.SlpName,
        value: sp.SlpCode,
      }))
  }, [salesPersons])

  const handleSlpChange = (e: DropdownChangeEvent) => {
    if (errors.SlpCode) {
      setErrors({ ...errors, SlpCode: '' })
    }

    const selectedSalesPerson = salesPersons.find((sp) => sp.SlpCode === e.value)

    setNewCustomerForm({
      ...newCustomerForm,
      SlpCode: e.value,
      SalesName: selectedSalesPerson?.SlpName,
    })
  }

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
        router.push(`/visit/${newVisit.id}`)
      }
      setNewCustomerForm({})
    }
    return
  }
  return (
    <div className="card p-4">
      <NavButton />
      <h5>New Customer</h5>
      <div className="grid">
        <div className="col-12">
          <div className="">
            <div className="p-fluid formgrid grid">
              <div className="field col-12 md:col-6">
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
              <div className="field col-12 md:col-6">
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
                  className={`w-full h-11 flex items-center ${errors.GroupName ? 'p-invalid' : ''}`}
                />
                {errors.GroupName && <small className="p-error">{errors.GroupName}</small>}
              </div>
              <div className="field col-12 md:col-6">
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
                  className={`w-full h-11 flex items-center ${errors.subgroup ? 'p-invalid' : ''}`}
                />
                {errors.subgroup && <small className="p-error">{errors.subgroup}</small>}
              </div>
              <div className="field col-12 md:col-6">
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
                <div className="field col-12 md:col-6">
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
                      if (isAdmin && salesPersons.length === 0) {
                        fetchSalesPersons()
                      }
                    }}
                    options={salesPersonOptions}
                    placeholder="Select Sales Person"
                    className={`w-full h-11 flex items-center ${errors.SlpCode ? 'p-invalid' : ''}`}
                  />
                  {errors.SlpCode && <small className="p-error">{errors.SlpCode}</small>}
                </div>
              )}
              <div className="field col-12 md:col-6">
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
      <Button label="Save" severity="success" icon="pi pi-save" onClick={submitHandler} />
    </div>
  )
}

export default NewCustomerPage
