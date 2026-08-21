import { Button } from 'primereact/button'
import { Dialog, DialogProps } from 'primereact/dialog'
import React from 'react'

type BaseDialogProps = Omit<DialogProps, 'children'> & {
  children?: React.ReactNode
  title?: React.ReactNode
  footer?: React.ReactNode
  showFooter?: boolean
  onCancel?: () => void
  onConfirm?: () => void | Promise<void>
  confirmLabel?: string
  cancelLabel?: string
  confirmIcon?: string
  cancelIcon?: string
  confirmSeverity?: 'success' | 'danger' | 'info' | 'warning' | 'secondary'
  cancelSeverity?: 'success' | 'danger' | 'info' | 'warning' | 'secondary'
  loading?: boolean
  className?: string
  style?: React.CSSProperties
}

const BaseDialog = ({
  children,
  title,
  footer,
  showFooter = true,
  onCancel,
  onConfirm,
  confirmLabel = 'Save',
  cancelLabel = 'Cancel',
  confirmIcon = 'pi pi-save',
  cancelIcon = 'pi pi-times',
  confirmSeverity = 'success',
  cancelSeverity = 'danger',
  loading = false,
  className = 'mx-auto md:w-30rem',
  style = { width: '100%', maxWidth: '500px' },
  onHide,
  ...dialogProps
}: BaseDialogProps) => {
  const [internalLoading, setInternalLoading] = React.useState(false)

  const isAsync = onConfirm && (onConfirm as any).constructor.name === 'AsyncFunction'
  const isLoading = loading || (isAsync ? internalLoading : false)

  const handleConfirm = async () => {
    if (!onConfirm) return
    if (isAsync) {
      setInternalLoading(true)
      try {
        await onConfirm()
      } finally {
        setInternalLoading(false)
      }
    } else {
      onConfirm()
    }
  }

  const defaultFooter = (
    <div className="flex justify-end">
      <Button
        outlined
        icon={cancelIcon}
        severity={cancelSeverity}
        className="btn btn-primary mr-2"
        onClick={onCancel ?? onHide}
        label={cancelLabel}
        type="button"
      />
      <Button
        outlined
        icon={confirmIcon}
        severity={confirmSeverity}
        className="btn btn-primary mr-2"
        onClick={handleConfirm}
        label={confirmLabel}
        type="button"
        disabled={isLoading}
        loading={isLoading}
      />
    </div>
  )

  return (
    <Dialog
      dismissableMask
      blockScroll
      header={title}
      className={className}
      style={style}
      onHide={onHide}
      footer={showFooter ? footer || defaultFooter : undefined}
      {...dialogProps}
    >
      {children}
    </Dialog>
  )
}

export default BaseDialog
