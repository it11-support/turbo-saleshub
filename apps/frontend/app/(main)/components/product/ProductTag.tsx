import { EBadgeVariant, IConcernStatus } from '@saleshub-tsm/types'
import { Tag } from 'primereact/tag'

type Props = {
  status: IConcernStatus
}
const ProductTag = (props: Props) => {
  const { status } = props
  type TagSeverity = 'info' | 'warning' | 'success' | 'danger'

  const TAG_SEVERITY_MAP: Record<EBadgeVariant, TagSeverity> = {
    info: 'info',
    warning: 'warning',
    success: 'success',
    danger: 'danger',
    secondary: 'info',
  }

  return (
    <Tag
      className="mr-2"
      icon={status.icon}
      severity={status.level ? TAG_SEVERITY_MAP[status.level] : undefined}
      value={status.status}
    />
  )
}

export default ProductTag
