'use client'

import ScheduleCard from './components/ScheduleCard'
import NavButton from '../customers/components/NavButton'
import { fetcher } from '../lib'
import { IResSingle, ISalesPerson, VisitSchedule, VisitStatus } from '@saleshub-tsm/types'
import { addDays, format, formatDate, parse } from 'date-fns'
import { parseAsInteger, parseAsString, useQueryStates } from 'nuqs'
import { Accordion, AccordionTab } from 'primereact/accordion'
import { Button } from 'primereact/button'
import { Calendar } from 'primereact/calendar'
import { Dropdown } from 'primereact/dropdown'
import { useState } from 'react'
import useSWR, { preload } from 'swr'

import { useAuth } from '@/layout/context/AuthContext'
import { createUrl } from '@/lib/api'
import { normalizeDateToUTC } from '@/lib/dateUtils'

type VisitScheduleData = {
  data: {
    data: VisitSchedule[]
    total: number
    weekOfMonth: number
  }
}
const VisitSchedules = () => {
  const CURRENT_DATE = new Date().toISOString().slice(0, 10)

  const [activeIndex, setActiveIndex] = useState<number | number[] | null>(null)
  const authStore = useAuth()

  const { isAdmin, user } = authStore
  const currentSalesPersonId = isAdmin ? null : user?.sales_person?.id
  const [filters, setFilters] = useQueryStates(
    {
      page: parseAsInteger.withDefault(1),
      limit: parseAsInteger.withDefault(25),
      salesPersonId: parseAsInteger.withDefault(currentSalesPersonId as unknown as number),
      date: parseAsString.withDefault(CURRENT_DATE),
    },
    { shallow: true, history: 'replace' }
  )

  const apiSalesPerson = createUrl('sales-persons', { withFilterUser: false })

  const { data: salesPersonData } = useSWR<IResSingle<ISalesPerson>>(
    isAdmin ? apiSalesPerson : null,
    fetcher
  )

  const payload = {
    page: filters.page,
    pageSize: filters.limit,
    date: filters.date,
    salesPersonId: filters.salesPersonId,
  }

  const scheduleApi = createUrl('schedule', payload)

  const { data: scheduleData } = useSWR<VisitScheduleData>(
    filters.salesPersonId ? scheduleApi : null,
    fetcher
  )

  const schedules = scheduleData?.data.data || []

  const salesPersons = salesPersonData?.data || []

  const getNextValidDate = (date: Date, offset: number) => {
    const d = new Date(date)
    d.setDate(d.getDate() + offset)
    if (d.getDay() === 0) {
      d.setDate(d.getDate() + (offset > 0 ? 1 : -1))
    }
    return d
  }

  const nextDate = formatDate(getNextValidDate(new Date(filters.date), 1), 'MMM do, yyyy')
  const prevDate = formatDate(getNextValidDate(new Date(filters.date), -1), 'MMM do, yyyy')

  const changeDate = (offset: number) => {
    const base = new Date(filters.date)
    const d = getNextValidDate(base, offset)

    const prefetchOffset = offset > 0 ? 2 : -2
    const newDate = d.toISOString().slice(0, 10)
    const preloadDate = addDays(d, prefetchOffset).toISOString().slice(0, 10)
    const newPayload = {
      ...payload,
      date: preloadDate,
    }

    const prefetchUrl = createUrl('schedule', newPayload)
    preload(prefetchUrl, fetcher)

    setFilters({ date: newDate })
  }

  const handleChangeDate = (value: string | Date) => {
    let d = new Date(value)

    if (d.getDay() === 0) {
      d = getNextValidDate(d, 1)
    }

    const x = formatDate(d, 'yyyy-MM-dd')
    setFilters({ date: x })
  }

  const formatScheduleDate = (date: string) => {
    const parsedDate = parse(date, 'MMMM do, yyyy', new Date())

    const formattedDate = format(parsedDate, 'yyyy-MM-dd')
    return formattedDate
  }

  const handleHoverButton = (dateStr: string) => {
    if (!filters.salesPersonId) return

    const fetchDate = formatScheduleDate(dateStr)
    const prefetchPayload = {
      ...payload,
      date: fetchDate,
    }
    const prefetchUrl = createUrl('schedule', prefetchPayload)
    preload(prefetchUrl, fetcher)
  }
  const completedSchedule = schedules.filter(
    (x) => x.status.toLowerCase() === VisitStatus.Completed.toLowerCase()
  )
  const scheduledVisits = schedules.filter(
    (x) => x.status.toLowerCase() === VisitStatus.Planned.toLowerCase()
  )
  const missedVisits = schedules.filter(
    (x) => x.status.toLowerCase() === VisitStatus.Missed.toLowerCase()
  )
  const ongoingVisits = schedules.filter(
    (x) => x.status.toLowerCase() === VisitStatus.Ongoing.toLowerCase()
  )

  const onDateCellHover = (dateObj: { day: number; month: number; year: number }) => {
    if (!filters.salesPersonId) return

    const hoveredDate = new Date(dateObj.year, dateObj.month, dateObj.day)

    const formattedDate = hoveredDate.toLocaleDateString('en-CA')

    const prefetchPayload = {
      ...filters,
      date: formattedDate,
    }
    const prefetchUrl = createUrl('schedule', prefetchPayload)

    preload(prefetchUrl, fetcher)
  }

  const dateTemplate = (date: {
    day: number
    month: number
    year: number
    today: boolean
    selectable: boolean
  }) => {
    return <div onMouseEnter={() => onDateCellHover(date)}>{date.day}</div>
  }

  return (
    <div className="card p-4">
      <NavButton />
      <h5>Visit Schedule</h5>
      <div className=" font-bold text-md">{formatDate(CURRENT_DATE, 'EEEE')}</div>
      <div className="mb-2 font-bold text-2xl">{formatDate(CURRENT_DATE, 'MMM do, yyyy')}</div>

      {isAdmin && (
        <div className="grid my-4">
          <div className="col-12 md:col-3">
            <Dropdown
              value={filters.salesPersonId}
              options={salesPersons
                .filter((s: ISalesPerson) => s.user)
                .map((sp: ISalesPerson) => ({
                  label: sp.SlpName,
                  value: Number(sp.id),
                }))}
              onChange={(e) => {
                setFilters({ salesPersonId: e.value })
              }}
              placeholder="Select Sales Person"
              className="w-full"
            />
          </div>
        </div>
      )}

      <div className="w-full flex justify-between items-center mt-2 mb-3 border-t pt-3">
        <Button
          label={prevDate}
          icon="pi pi-chevron-left"
          size="small"
          // disabled={page === 1}
          onClick={() => changeDate(-1)}
          onMouseEnter={() => handleHoverButton(prevDate)}
        />
        <div className="mx-auto text-center align-self-center">
          <div className="hidden sm:block">
            <Calendar
              value={new Date(filters.date)}
              onChange={(e) => {
                const selectedDate = e.value as Date
                const cleanDate = normalizeDateToUTC(selectedDate)
                handleChangeDate(cleanDate as Date)
              }}
              showIcon
              dateTemplate={dateTemplate}
              className="max-h-10"
              disabledDays={[0]}
            />
          </div>
        </div>
        <Button
          label={nextDate}
          icon="pi pi-chevron-right"
          iconPos="right"
          size="small"
          // disabled={page === totalPages}
          onClick={() => changeDate(1)}
          className="px-3 py-1 border rounded disabled:opacity-50"
          onMouseEnter={() => handleHoverButton(nextDate)}
        />
      </div>

      <div className="w-full flex justify-between items-center mt-2 mb-3 border-t pt-3">
        <div className="block sm:hidden">
          <Calendar
            value={new Date(filters.date)}
            onChange={(e) => handleChangeDate(e.value as Date)}
            showIcon
            className="max-h-10"
          />
        </div>
      </div>
      <></>
      <Accordion activeIndex={activeIndex} onTabChange={(e) => setActiveIndex(e.index)}>
        {scheduledVisits.length > 0 && (
          <AccordionTab header={`Scheduled Visits (${scheduledVisits.length})`}>
            <div className="grid">
              {scheduledVisits?.map((schedule) => (
                <div
                  key={`${schedule.customer_id}-${schedule.visit_date}`}
                  className="col-12 md:col-4 p-2 h-[300px]"
                >
                  <ScheduleCard schedule={schedule} />
                </div>
              ))}
            </div>
          </AccordionTab>
        )}
        {missedVisits.length > 0 && (
          <AccordionTab header={`Missed Visits (${missedVisits.length})`}>
            <div className="grid">
              {missedVisits?.map((schedule) => (
                <div
                  key={`${schedule.customer_id}-${schedule.visit_date}`}
                  className="col-12 md:col-4 p-2 h-[300px]"
                >
                  <ScheduleCard schedule={schedule} />
                </div>
              ))}
            </div>
          </AccordionTab>
        )}
        {completedSchedule.length > 0 && (
          <AccordionTab header={`Completed Visits (${completedSchedule.length})`}>
            <div className="grid">
              {completedSchedule?.map((schedule) => (
                <div
                  key={`${schedule.customer_id}-${schedule.visit_date}`}
                  className="col-12 md:col-4 p-2 h-[300px]"
                >
                  <ScheduleCard schedule={schedule} />
                </div>
              ))}
            </div>
          </AccordionTab>
        )}
        {ongoingVisits.length > 0 && (
          <AccordionTab header={`Ongoing Visits (${ongoingVisits.length})`}>
            <div className="grid">
              {ongoingVisits?.map((schedule) => (
                <div
                  key={`${schedule.customer_id}-${schedule.visit_date}`}
                  className="col-12 md:col-4 p-2 h-[300px]"
                >
                  <ScheduleCard schedule={schedule} />
                </div>
              ))}
            </div>
          </AccordionTab>
        )}
      </Accordion>
    </div>
  )
}

export default VisitSchedules
