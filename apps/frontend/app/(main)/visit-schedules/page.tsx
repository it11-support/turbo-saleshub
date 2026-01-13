'use client'

import { ISalesPerson } from '@saleshub-tsm/types'
import { formatDate } from 'date-fns'
import { Accordion, AccordionTab } from 'primereact/accordion'
import { Button } from 'primereact/button'
import { Calendar } from 'primereact/calendar'
import { Dropdown } from 'primereact/dropdown'
import { useEffect, useState } from 'react'
import ScheduleCard from './components/ScheduleCard'

import { useAuth } from '@/layout/context/AuthContext'
import { useScheduleStore, useUserStore } from '@/stores'

const VisitSchedules = () => {
  const { schedules, page, fetchScheduleByDate, currentDate, setCurrentDate } = useScheduleStore()
  const [activeIndex, setActiveIndex] = useState(0)
  const [selectedSalesPerson, setSelectedSalesPerson] = useState<number | null>(null)

  const authStore = useAuth()
  const { fetchSalesPersons, salesPersons } = useUserStore()

  const { isAdmin, user } = authStore

  useEffect(() => {
    if (!isAdmin) return
    fetchSalesPersons(false)
  }, [isAdmin])

  useEffect(() => {
    if (isAdmin) return
    if (!user?.sales_person?.id) return

    setSelectedSalesPerson(Number(user.sales_person.id))
  }, [isAdmin, user])

  useEffect(() => {
    if (!selectedSalesPerson) return

    fetchScheduleByDate(selectedSalesPerson, currentDate)
  }, [selectedSalesPerson, currentDate, page])

  const getNextValidDate = (date: Date, offset: number) => {
    const d = new Date(date)
    d.setDate(d.getDate() + offset)
    if (d.getDay() === 0) {
      d.setDate(d.getDate() + (offset > 0 ? 1 : -1))
    }
    return d
  }

  const nextDate = formatDate(getNextValidDate(new Date(currentDate), 1), 'MMM do, yyyy')
  const prevDate = formatDate(getNextValidDate(new Date(currentDate), -1), 'MMM do, yyyy')

  const changeDate = (offset: number) => {
    const base = new Date(currentDate)
    const d = getNextValidDate(base, offset)

    const newDate = d.toISOString().slice(0, 10)
    setCurrentDate(newDate)
    if (selectedSalesPerson === null) return
    fetchScheduleByDate(Number(selectedSalesPerson), newDate)
  }

  const handleChangeDate = (value: string | Date) => {
    let d = new Date(value)

    if (d.getDay() === 0) {
      d = getNextValidDate(d, 1)
    }

    const x = formatDate(d, 'yyyy-MM-dd')
    setCurrentDate(x)
    if (selectedSalesPerson === null) return
    fetchScheduleByDate(Number(selectedSalesPerson), x)
  }

  const completedSchedule = schedules.filter((x) => x.status.toLowerCase() === 'completed')
  const scheduledVisits = schedules.filter((x) => x.status.toLowerCase() === 'planned')
  const missedVisits = schedules.filter((x) => x.status.toLowerCase() === 'missed')
  const ongoingVisits = schedules.filter((x) => x.status.toLowerCase() === 'ongoing')

  return (
    <div className="card p-4">
      <div className="flex justify-between mb-4 items-center">
        <Button
          label="Back"
          icon="pi pi-chevron-left"
          severity="danger"
          size="small"
          outlined
          onClick={() => {
            if (typeof window !== 'undefined') window.history.back()
          }}
        />
      </div>
      <h5>Visit Schedule</h5>
      <div className=" font-bold text-md">{formatDate(currentDate, 'EEEE')}</div>
      <div className="mb-2 font-bold text-2xl">{formatDate(currentDate, 'MMM do, yyyy')}</div>

      {isAdmin && (
        <div className="grid my-4">
          <div className="col-12 md:col-3">
            <Dropdown
              value={selectedSalesPerson}
              options={salesPersons.map((sp: ISalesPerson) => ({
                label: sp.SlpName,
                value: Number(sp.id),
              }))}
              onChange={(e) => {
                setSelectedSalesPerson(e.value)
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
        />
        <div className="mx-auto text-center align-self-center">
          <div className="hidden sm:block">
            <Calendar
              value={new Date(currentDate)}
              onChange={(e) => handleChangeDate(e.value as Date)}
              showIcon
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
        />
      </div>

      <div className="w-full flex justify-between items-center mt-2 mb-3 border-t pt-3">
        <div className="block sm:hidden">
          <Calendar
            value={new Date(currentDate)}
            onChange={(e) => handleChangeDate(e.value as Date)}
            showIcon
            className="max-h-10"
          />
        </div>
      </div>

      <Accordion activeIndex={activeIndex} onTabChange={(e) => setActiveIndex(e.index as number)}>
        {scheduledVisits.length > 0 && (
          <AccordionTab header={`Scheduled Visits (${scheduledVisits.length})`}>
            <div className="grid">
              {scheduledVisits?.map((schedule) => (
                <div
                  key={`${schedule.customer_id}-${schedule.visit_date}`}
                  className="col-12 md:col-4 p-2"
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
                  className="col-12 md:col-4 p-2"
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
                  className="col-12 md:col-4"
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
                  className="col-12 md:col-4"
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
