import { IConcernStatus } from '@saleshub-tsm/types'
import { Card } from 'primereact/card'
import { Timeline } from 'primereact/timeline'
import React from 'react'

import { variantColors } from '@/lib/constants'

type VisitTimeLineProps = {
  concern_status: IConcernStatus
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

  const customizedMarker = (item: VisitTimeLineProps) => {
    return (
      <span
        className="flex w-2rem h-2rem align-items-center justify-content-center text-white border-circle z-1 shadow-1"
        style={{ backgroundColor: variantColors[item.concern_status.level!] }}
      >
        <i className={item.concern_status.icon}></i>
      </span>
    )
  }

  const cardTitle = (status: IConcernStatus) => (
    <span style={{ color: variantColors[status.level!], fontWeight: 'bold', fontSize: '1.3rem' }}>
      {status.status}
    </span>
  )

  const customizedContent = (item: VisitTimeLineProps) => {
    const isOverdue = item.next_follow_up_date
      ? new Date(item.next_follow_up_date) < new Date()
      : false
    return (
      <Card
        title={cardTitle(item.concern_status)}
        subTitle={item.date}
        pt={{
          body: { className: 'p-3' },
          content: { className: 'p-0' },
        }}
      >
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
