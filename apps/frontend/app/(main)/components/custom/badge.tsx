import { EFollowUpStatus } from '@saleshub-tsm/types'
import { Badge } from 'primereact/badge'

type Props = {
  value: string
}
const CustomBadge = (porps: Props) => {
  const { value } = porps

  const severity = () => {
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

  return <Badge value={value} severity={severity()} />
}

export default CustomBadge
