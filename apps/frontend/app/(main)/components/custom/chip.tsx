import { Chip } from 'primereact/chip'

type CustomChipProps = {
  label?: string | null
  color?: string
  removable?: boolean
  icon?: string
  onRemove?: () => boolean
}
const CustomChip = (props: CustomChipProps) => {
  const { label, color, icon, removable, onRemove } = props

  const labelValue = label ? label : ''

  const onRemoveClick = (): boolean => {
    if (onRemove) {
      onRemove()
    }
    return true
  }

  return (
    <Chip
      pt={{
        root: {
          style: {
            fontSize: '9px',
            padding: '0.2rem 0.5rem',
            height: '1.3rem',
            ...(color && { backgroundColor: color }),
          },
        },
        icon: {
          style: {
            fontSize: '0.65rem',
            marginRight: '0.25rem',
          },
        },
        label: {
          className: 'p-0',
        },
      }}
      label={labelValue}
      icon={icon ?? 'pi pi-tags'}
      removable={removable}
      onRemove={onRemoveClick}
    />
  )
}

export default CustomChip
