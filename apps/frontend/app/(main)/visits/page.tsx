'use client'
import VisitListTable from './components/VisitListTable'
import { ISalesPerson } from '@saleshub-tsm/types'
import { format } from 'date-fns'
import { Button } from 'primereact/button'
import { Calendar } from 'primereact/calendar'
import { Checkbox } from 'primereact/checkbox'
import { Dialog } from 'primereact/dialog'
import { Dropdown } from 'primereact/dropdown'
import { useEffect, useState } from 'react'
import * as XLSX from 'xlsx'

import { useAuth } from '@/layout/context/AuthContext'
import { useUserStore, useVisitsStore } from '@/stores'

type VisitRow = {
  'Visit Date': string
  Sales: string
  Customer: string
  'Start Time': string
  'End Time': string
  'Visit Note': string
  Status: string
  'Offered Item': string
  'Item Notes': string
}

const VisitList = () => {
  const visitStore = useVisitsStore()
  const autStore = useAuth()
  const userStore = useUserStore()

  const { fetchSalesPersons, salesPersons } = userStore

  const { isAdmin, user } = autStore

  const [dialogVisible, setDialogVisible] = useState(false)

  const {
    data,
    page,
    limit,
    dates,
    setDates,
    fetchVisits,
    multiSortMeta,
    salesPersonId,
    needFollowUp,
    setNeedFollowUp,
    status,
    setStatus,
    setSalesPersonId,
    exportDates,
    exportData,
    setExportDates,
    fetchExportedData,
    loadingExport,
    salesPersonFilter,
    setSalesPersonFilter,
    setExportData,
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

    if (isAdmin) {
      fetchVisits()
    }
  }, [isAdmin, salesPersonId, user, dates, page, limit, multiSortMeta, status, needFollowUp])

  useEffect(() => {
    if (exportDates || salesPersonFilter) {
      fetchExportedData()
    }
  }, [exportDates, salesPersonFilter])

  const handleExportData = () => {
    const rawData = Object.values(exportData).flatMap((row) => Object.values(row))

    const data: VisitRow[] = rawData
      .sort((a, b) => b.visit_id - a.visit_id)
      .map((row) => ({
        'Visit Date': row.visit?.visit_date
          ? format(new Date(row.visit.visit_date), 'EEE MMM do, yyyy')
          : '',
        Sales: row.visit?.salesPerson?.SlpName,
        Customer: row.visit?.customer.CardName,
        'Start Time': row.visit?.start_at ? format(new Date(row.visit.start_at), 'HH:mm') : '',
        'End Time': row.visit?.end_at ? format(new Date(row.visit.end_at), 'HH:mm') : '',
        'Visit Note': row.visit?.notes,
        Status: row.visit?.status,

        'Offered Item': row.product.ItemName,
        'Item Notes': row.notes,
      }))

    const ws = XLSX.utils.json_to_sheet(data)

    const cols = (Object.keys(data[0]) as (keyof VisitRow)[]).map((key) => {
      const maxLength = Math.max(
        key.length, // panjang header
        ...data.map((row) => String(row[key] ?? '').length) // panjang value
      )
      return { wch: maxLength + 2 }
    })

    ws['!cols'] = cols

    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Visits')

    const filename = `Sales Visit Report.xlsx`
    XLSX.writeFile(wb, filename)

    setDialogVisible(false)
  }

  return (
    <>
      <div className="card p-4">
        <div className="flex justify-between mb-4 items-center">
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
          <div className="col-12 md:col-3">
            <Dropdown
              value={status}
              options={['Completed', 'Ongoing', 'Missed'].map((status) => ({
                label: status,
                value: status,
              }))}
              onChange={(e) => {
                setStatus(e.value === null ? undefined : e.value)
              }}
              placeholder="Select Status"
              className="w-full"
              showClear
            />
          </div>
          <div className="col-12 md:col-3 flex justify-center align-items-center">
            <Checkbox
              inputId="productFocused"
              name="productFocused"
              value={needFollowUp}
              onChange={(e) => setNeedFollowUp(e.checked as boolean)}
              checked={needFollowUp}
            />
            <label htmlFor="productFocused" className="ml-2">
              Visit with Follow Ups
            </label>
          </div>

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
          <div className="col-12 md:col-3">
            <Button
              label="Export"
              icon="pi pi-download"
              severity="success"
              size="small"
              onClick={() => setDialogVisible(true)}
            />
          </div>
        </div>

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
        {data && <VisitListTable />}
      </div>
      <Dialog
        className="w-full lg:w-3 md:w-4 sm:w-6"
        header="Export Visits Report"
        visible={dialogVisible}
        onHide={() => {
          setExportDates(null)
          setDialogVisible(false)
          setSalesPersonFilter(null)
          setExportData([])
        }}
        modal
        footer={
          <div className="flex justify-end gap-2">
            <Button
              label="Cancel"
              icon="pi pi-times"
              outlined
              onClick={() => {
                setExportDates(null)
                setDialogVisible(false)
                setSalesPersonFilter(null)
                setExportData([])
              }}
            />
            <Button
              label="Export"
              icon="pi pi-download"
              severity="success"
              onClick={handleExportData}
              loading={loadingExport}
              disabled={exportData.length === 0 || Object.keys(exportData).length === 0}
            />
          </div>
        }
      >
        <div className="grid gap-2 my-2">
          <Calendar
            value={exportDates}
            onChange={(e) => setExportDates(e.value!)}
            selectionMode="range"
            readOnlyInput
            className="w-full"
            showButtonBar
            placeholder="Select Visit Date Range"
          />
          {isAdmin && (
            <Dropdown
              value={salesPersonFilter}
              options={salesPersons.map((sp) => ({
                label: sp.SlpName,
                value: String(sp.id),
              }))}
              onChange={(e) => {
                setSalesPersonFilter(e.value === null ? undefined : e.value)
              }}
              placeholder="Select Sales Person"
              className="w-full"
              showClear
            />
          )}
        </div>
      </Dialog>
    </>
  )
}

export default VisitList
