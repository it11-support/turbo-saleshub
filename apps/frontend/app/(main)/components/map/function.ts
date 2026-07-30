import { IVisit } from '@saleshub-tsm/types'
import dayjs from 'dayjs'

const markerSvg = `
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="32"
      height="32"
      viewBox="0 0 32 32"
    >
      <path
        fill="#ef4444"
        stroke="#ffffff"
        stroke-width="1"
        d="M16.001 1.072c5.291 0 9.596 4.305 9.596 9.597 0 1.683-.446 3.341-1.29 4.799l-8.307 14.394-8.308-14.395c-.843-1.456-1.289-3.115-1.289-4.798 0-5.292 4.305-9.597 9.597-9.597zM16.001 14.4c2.058 0 3.731-1.674 3.731-3.731s-1.674-3.731-3.731-3.731c-2.058 0-3.732 1.674-3.732 3.731s1.674 3.731 3.732 3.731z"
      />
    </svg>
    `

export const markerIcon = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(markerSvg)

export const popupContent = (visit: Partial<IVisit>) => {
  return `<div style="font-weight:600;font-size:14px">
        <i class="pi pi-building" style="margin-right:6px"></i>
          ${visit.customer?.CardName}
        </div>
        <div style="margin-top:6px;font-size:13px">
          <i class="pi pi-calendar" style="margin-right:6px"></i>
          ${dayjs(visit.start_at).format('DD MMM YYYY HH:mm')}
        </div>
        <div style="margin-top:4px;font-size:13px">
          <i class="pi pi-user" style="margin-right:6px"></i>
          ${visit.salesPerson?.SlpName ?? '-'}
        </div>
      `
}
