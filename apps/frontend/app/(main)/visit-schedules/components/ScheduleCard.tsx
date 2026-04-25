'use client'

import { VisitSchedule, VisitStatus } from '@saleshub-tsm/types'
import { isToday } from 'date-fns'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from 'primereact/button'
import { Card } from 'primereact/card'
import { Divider } from 'primereact/divider'

import { formatDate } from '@/lib/dateUtils'
import { formatPhoneNumber } from '@/lib/phoneParser'
import { useScheduleStore } from '@/stores'

interface ScheduleCardProps {
  schedule: VisitSchedule
}

type VisitConcernItem = {
  visitDate: string | Date | undefined
  category: string | undefined
  status: string | undefined
  notes: string | null
  due_date?: string | Date
}
export default function ScheduleCard({ schedule }: ScheduleCardProps) {
  const s = schedule
  const c = schedule.rule.customer
  const visit = schedule.visit
  const router = useRouter()
  const todayKey = new Date().toISOString().slice(0, 10)
  const scheduleDateKey = new Date(schedule.visit_date).toISOString().slice(0, 10)
  const { createVisitSchedule } = useScheduleStore()

  const previousDate = scheduleDateKey < todayKey
  const handleVisitNavigation = async (schedule: VisitSchedule) => {
    const status = schedule.status?.toLowerCase().trim()

    if (schedule.id === null || schedule.is_followup) {
      try {
        const newVisit = await createVisitSchedule({
          sales_person_id: Number(schedule.sales_person_id),
          customer_id: Number(schedule.customer_id),
          visit_date: schedule.visit_date,
        })

        if (newVisit?.id) {
          router.push(`/visits/${newVisit.id}`)
        }
        return
      } catch (error) {
        console.error('Gagal membuat visit:', error)
        return
      }
    }

    if (status === 'completed') {
      router.push(`/visits/details/${schedule.id}`)
    } else {
      router.push(`/visits/${schedule.id}`)
    }
  }

  const groupedByVisit = schedule.open_issues?.reduce((acc, item) => {
    const visitId = Number(item.visit_id)
    if (!acc[visitId]) {
      acc[visitId] = []
    }

    item.visit_item_concerns?.forEach((c) => {
      acc[visitId].push({
        visitDate: item?.visit_date,
        category: c.category?.name,
        status: c.status?.status,
        notes: c.notes,
      })
    })

    return acc
  }, {} as Record<number, VisitConcernItem[]>)

  const status = schedule.status.toLowerCase()

  const title = () => {
    return (
      <>
        <div className={`w-full flex justify-between items-center border-t`}>
          <h2 className="text-sm font-bold">{c?.CardName}</h2>
          <span className="mx-auto text-center"></span>

          {schedule.status.toLocaleLowerCase() === VisitStatus.Completed.toLowerCase() && (
            <i
              className="pi pi-check-circle ml-2 text-xl"
              style={{ color: 'var(--green-500)' }}
            ></i>
          )}
          {schedule.status.toLocaleLowerCase() === VisitStatus.Planned.toLowerCase() && (
            <i className="pi pi-clock ml-2 text-xl" style={{ color: 'var(--orange-500)' }}></i>
          )}
          {schedule.status.toLocaleLowerCase() === VisitStatus.Pending.toLowerCase() && (
            <i className="pi pi-clock ml-2 text-xl" style={{ color: 'var(--orange-500)' }}></i>
          )}
          {schedule.status.toLocaleLowerCase() === VisitStatus.Cancelled.toLowerCase() && (
            <i className="pi pi-times-circle ml-2 text-xl" style={{ color: 'var(--red-500)' }}></i>
          )}
          {schedule.status.toLocaleLowerCase() === VisitStatus.Missed.toLowerCase() && (
            <i className="pi pi-info-circle ml-2 text-xl" style={{ color: 'var(--red-500)' }}></i>
          )}

          {schedule.status.toLocaleLowerCase() === VisitStatus.Ongoing.toLowerCase() && (
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
    status !== VisitStatus.Missed.toLowerCase() &&
    (isToday(schedule.visit_date) ||
      (previousDate &&
        (status === VisitStatus.Completed.toLowerCase() ||
          status === VisitStatus.Ongoing.toLowerCase())))

  return (
    <>
      <Card
        pt={{
          root: {
            style: {
              minHeight: '100%',
            },
          },
        }}
        className="mb-2 shadow-md border rounded min-h-[200px]"
        subTitle={subTitle()}
        title={title()}
      >
        {/* Header */}

        {Object.entries(groupedByVisit || {}).map(
          ([visitId, concerns]) =>
            concerns.length > 0 && (
              <Link key={visitId} href={`/visits/issues/${visitId}`} className="no-underline">
                <div className="flex align-items-center gap-2 cursor-pointer text-sm text-gray-600 hover:text-yellow-600 transition-colors">
                  <i className="pi pi-exclamation-triangle text-yellow-500"></i>
                  <span className="font-medium">
                    {concerns.length} Open Issues ({formatDate(concerns[0].visitDate)})
                  </span>
                </div>
              </Link>
            )
        )}
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
          (schedule.status.toLowerCase() === VisitStatus.Ongoing.toLowerCase() ||
            schedule.status.toLowerCase() === VisitStatus.Completed.toLowerCase() ||
            schedule.status.toLowerCase() === VisitStatus.Missed.toLowerCase()) && (
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
            severity="success"
            outlined
            onClick={() => handleVisitNavigation(schedule)}
            label={
              schedule.status.toLowerCase() === VisitStatus.Completed.toLowerCase()
                ? 'View Details'
                : schedule.status.toLowerCase() === VisitStatus.Pending.toLowerCase() ||
                  schedule.status.toLowerCase() === VisitStatus.Ongoing.toLowerCase()
                ? 'Continue'
                : 'Start Visit'
            }
          />
        )}
      </Card>
    </>
  )
}
