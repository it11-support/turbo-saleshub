import { IVisit } from '@saleshub-tsm/types'
import dayjs from 'dayjs'

import { SALESPERSON_COLORS } from '@/lib/constants'

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
const getSalesPersonColor = (item?: IVisit | null) => {
  const salesperson = item?.salesPerson
  const key = String(salesperson?.id ?? salesperson?.SlpCode ?? 'default')

  console.log({
    id: salesperson?.id,
    slpCode: salesperson?.SlpCode,
    key,
  })

  let hash = 0
  for (let i = 0; i < key.length; i++) {
    hash = (hash * 31 + key.charCodeAt(i)) >>> 0
  }

  return SALESPERSON_COLORS[hash % SALESPERSON_COLORS.length] ?? '#ef4444'
}

export const getMarkerIcon = (item?: IVisit | null) => {
  const color = item?.salesPerson ? getSalesPersonColor(item) : '#ef4444'

  const markerSvg = `
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="32"
      height="32"
      viewBox="0 0 32 32"
    >
      <path
        fill="${color}"
        stroke="#ffffff"
        stroke-width="1"
        d="M16.001 1.072c5.291 0 9.596 4.305 9.596 9.597 0 1.683-.446 3.341-1.29 4.799l-8.307 14.394-8.308-14.395c-.843-1.456-1.289-3.115-1.289-4.798 0-5.292 4.305-9.597 9.597-9.597zM16.001 14.4c2.058 0 3.731-1.674 3.731-3.731s-1.674-3.731-3.731-3.731c-2.058 0-3.732 1.674-3.732 3.731s1.674 3.731 3.732 3.731z"
      />
    </svg>
  `

  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(markerSvg)
}
