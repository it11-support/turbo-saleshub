'use client'
import VisitListTable from './components/VisitListTable'
import { ISalesPerson } from '@saleshub-tsm/types'
import { Button } from 'primereact/button'
import { Calendar } from 'primereact/calendar'
import { Dropdown } from 'primereact/dropdown'
import { useEffect } from 'react'

import { useAuth } from '@/layout/context/AuthContext'
import { useUserStore, useVisitsStore } from '@/stores'

const VisitList = () => {
  const visitStore = useVisitsStore()
  const autStore = useAuth()
  const userStore = useUserStore()

  const { fetchSalesPersons, salesPersons } = userStore

  const { isAdmin, user } = autStore

  const {
    data,
    page,
    limit,
    dates,
    setDates,
    fetchVisits,
    multiSortMeta,
    salesPersonId,
    setSalesPersonId,
  } = visitStore

  useEffect(() => {
    if (!isAdmin) return
    fetchSalesPersons(false)
  }, [isAdmin])

  useEffect(() => {
    fetchVisits()
  }, [])

  useEffect(() => {
    if (isAdmin) return
    if (!user?.sales_person?.id) return
    setSalesPersonId(Number(user.sales_person.id))
  }, [isAdmin, user])

  useEffect(() => {
    if (!isAdmin && user?.sales_person?.id) {
      fetchVisits()
      return
    }

    // ADMIN → fetch hanya jika sudah pilih sales person
    if (isAdmin && salesPersonId) {
      fetchVisits()
    }
  }, [isAdmin, salesPersonId, user, dates, page, limit, multiSortMeta])

  return (
    <div className="card">
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
      <h5>Visits</h5>

      <div className="grid my-4">
        {isAdmin && (
          <div className="col-12 md:col-3">
            <Dropdown
              value={salesPersonId}
              options={salesPersons.map((sp: ISalesPerson) => ({
                label: sp.SlpName,
                value: Number(sp.id),
              }))}
              onChange={(e) => {
                setSalesPersonId(e.value === null ? undefined : e.value)
              }}
              placeholder="Select Sales Person"
              className="w-full"
              showClear
            />
          </div>
        )}
        <div className="col-12 md:col-3">
          <Calendar
            value={dates}
            onChange={(e) => setDates(e.value!)}
            selectionMode="range"
            readOnlyInput
            className="w-full"
            showButtonBar
            placeholder="Select Visit Date Range"
          />
        </div>
      </div>
      {data && <VisitListTable />}
    </div>
  )
}

export default VisitList
