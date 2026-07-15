import { VisitStatus } from '@saleshub-tsm/types'

type StatusIconProps = {
  status: string
  size?: string
  className?: string
}

const STATUS_ICON_MAP: Record<string, { icon: string; color: string }> = {
  [VisitStatus.Completed]: { icon: 'pi pi-check-circle', color: 'var(--green-500)' },
  [VisitStatus.Planned]: { icon: 'pi pi-clock', color: 'var(--orange-500)' },
  [VisitStatus.Pending]: { icon: 'pi pi-clock', color: 'var(--orange-500)' },
  [VisitStatus.Cancelled]: { icon: 'pi pi-times-circle', color: 'var(--red-500)' },
  [VisitStatus.Missed]: { icon: 'pi pi-info-circle', color: 'var(--red-500)' },
  [VisitStatus.Ongoing]: { icon: 'pi pi-caret-right', color: 'var(--green-500)' },
}

const StatusIcon = ({ status, size = 'text-xl', className = '' }: StatusIconProps) => {
  const normalizedStatus = status?.toLowerCase().trim()
  const config = STATUS_ICON_MAP[normalizedStatus]

  if (!config) return null

  return <i className={`${config.icon} ${size} ${className}`} style={{ color: config.color }} />
}

export default StatusIcon
