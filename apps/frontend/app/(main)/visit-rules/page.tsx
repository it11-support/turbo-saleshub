'use client'

import NavButton from '../customers/components/NavButton'
import { fetcher } from '../lib'
import { ICustomer, IResSingle, ISalesPerson, ISalesVisitRule } from '@saleshub-tsm/types'
import { Accordion, AccordionTab } from 'primereact/accordion'
import { Button } from 'primereact/button'
import { Checkbox } from 'primereact/checkbox'
import { Dropdown } from 'primereact/dropdown'
import React, { useEffect, useMemo, useRef, useState } from 'react'
import useSWR from 'swr'

import { useDebounce } from '@/hooks/useDebounce'
import { useAuth } from '@/layout/context/AuthContext'
import { $api, createUrl } from '@/lib/api'

type WeekNumber = 1 | 2 | 3 | 4

type WeekFlags = {
  1: boolean
  2: boolean
  3: boolean
  4: boolean
}

type VisitMatrix = Record<string, Record<number, WeekFlags>>

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

const newWeekFlags = (): WeekFlags => ({ 1: false, 2: false, 3: false, 4: false })
const cloneWeeks = (src?: WeekFlags): WeekFlags =>
  src ? { 1: src[1], 2: src[2], 3: src[3], 4: src[4] } : newWeekFlags()

