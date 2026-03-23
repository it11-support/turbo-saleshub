import { Card } from 'primereact/card'
import { Timeline } from 'primereact/timeline'
import React from 'react'

type VisitTimeLineProps = {
  status: string
  date: string
  icon: string
  color: string
  notes: string | null
  next_follow_up_date?: string
}

type VisitTimeLineState = {
  events: VisitTimeLineProps[]
}

const VisitTimeLine = (props: VisitTimeLineState) => {
  const { events } = props

  const getStatusColor = (status: string) => {
    const s = status?.toLowerCase()
    switch (s) {
      case 'pending':
        return 'var(--orange-500)'
      case 'progress':
        return 'var(--orange-500)'
      case 'done':
        return 'var(--green-500)'
      case 'closed':
        return 'var(--red-500)'
      default:
        return 'var(--gray-500)'
    }
  }

  const getStatusIcon = (status: string) => {
    const s = status?.toLowerCase()
    switch (s) {
      case 'pending':
        return 'pi pi-pause'
      case 'progress':
        return 'pi pi-clock'
      case 'done':
        return 'pi pi-check'
      case 'closed':
        return 'pi pi-times'
      default:
        return 'pi pi-clock'
    }
  }

  const customizedMarker = (item: VisitTimeLineProps) => {
    return (
      <span
        className="flex w-2rem h-2rem align-items-center justify-content-center text-white border-circle z-1 shadow-1"
        style={{ backgroundColor: getStatusColor(item.status) }}
      >
        <i className={getStatusIcon(item.status)}></i>
      </span>
    )
  }

  const cardTitle = (status: string) => (
    <span style={{ color: getStatusColor(status), fontWeight: 'bold' }}>{status}</span>
  )

  const customizedContent = (item: VisitTimeLineProps) => {
    const isOverdue = item.next_follow_up_date
      ? new Date(item.next_follow_up_date) < new Date()
      : false
    return (
      <Card title={cardTitle(item.status)} subTitle={item.date}>
        <p>{item.notes}</p>
        {item.next_follow_up_date && item.next_follow_up_date !== '-' && (
          <div className="mt-2">
            <small
              className={`font-italic ${
                isOverdue ? 'text-red-500 font-bold' : 'text-color-secondary'
              }`}
              style={{ display: 'block', fontStyle: 'italic' }}
            >
              Due Date: {item.next_follow_up_date}
            </small>
          </div>
        )}
      </Card>
    )
  }

  return (
    <div className="">
      <Timeline
        value={events}
        align="alternate"
        className="customized-timeline"
        marker={customizedMarker}
        content={customizedContent}
      />
    </div>
  )
}

export default VisitTimeLine
