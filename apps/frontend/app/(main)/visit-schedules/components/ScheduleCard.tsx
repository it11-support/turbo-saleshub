'use client'

import { VisitSchedule } from '@saleshub-tsm/types'
import { isToday } from 'date-fns'
import { useRouter } from 'next/navigation'
import { Button } from 'primereact/button'
import { Card } from 'primereact/card'
import { Divider } from 'primereact/divider'

import { formatPhoneNumber } from '@/lib/phoneParser'

interface ScheduleCardProps {
  schedule: VisitSchedule
}

export default function ScheduleCard({ schedule }: ScheduleCardProps) {
  const s = schedule
  const c = schedule.rule.customer
  const visit = schedule.visit
  const router = useRouter()
  const todayKey = new Date().toISOString().slice(0, 10)
  const scheduleDateKey = new Date(schedule.visit_date).toISOString().slice(0, 10)

  const previousDate = scheduleDateKey < todayKey
  const getVisitRoute = (schedule: VisitSchedule) => {
    const status = schedule.status.toLowerCase().trim()

    if (status === 'completed') return `/visit/details/${schedule.id}`
    if (status === 'pending' || status === 'planned' || status === 'ongoing')
      return `/visit/${schedule.rule.id}`

    return null
  }

  const status = schedule.status.toLowerCase()

  const title = () => {
    return (
      <>
        <div className={`w-full flex justify-between items-center border-t`}>
          <h2 className="text-sm font-bold">{c?.CardName}</h2>
          <span className="mx-auto text-center"></span>

          {schedule.status.toLocaleLowerCase() === 'completed' && (
            <i
              className="pi pi-check-circle ml-2 text-xl"
              style={{ color: 'var(--green-500)' }}
            ></i>
          )}
          {schedule.status.toLocaleLowerCase() === 'planned' && (
            <i className="pi pi-clock ml-2 text-xl" style={{ color: 'var(--orange-500)' }}></i>
          )}
          {schedule.status.toLocaleLowerCase() === 'pending' && (
            <i className="pi pi-clock ml-2 text-xl" style={{ color: 'var(--orange-500)' }}></i>
          )}
          {schedule.status.toLocaleLowerCase() === 'cancelled' && (
            <i className="pi pi-times-circle ml-2 text-xl" style={{ color: 'var(--red-500)' }}></i>
          )}
          {schedule.status.toLocaleLowerCase() === 'missed' && (
            <i className="pi pi-info-circle ml-2 text-xl" style={{ color: 'var(--red-500)' }}></i>
          )}

          {schedule.status.toLocaleLowerCase() === 'ongoing' && (
            <i
              className="pi pi-caret-right ml-2 text-xl blinking"
              style={{ color: 'var(--green-500)' }}
            ></i>
          )}
        </div>
      </>
    )
  }
  const subTitle = () => {
    return (
      <>
        <div className="flex-1">
          <p className="text-sm text-gray-500 mb-0">
            <i className="pi pi-tags" style={{ color: 'var(--teal-500)' }}></i>{' '}
            {c?.subgroup?.IndName}
          </p>
        </div>
      </>
    )
  }
  const showButton =
    status !== 'missed' &&
    (isToday(schedule.visit_date) ||
      (previousDate && (status === 'completed' || status === 'ongoing')))

  return (
    <>
      <Card
        className="mb-2 shadow-md border rounded min-h-[200px]"
        subTitle={subTitle()}
        title={title()}
      >
        {/* Header */}

        <Divider />

        <div className="flex-1">
          <p className="text-sm text-gray-500 mb-0">
            {c?.City} • {formatPhoneNumber(c?.Phone1) || '-'}
          </p>
          <p className="text-sm">
            {new Date(s.visit_date).toLocaleString('en-EN', {
              weekday: 'long',
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })}
          </p>
        </div>
        {visit &&
          (schedule.status.toLowerCase() === 'ongoing' ||
            schedule.status.toLowerCase() === 'completed' ||
            schedule.status.toLowerCase() === 'missed') && (
            <p className="text-sm text-gray-500 mb-0">
              Visit Started at{' '}
              {new Date(visit?.start_at).toLocaleString('en-EN', {
                hour: 'numeric',
                minute: 'numeric',
              })}
            </p>
          )}

        {visit && visit?.end_at && (
          <p className="text-sm text-gray-500 mb-0">
            Visit Ended at{' '}
            {new Date(visit?.end_at).toLocaleString('en-EN', {
              hour: 'numeric',
              minute: 'numeric',
            })}
          </p>
        )}

        {showButton && (
          <Button
            className="w-full py-2 rounded mt-3 text-sm"
            severity="secondary"
            outlined
            onClick={() => {
              const route = getVisitRoute(schedule)
              if (route) router.push(route)
            }}
            label={
              schedule.status.toLowerCase() === 'completed'
                ? 'View Details'
                : schedule.status.toLowerCase() === 'pending' ||
                  schedule.status.toLowerCase() === 'ongoing'
                ? 'Continue'
                : 'Start Visit'
            }
          />
        )}
      </Card>
    </>
  )
}
