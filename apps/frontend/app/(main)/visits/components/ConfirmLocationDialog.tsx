import Image from 'next/image'
import { Button } from 'primereact/button'
import { Dialog } from 'primereact/dialog'
import { Message } from 'primereact/message'

export type ConfirmLocationDialogMode =
  'NO_LOCATION' | 'DISTANCE_TOO_FAR' | 'LOW_ACCURACY' | 'PERMISSION_DENIED' | 'POSITION_UNAVAILABLE'

interface ConfirmLocationDialogProps {
  visible: boolean
  mode: ConfirmLocationDialogMode
  distance?: number
  accuracy?: number
  onHide: () => void
  onSaveLocation: () => void
}

export default function ConfirmLocationDialog({
  visible,
  mode,
  distance,
  accuracy,
  onHide,
  onSaveLocation,
}: ConfirmLocationDialogProps) {
  const isError = mode === 'PERMISSION_DENIED' || mode === 'POSITION_UNAVAILABLE'

  const formatDistance = (distance: number) => {
    if (distance < 1000) {
      return `±${Math.round(distance)} m`
    }

    const km = distance / 1000

    return `±${Number(km.toFixed(1))} km`
  }

  const footer = isError ? (
    <div className="flex justify-end">
      <Button
        label="Close"
        icon="pi pi-times"
        severity="secondary"
        outlined
        size="small"
        onClick={onHide}
      />
    </div>
  ) : (
    <div className="flex justify-end gap-2">
      <Button
        label="Cancel"
        icon="pi pi-times"
        severity="secondary"
        outlined
        size="small"
        onClick={onHide}
      />

      <Button label="Save Location" icon="pi pi-map" size="small" onClick={onSaveLocation} />
    </div>
  )

  return (
    <Dialog
      header="Confirm Check-in"
      visible={visible}
      style={{ width: '32rem', maxWidth: '95vw' }}
      modal
      closable={false}
      draggable={false}
      resizable={false}
      onHide={onHide}
      footer={footer}
    >
      {mode === 'NO_LOCATION' && (
        <div className="space-y-3">
          <Message
            severity="info"
            className="w-full"
            text="Customer location is not available yet."
          />

          <p className="pt-2 leading-6">
            This process will save the customer location and visit check-in location based on your
            current position.
          </p>
        </div>
      )}

      {mode === 'DISTANCE_TOO_FAR' && (
        <div className="space-y-3">
          <Message
            severity="warn"
            className="w-full"
            text={`You are approximately ${formatDistance(
              distance ?? 0
            )} away from the customer location.`}
          />

          <p className="pt-2 leading-6">
            This process will save the visit check-in location based on your current position
          </p>
        </div>
      )}

      {mode === 'LOW_ACCURACY' && (
        <div className="space-y-3">
          <Message
            severity="warn"
            className="w-full"
            text={`Low GPS accuracy (${formatDistance(accuracy ?? 0)}).`}
          />

          <p className="pt-2 leading-6">
            The current location is not accurate enough to be saved as the customer location.
          </p>

          <p className="leading-6">
            This process will save the visit check-in location based on your current position
          </p>
        </div>
      )}
      {mode === 'PERMISSION_DENIED' && (
        <div className="space-y-4">
          <Message
            severity="warn"
            className="w-full"
            text="The app does not have location permission."
          />

          <Image
            src="/images/permissions/location-permission.png"
            alt="How to enable location permission"
            width={333}
            height={500}
            className="mx-auto border rounded-lg max-w-xs w-full h-auto mt-2"
          />

          <div className="space-y-2 text-sm leading-6">
            <p>To proceed, please enable location permission on your device</p>

            <ol className="list-decimal pl-5 space-y-2">
              <li>
                <p>
                  {' '}
                  Click the <strong>Site settings</strong> icon next to the website address (as
                  shown in the image above).
                </p>
              </li>
              <li>
                <p>
                  Select <strong>Location</strong>.
                </p>
              </li>
              <li>
                <p>
                  {' '}
                  Change the permission to <strong>Allow</strong>.
                </p>
              </li>
              <li>
                <p>Refresh the page, then try checking in again.</p>
              </li>
            </ol>
          </div>
        </div>
      )}
      {mode === 'POSITION_UNAVAILABLE' && (
        <div className="space-y-3">
          <Message severity="warn" className="w-full" text="Current location is unavailable" />

          <p className="pt-2 leading-6">Please check your GPS and try checking in again.</p>
        </div>
      )}
    </Dialog>
  )
}