export default function VisitsPage(): JSX.Element {
  const [selectedSalesPerson, setSelectedSalesPerson] = useState<number | null>(null)
  const [visitMatrix, setVisitMatrix] = useState<VisitMatrix>({})
  const [lastChangedDay, setLastChangedDay] = useState<string | null>(null)
  const [lastChangedCustomer, setLastChangedCustomer] = useState<number | null>(null)

  const debouncedVisitMatrix = useDebounce(visitMatrix, 300)
  const userMatrixInitialized = React.useRef(false)
  const isSyncingRef = useRef(false)
  const authStore = useAuth()

  const { isAdmin, user } = authStore

  const apiSalesPerson = createUrl('sales-persons', { withFilterUser: false })

  const { data: salesPersonData } = useSWR<IResSingle<ISalesPerson>>(apiSalesPerson, fetcher)

  const salesPersons = salesPersonData?.data || []

  const visitRulesUrl = createUrl('visit-rules', { sales_person_id: selectedSalesPerson })

  const { data: visitRules, mutate } = useSWR<IResSingle<ISalesVisitRule>>(
    selectedSalesPerson ? visitRulesUrl : null,
    fetcher
  )

  const salesVisitRules = visitRules?.data

  useEffect(() => {
    if (!isAdmin) {
      setSelectedSalesPerson(Number(user?.sales_person?.id))
    }
  }, [isAdmin, user])

  useEffect(() => {
    if (!userMatrixInitialized.current) return
    if (!lastChangedDay) return

    const day = lastChangedDay
    setLastChangedDay(null)
    handleSync(day)
  }, [debouncedVisitMatrix])

  // derive assigned customers for selected salesperson
  const allAssignedCustomers = useMemo(() => {
    if (!selectedSalesPerson) return [] as { label: string; value: number }[]
    const person = salesPersons.find(
      (sp: ISalesPerson) => Number(sp.id) === Number(selectedSalesPerson)
    )

    return (person?.customers ?? [])
      .filter((c) => c.NonActive === 'N')
      .map((c: ICustomer) => ({
        label: c.CardName ?? String(c.id),
        value: Number(c.id),
      }))
  }, [selectedSalesPerson, salesPersons])

  // Build visitMatrix from salesVisitRules when selectedSalesPerson or rules change
  useEffect(() => {
    if (!selectedSalesPerson || !salesVisitRules) return
    if (isSyncingRef.current) return

    const tmp: VisitMatrix = {}
    const spRules = salesVisitRules.filter(
      (r: ISalesVisitRule) => Number(r.sales_person_id) === Number(selectedSalesPerson)
    )

    for (const rule of spRules) {
      const day = String(rule.day_of_week)
      const cid = Number(rule.customer_id ?? rule.customer?.id)
      if (!day || !cid) continue

      tmp[day] ??= {}
      tmp[day][cid] ??= newWeekFlags()

      for (const w of rule.visit_weeks || []) {
        if (w >= 1 && w <= 4) tmp[day][cid][w as WeekNumber] = true
      }
    }

    setVisitMatrix(tmp)
  }, [selectedSalesPerson, salesVisitRules])

  // convenience: set of customer ids that are currently assigned to any day
  const customersInMatrix = useMemo(() => {
    const s = new Set<number>()
    for (const customers of Object.values(visitMatrix)) {
      for (const cidStr of Object.keys(customers)) s.add(Number(cidStr))
    }
    return s
  }, [visitMatrix])

  // unassigned customers (to be shown in "Add customer" dropdown per day)
  const unassignedCustomers = useMemo(
    () => allAssignedCustomers.filter((c) => !customersInMatrix.has(c.value)),
    [allAssignedCustomers, customersInMatrix]
  )

  // toggle a week flag for a specific day + customer
  const toggleVisit = (day: string, cid: number, week: WeekNumber) => {
    setVisitMatrix((prev) => {
      const next = structuredClone(prev) as VisitMatrix
      next[day] ??= {}
      next[day][cid] = cloneWeeks(next[day][cid])
      next[day][cid][week] = !next[day][cid][week]
      return next
    })

    setLastChangedDay(day)
    setLastChangedCustomer(cid)
  }

  // add customer to specific day with default empty weeks
  const addCustomerToDay = (day: string, cid: number) => {
    setVisitMatrix((prev) => {
      const next = structuredClone(prev) as VisitMatrix
      next[day] ??= {}
      next[day][cid] = newWeekFlags()
      return next
    })
    isSyncingRef.current = true

    setLastChangedDay(day)
    setLastChangedCustomer(cid)
  }

  // remove customer completely from a day (UI could expose this action later)
  const removeCustomerFromDay = (day: string, cid: number) => {
    setVisitMatrix((prev) => {
      const next = structuredClone(prev) as VisitMatrix

      delete next[day]?.[cid]

      if (Object.keys(next[day] || {}).length === 0) {
        delete next[day]
      }

      return next
    })

    setLastChangedDay(day)
    setLastChangedCustomer(cid)
  }

  const buildPayload = (day: string) => {
    if (!selectedSalesPerson || !lastChangedCustomer) return null

    const flags = visitMatrix[day]?.[lastChangedCustomer]

    // ❗ Jika customer di-remove → kirim default flag agar backend delete
    if (!flags) {
      return {
        sales_person_id: selectedSalesPerson,
        dayFilter: day,
        data: {
          [lastChangedCustomer]: [false, false, false, false], // trigger DELETE
        },
      }
    }

    return {
      sales_person_id: selectedSalesPerson,
      dayFilter: day,
      data: {
        [lastChangedCustomer]: [flags[1], flags[2], flags[3], flags[4]],
      },
    }
  }

  const handleSync = async (day: string) => {
    const payload = buildPayload(day)
    if (!payload) return

    isSyncingRef.current = true

    try {
      await $api(createUrl('visit-rules/sync'), {
        method: 'POST',
        body: JSON.stringify(payload),
        headers: { 'Content-Type': 'application/json' },
      })

      mutate()
    } finally {
      isSyncingRef.current = false
    }
  }

  useEffect(() => {
    if (!selectedSalesPerson || !salesVisitRules) return
    if (isSyncingRef.current) return

    const tmp: VisitMatrix = {}
    const spRules = salesVisitRules.filter(
      (r: ISalesVisitRule) => Number(r.sales_person_id) === Number(selectedSalesPerson)
    )

    for (const rule of spRules) {
      const day = String(rule.day_of_week)
      const cid = Number(rule.customer_id ?? rule.customer?.id)
      if (!day || !cid) continue

      tmp[day] ??= {}
      tmp[day][cid] ??= newWeekFlags()

      for (const w of rule.visit_weeks || []) {
        if (w >= 1 && w <= 4) tmp[day][cid][w as WeekNumber] = true
      }
    }

    setVisitMatrix(tmp)
    userMatrixInitialized.current = true
  }, [selectedSalesPerson, salesVisitRules])

  return (
    <div className="card p-4">
      <NavButton />
      <h5>Sales Visit Rules</h5>

      {isAdmin && (
        <div className="grid mb-4">
          <div className="col-12 md:col-3">
            <Dropdown
              value={selectedSalesPerson}
              options={salesPersons
                .filter((sp) => sp.user)
                .map((sp: ISalesPerson) => ({
                  label: sp.SlpName,
                  value: Number(sp.id),
                }))}
              onChange={(e) => {
                setSelectedSalesPerson(e.value)
                setVisitMatrix({})
                userMatrixInitialized.current = false
              }}
              placeholder="Select Sales Person"
              className="w-full"
            />
          </div>
        </div>
      )}

      {selectedSalesPerson && (
        <>
          <div className="flex gap-2 mb-4 items-center">
            <div className="text-sm text-muted">
              Assigned customers: {allAssignedCustomers.length} • Scheduled:{' '}
              {customersInMatrix.size}
            </div>
          </div>

          <Accordion activeIndex={[0]}>
            {DAYS.map((day) => {
              const dayCustomers = Object.keys(visitMatrix[day] ?? {})
                .map((cidStr) => Number(cidStr))
                .map((cid) => {
                  // cari rule yang sesuai untuk customer ini dan hari ini
                  const rule = (salesVisitRules || []).find(
                    (r) =>
                      Number(r.sales_person_id) === Number(selectedSalesPerson) &&
                      Number(r.customer_id ?? r.customer?.id) === cid &&
                      String(r.day_of_week) === day
                  )
                  const label =
                    allAssignedCustomers.find((c) => c.value === cid)?.label ?? `#${cid}`

                  return {
                    value: cid,
                    label,
                    created_at: rule?.created_at ?? null,
                  }
                })
                // urutkan berdasarkan created_at ascending
                .sort((a, b) => {
                  if (!a.created_at) return 1
                  if (!b.created_at) return -1
                  return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
                })

              return (
                <AccordionTab header={`${day} (${dayCustomers.length} customer)`} key={day}>
                  <table className="table-auto w-full mt-2 text-xs">
                    <thead>
                      <tr className="leading-none">
                        <th className="border px-1 py-0.5 text-left">Customer</th>
                        {[1, 2, 3, 4].map((w) => (
                          <th key={w} className="border px-1 py-0.5 text-center">
                            W{w}
                          </th>
                        ))}
                        <th className="border px-1 py-0.5 text-center"></th>
                      </tr>
                    </thead>

                    <tbody>
                      {dayCustomers.length === 0 && (
                        <tr>
                          <td
                            colSpan={6}
                            className="border px-1 py-1 text-center text-xs text-gray-600"
                          >
                            No customers for this day
                          </td>
                        </tr>
                      )}

                      {dayCustomers.map((c) => {
                        const flags = visitMatrix[day]?.[c.value] ?? newWeekFlags()

                        return (
                          <tr key={c.value} className="leading-none">
                            <td className="border px-1 py-0.5 text-xs">{c.label}</td>

                            {[1, 2, 3, 4].map((w) => (
                              <td
                                key={w}
                                className="border px-1 py-0.5 text-center"
                                style={{ width: '2.5rem' }}
                              >
                                <Checkbox
                                  checked={flags[w as WeekNumber]}
                                  onChange={() => toggleVisit(day, c.value, w as WeekNumber)}
                                  className="m-0"
                                  disabled={!isAdmin}
                                />
                              </td>
                            ))}

                            {isAdmin && (
                              <td
                                className="border px-1 py-0.5 text-right"
                                style={{ width: '2.5rem' }}
                              >
                                <Button
                                  className="p-1 text-xs"
                                  icon="pi pi-times"
                                  rounded
                                  text
                                  severity="danger"
                                  aria-label="Cancel"
                                  onClick={() => removeCustomerFromDay(day, c.value)}
                                />
                              </td>
                            )}
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>

                  {isAdmin && (
                    <div className="mt-1 flex items-center gap-2">
                      <Dropdown
                        value={null}
                        options={unassignedCustomers}
                        optionLabel="label"
                        optionValue="value"
                        onChange={(e) => addCustomerToDay(day, e.value)}
                        resetFilterOnHide
                        placeholder={
                          unassignedCustomers.length ? 'Add customer' : 'No unassigned customers'
                        }
                        className="w-56 text-xs"
                        filter
                      />
                    </div>
                  )}
                </AccordionTab>
              )
            })}
          </Accordion>
        </>
      )}
    </div>
  )
}
