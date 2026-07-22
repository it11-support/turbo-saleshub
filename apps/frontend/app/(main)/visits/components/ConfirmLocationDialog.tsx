import { Button } from 'primereact/button'
import { Dialog } from 'primereact/dialog'
import { Message } from 'primereact/message'

export type ConfirmLocationDialogMode = 'NO_LOCATION' | 'DISTANCE_TOO_FAR' | 'LOW_ACCURACY'

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
  const footer = (
    <div className="flex justify-end gap-2">
      <Button
        label="Batal"
        icon="pi pi-times"
        severity="secondary"
        outlined
        size="small"
        onClick={onHide}
      />

      <Button label="Simpan Lokasi" icon="pi pi-map" size="small" onClick={onSaveLocation} />
    </div>
  )

  return (
    <Dialog
      header="Konfirmasi Check-in"
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
          <Message severity="info" className="w-full" text="Lokasi customer belum tersedia." />

          <p className="pt-2 leading-6">
            Proses ini akan menyimpan lokasi customer dan lokasi check-in kunjungan berdasarkan
            posisi Anda saat ini.
          </p>
        </div>
      )}

      {mode === 'DISTANCE_TOO_FAR' && (
        <div className="space-y-3">
          <Message
            severity="warn"
            className="w-full"
            text={`Lokasi Anda berjarak sekitar ${Math.round(
              distance ?? 0
            )} meter dari lokasi customer.`}
          />

          <p className="pt-2 leading-6">
            Proses ini akan memperbarui lokasi customer dan menyimpan lokasi check-in kunjungan
            berdasarkan posisi Anda saat ini
          </p>
        </div>
      )}

      {mode === 'LOW_ACCURACY' && (
        <div className="space-y-3">
          <Message
            severity="warn"
            className="w-full"
            text={`Akurasi GPS rendah (±${Math.round(accuracy ?? 0)} meter).`}
          />

          <p className="pt-2 leading-6">
            Lokasi saat ini tidak cukup akurat untuk disimpan sebagai referensi lokasi customer.
          </p>

          <p className="leading-6">
            Proses ini akan menyimpan lokasi check-in kunjungan berdasarkan posisi Anda saat ini
          </p>
        </div>
      )}
    </Dialog>
  )
}
