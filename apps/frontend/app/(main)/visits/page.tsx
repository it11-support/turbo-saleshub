'use client'
import { visitFilters } from './components/filters'
import VisitListTable from './components/VisitListTable'
import NavButton from '../customers/components/NavButton'
import { fetcher } from '../lib'
import { IResSingle, ISalesPerson, VisitStatus } from '@saleshub-tsm/types'
import { format } from 'date-fns'
import dayjs from 'dayjs'
import { useQueryStates } from 'nuqs'
import { Button } from 'primereact/button'
import { Calendar } from 'primereact/calendar'
import { Checkbox } from 'primereact/checkbox'
import { Dialog } from 'primereact/dialog'
import { Dropdown } from 'primereact/dropdown'
import { useEffect, useState } from 'react'
import useSWR from 'swr'
import * as XLSX from 'xlsx-js-style'

import { useAuth } from '@/layout/context/AuthContext'
import { createUrl } from '@/lib/api'
import { useVisitsStore } from '@/stores'

type VisitMainRow = {
  'Visit ID': string
  'Visit Date': string
  Sales: string
  Customer: string
  'Start Time': string
  'End Time': string
  'Visit Duration': string
  'Visit Note': string
  Status: string
  'Offered Item': string
  'Item Notes': string
  Topic: string
  'Follow Up Status': string
  'Follow Up Date': string
  'Follow Up Type': string
}

type InquiryRow = {
  'Inquiry Product': string
  'Inquiry Notes': string
}

type VisitRow = Partial<VisitMainRow> & Partial<InquiryRow>

