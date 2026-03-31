import { EBadgeVariant } from '@saleshub-tsm/types'

export const variantOptions = [
  { label: 'Info', value: EBadgeVariant.INFO },
  { label: 'Warning', value: EBadgeVariant.WARNING },
  { label: 'Success', value: EBadgeVariant.SUCCESS },
  { label: 'Danger', value: EBadgeVariant.DANGER },
  { label: 'Secondary', value: EBadgeVariant.SECONDARY },
]

export const variantColors: Record<string, string> = {
  info: 'var(--primary-color)',
  warning: 'var(--yellow-500)',
  success: 'var(--green-500)',
  danger: 'var(--red-500)',
  secondary: 'var(--text-color-secondary)',
}

export const ICON_OPTIONS = [
  // basic states
  { label: 'Pending', value: 'pi pi-clock' },
  { label: 'In Progress', value: 'pi pi-spinner' },
  { label: 'Completed', value: 'pi pi-check' },
  { label: 'Closed', value: 'pi pi-times' },

  // communication / waiting
  { label: 'Waiting Response', value: 'pi pi-hourglass' },
  { label: 'Contacted', value: 'pi pi-phone' },
  { label: 'Message Sent', value: 'pi pi-envelope' },

  // attention
  { label: 'Warning', value: 'pi pi-exclamation-triangle' },
  { label: 'Information', value: 'pi pi-info-circle' },

  // control state
  { label: 'Paused', value: 'pi pi-pause' },
  { label: 'Stopped', value: 'pi pi-stop' },
  { label: 'Locked', value: 'pi pi-lock' },
  { label: 'Cancelled', value: 'pi pi-ban' },

  // retry / process
  { label: 'Retrying', value: 'pi pi-refresh' },
  { label: 'Syncing', value: 'pi pi-sync' },

  // business context
  { label: 'Deal', value: 'pi pi-dollar' },
  { label: 'Assigned', value: 'pi pi-user' },
]
