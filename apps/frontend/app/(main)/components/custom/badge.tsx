import { EFollowUpStatus } from '@saleshub-tsm/types'
import { Badge } from 'primereact/badge'

import { variantColors } from '@/lib/constants'

type Props = {
  value: string
  className?: string
}
const CustomBadge = (props: Props) => {
  const { value, className } = props

  const getSeverity = (): 'success' | 'warning' | 'danger' | 'info' | 'secondary' => {
    switch (value) {
      case EFollowUpStatus.FollowUp:
      case EFollowUpStatus.Pending:
        return 'warning'
      case EFollowUpStatus.Done:
        return 'success'
      case EFollowUpStatus.Closed:
        return 'danger'
      default:
        return 'info'
    }
  }

  const getColor = (): string | undefined => {
    const normalizedValue = value.toLowerCase()
    return variantColors[normalizedValue]
  }

  return (
    <Badge
      value={value}
      severity={getSeverity()}
      className={className}
      style={getColor() ? { backgroundColor: getColor() } : undefined}
    />
  )
}

export default CustomBadge