const VisitList = () => {
  const visitStore = useVisitsStore()
  const autStore = useAuth()
  const { isAdmin, user } = autStore

  const [dialogVisible, setDialogVisible] = useState(false)

  const {
    exportDates,
    exportData,
    setExportDates,
    fetchExportedData,
    loadingExport,
    salesPersonFilter,
    setSalesPersonFilter,
    setExportData,
  } = visitStore

  const [filters, setFilters] = useQueryStates(visitFilters)

  const apiSalesPerson = createUrl('sales-persons', { withFilterUser: false })

  const { data: salesPersonData } = useSWR<IResSingle<ISalesPerson>>(
    isAdmin ? apiSalesPerson : null,
    fetcher,
    {
      keepPreviousData: true,
      revalidateOnFocus: false,
    }
  )

  const salesPersons = salesPersonData?.data || []

  useEffect(() => {
    setExportData([])
  }, [])

  useEffect(() => {
    if (isAdmin) return
    if (!user?.sales_person?.id) return
    setFilters({ salesPersonId: Number(user.sales_person.id) })
  }, [isAdmin, user])

  useEffect(() => {
    if (exportDates || salesPersonFilter) {
      fetchExportedData()
    }
    if (!exportDates && !salesPersonFilter) {
      setExportData([])
    }
  }, [exportDates, salesPersonFilter])

  const handleExportData = () => {
    if (!exportData || exportData.length === 0) {
      console.warn('No data to export')
      return
    }

    const data: VisitRow[] = []

    exportData.forEach((visit) => {
      if (!visit.visit_items || visit.visit_items.length === 0) {
        return
      }

      const getDuration = (start?: Date, end?: Date | null) => {
        if (!start || !end) return ''
        const diffMs = new Date(end).getTime() - new Date(start).getTime()
        const totalMinutes = Math.floor(diffMs / 60000)
        const hours = Math.floor(totalMinutes / 60)
        const minutes = totalMinutes % 60
        return `${hours}h ${minutes}m`
      }

      const baseRow = {
        'Visit ID': visit.id.toString(),
        'Visit Date': visit.visit_date
          ? format(new Date(visit.visit_date), 'EEE MMM do, yyyy')
          : '',
        Sales: visit.salesPerson?.SlpName ?? '',
        Customer: visit.customer?.CardName ?? '',
        'Start Time': visit.start_at ? format(new Date(visit.start_at), 'HH:mm') : '',
        'End Time': visit.end_at ? format(new Date(visit.end_at), 'HH:mm') : '',
        'Visit Duration': getDuration(visit.start_at, visit.end_at),
        'Visit Note': visit.notes ?? '',
        Status: visit.status ?? '',
      }

      const emptyBaseRow = Object.fromEntries(
        Object.keys(baseRow).map((k) => [k, ''])
      ) as typeof baseRow

      const visitRows: VisitRow[] = []

      visit.visit_items.forEach((item) => {
        const concerns = item.visit_item_concerns ?? []

        if (concerns.length === 0) {
          visitRows.push({
            'Visit ID': visit.id.toString(),
            'Visit Date': visit.visit_date
              ? format(new Date(visit.visit_date), 'EEE MMM do, yyyy')
              : '',
            Sales: visit.salesPerson?.SlpName ?? '',
            Customer: visit.customer?.CardName ?? '',
            Status: visit.status ?? '',
            'Offered Item': item.product?.ItemName ?? '',
            Topic: '',
            'Item Notes': item.notes ?? '',
            'Follow Up Status': '',
            'Follow Up Date': '',
            'Follow Up Type': '',
            'Inquiry Product': '',
            'Inquiry Notes': '',
          })
        } else {
          concerns.forEach((concern) => {
            visitRows.push({
              'Visit ID': visit.id.toString(),
              'Visit Date': visit.visit_date
                ? format(new Date(visit.visit_date), 'EEE MMM do, yyyy')
                : '',
              Sales: visit.salesPerson?.SlpName ?? '',
              Customer: visit.customer?.CardName ?? '',
              Status: visit.status ?? '',
              'Offered Item': item.product?.ItemName ?? '',
              Topic: `• ${concern.category?.name ?? ''}`,
              'Item Notes': concern.notes ?? '',
              'Follow Up Status': concern.status?.status ?? '',
              'Follow Up Date': '',
              'Follow Up Type': '',
              'Inquiry Product': '',
              'Inquiry Notes': '',
            })

            concern.follow_ups?.forEach((fu) => {
              visitRows.push({
                'Visit ID': visit.id.toString(),
                'Visit Date': visit.visit_date
                  ? format(new Date(visit.visit_date), 'EEE MMM do, yyyy')
                  : '',
                Sales: visit.salesPerson?.SlpName ?? '',
                Customer: visit.customer?.CardName ?? '',
                Status: visit.status ?? '',
                'Offered Item': '',
                Topic: '',
                'Item Notes': fu.notes ?? '',
                'Follow Up Status': fu.concern_status?.status ?? '',
                'Follow Up Date': format(new Date(fu.created_at), 'EEE MMM do, yyyy HH:mm'),
                'Follow Up Type': fu.type ?? '',
                'Inquiry Product': '',
                'Inquiry Notes': '',
              })
            })
          })
        }
      })

      const inquiries = visit.inquiries ?? []

      if (visitRows.length === 0 && (inquiries.length > 0 || visit)) {
        visitRows.push({
          'Visit ID': visit.id.toString(),
          'Visit Date': visit.visit_date
            ? format(new Date(visit.visit_date), 'EEE MMM do, yyyy')
            : '',
          Sales: visit.salesPerson?.SlpName ?? '',
          Customer: visit.customer?.CardName ?? '',
          Status: visit.status ?? '',
          'Offered Item': '',
          Topic: '',
          'Item Notes': '',
          'Follow Up Status': '',
          'Follow Up Date': '',
          'Follow Up Type': '',
          'Inquiry Product': '',
          'Inquiry Notes': '',
        })
      }

      inquiries.forEach((inq, idx) => {
        if (visitRows[idx]) {
          // Tempel inquiry di baris item yang sudah ada (sejajar)
          visitRows[idx]['Inquiry Product'] = inq.product_name ?? ''
          visitRows[idx]['Inquiry Notes'] = inq.notes ?? ''
        } else {
          // Jika baris item sudah habis tapi inquiry masih ada, buat baris baru
          visitRows.push({
            'Visit ID': visit.id.toString(),
            'Visit Date': visit.visit_date
              ? format(new Date(visit.visit_date), 'EEE MMM do, yyyy')
              : '',
            Sales: visit.salesPerson?.SlpName ?? '',
            Customer: visit.customer?.CardName ?? '',
            Status: visit.status ?? '',
            'Offered Item': '',
            Topic: '',
            'Item Notes': '',
            'Follow Up Status': '',
            'Follow Up Date': '',
            'Follow Up Type': '',
            'Inquiry Product': inq.product_name ?? '',
            'Inquiry Notes': inq.notes ?? '',
          })
        }
      })

      visitRows.forEach((row, index) => {
        data.push({
          ...(index === 0 ? baseRow : emptyBaseRow),
          ...row,
        })
      })
      setExportDates(null)
      setSalesPersonFilter(null)
    })

    // Export Logic (XLSX)
    if (data.length === 0) {
      console.warn('No data after processing')
      return
    }

    const ws = XLSX.utils.json_to_sheet(data)
    const range = XLSX.utils.decode_range(ws['!ref'] || 'A1')

    const lastCol = 17

    for (let C = 0; C <= lastCol; C++) {
      const ref = XLSX.utils.encode_cell({ r: 0, c: C })

      if (!ws[ref]) ws[ref] = { t: 's', v: '' }

      ws[ref].s = {
        font: { bold: true },
        alignment: {
          horizontal: 'center',
          vertical: 'center',
          wrapText: true,
        },
        border: {
          top: { style: 'thin', color: { rgb: '000000' } },
          bottom: { style: 'thin', color: { rgb: '000000' } },
          left: { style: 'thin', color: { rgb: '000000' } },
          right: { style: 'thin', color: { rgb: '000000' } },
        },
      }
    }

    let visitStartRow: number | null = null

    for (let R = range.s.r + 1; R <= range.e.r; ++R) {
      const firstColRef = XLSX.utils.encode_cell({ r: R, c: 0 })
      const firstColVal = ws[firstColRef]?.v

      if (firstColVal) {
        if (visitStartRow !== null) {
          applyOutsideBorder(ws, visitStartRow, R - 1, lastCol)
        }
        visitStartRow = R
      }

      if (R === range.e.r && visitStartRow !== null) {
        applyOutsideBorder(ws, visitStartRow, R, lastCol)
      }
    }

    const allKeys = data.reduce((keys: string[], row) => {
      Object.keys(row).forEach((key) => {
        if (!keys.includes(key)) keys.push(key)
      })
      return keys
    }, [])

    const wrapColumns = ['Visit Note', 'Item Notes']
    const MAX_WIDTH = 50

    const colIndexMap: Record<string, number> = {}
    allKeys.forEach((key, index) => {
      colIndexMap[key] = index
    })

    wrapColumns.forEach((colName) => {
      const colIndex = colIndexMap[colName]
      if (colIndex === undefined) return

      for (let R = 1; R <= range.e.r; R++) {
        const ref = XLSX.utils.encode_cell({ r: R, c: colIndex })

        if (!ws[ref]) continue

        ws[ref].s = {
          ...(ws[ref].s || {}),
          alignment: {
            ...(ws[ref].s?.alignment || {}),
            wrapText: true,
            vertical: 'top',
          },
        }
      }
    })

    const cols = allKeys.map((key) => {
      const maxLength = Math.max(
        key.length,
        ...data.map((row) => String(row[key as keyof VisitRow] ?? '').length)
      )
      return { wch: Math.min(maxLength + 2, MAX_WIDTH) }
    })

    ws['!cols'] = cols
    ws['!freeze'] = { xSplit: 0, ySplit: 1 }

    const exportDate = dayjs().toDate()
    const exportDateStr = `${exportDate.getFullYear()}-${
      exportDate.getMonth() + 1
    }-${exportDate.getDate()}-${exportDate.getHours()}${exportDate.getMinutes()}${exportDate.getSeconds()}`
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Visits')
    XLSX.writeFile(wb, `Sales Visit Report - ${exportDateStr}.xlsx`)
    setDialogVisible(false)
  }

  const applyOutsideBorder = (
    ws: XLSX.WorkSheet,
    startRow: number,
    endRow: number,
    lastCol: number
  ) => {
    // 🔥 TOP & BOTTOM (tetap)
    for (let C = 0; C <= lastCol; C++) {
      const topRef = XLSX.utils.encode_cell({ r: startRow, c: C })
      const bottomRef = XLSX.utils.encode_cell({ r: endRow, c: C })

      if (!ws[topRef]) ws[topRef] = { t: 's', v: '' }
      if (!ws[bottomRef]) ws[bottomRef] = { t: 's', v: '' }

      ws[topRef].s = {
        ...(ws[topRef].s || {}),
        border: {
          ...(ws[topRef].s?.border || {}),
          top: { style: 'thin', color: { rgb: '000000' } },
        },
      }

      ws[bottomRef].s = {
        ...(ws[bottomRef].s || {}),
        border: {
          ...(ws[bottomRef].s?.border || {}),
          bottom: { style: 'thin', color: { rgb: '000000' } },
        },
      }
    }

    for (let R = startRow; R <= endRow; R++) {
      for (let C = 0; C <= lastCol; C++) {
        const ref = XLSX.utils.encode_cell({ r: R, c: C })

        if (!ws[ref]) ws[ref] = { t: 's', v: '' }

        ws[ref].s = {
          ...(ws[ref].s || {}),
          border: {
            ...(ws[ref].s?.border || {}),
            left: { style: 'thin', color: { rgb: '000000' } },
            right: { style: 'thin', color: { rgb: '000000' } },
          },
        }
      }
    }
  }

  return (
    <>
      <div className="card p-4">
        <NavButton />
        <h5>Visits</h5>
        <div className="col-12">
          <h5 className="mb-3">Filter</h5>

          <div className="grid">
            {/* Status */}
            <div className="col-12 md:col-3">
              <Dropdown
                value={filters.status}
                options={[VisitStatus.Completed, VisitStatus.Ongoing, VisitStatus.Missed].map(
                  (status) => ({
                    label: status,
                    value: status,
                  })
                )}
                onChange={(e) => {
                  setFilters({
                    status: e.value ?? null, // ✅ sekarang valid
                    page: 1,
                  })
                }}
                placeholder="Select Status"
                className="w-full"
                showClear
              />
            </div>

            {/* Follow Up */}
            <div className="col-12 md:col-3 flex align-items-center">
              <Checkbox
                inputId="followUp"
                onChange={(e) => setFilters({ needFollowUp: e.checked, page: 1 })}
                checked={filters.needFollowUp}
              />
              <label htmlFor="followUp" className="ml-2">
                Visit with Follow Ups
              </label>
            </div>

            <div className="col-12 md:col-3">
              <Calendar
                value={filters.dates}
                onChange={(e) => {
                  const value = e.value as (Date | null)[] | null

                  const clean = value?.filter((d): d is Date => d instanceof Date)

                  setFilters({
                    dates: clean?.length ? clean : undefined,
                    page: 1,
                  })
                }}
                onClearButtonClick={() => {
                  setFilters({
                    dates: null,
                    page: 1,
                  })
                }}
                selectionMode="range"
                readOnlyInput
                className="w-full"
                showButtonBar
                placeholder="Select Visit Date Range"
              />
            </div>

            {/* Sales Person */}
            {isAdmin && (
              <div className="col-12 md:col-3">
                <Dropdown
                  value={filters.salesPersonId}
                  options={salesPersons
                    .filter((sp) => sp.user)
                    .map((sp: ISalesPerson) => ({
                      label: sp.SlpName,
                      value: Number(sp.id),
                    }))}
                  onChange={(e) => setFilters({ salesPersonId: e.value ?? null, page: 1 })}
                  placeholder="Select Sales Person"
                  className="w-full"
                  showClear
                />
              </div>
            )}
          </div>

          {/* EXPORT */}
          <h5 className="mt-4 mb-3">Export</h5>

          <div className="grid">
            <div className="col-12 md:col-3 flex align-items-end">
              <Button
                label="Export"
                icon="pi pi-download"
                severity="success"
                size="small"
                className="w-full md:w-auto"
                onClick={() => setDialogVisible(true)}
              />
            </div>
          </div>
        </div>

        {<VisitListTable />}
      </div>
      <Dialog
        className="w-full lg:w-3 md:w-4 sm:w-6"
        header="Export Visits Report"
        visible={dialogVisible}
        blockScroll
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
              options={salesPersons
                .filter((sp) => sp.user)
                .map((sp) => ({
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
