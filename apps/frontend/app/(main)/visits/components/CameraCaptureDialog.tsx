import NextImage from 'next/image'
import { Button } from 'primereact/button'
import { Dialog } from 'primereact/dialog'
import { Message } from 'primereact/message'
import { useEffect, useRef, useState } from 'react'

import useIsMobile from '@/layout/mobile/useIsMobile'
import { useSalesVisit } from '@/stores'
type CameraCaptureDialogProps = {
  visible: boolean
  onHide: () => void
  onSave: (file: File) => void
}

type CameraError = 'PERMISSION_DENIED' | 'NO_CAMERA' | 'CAMERA_BUSY' | 'UNKNOWN'

const CameraCaptureDialog = ({ visible, onHide, onSave }: CameraCaptureDialogProps) => {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const watermarkCanvasRef = useRef<HTMLCanvasElement>(null)

  const [stream, setStream] = useState<MediaStream>()
  const [photoTaken, setPhotoTaken] = useState(false)
  const [error, setError] = useState<string>()
  const [cameraError, setCameraError] = useState<CameraError>()
  const isMobile = useIsMobile(768)

  const salesVisitStore = useSalesVisit()
  const { loading, salesVisit } = salesVisitStore

  useEffect(() => {
    if (!visible) {
      reset()
      return
    }

    openCamera()

    return () => {
      stopCamera()
    }
  }, [visible])

  const reset = () => {
    stopCamera()
    setPhotoTaken(false)
    setError(undefined)
    setCameraError(undefined)

    const canvas = canvasRef.current
    if (canvas) {
      const ctx = canvas.getContext('2d')
      ctx?.clearRect(0, 0, canvas.width, canvas.height)
    }
  }

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop())

    streamRef.current = null

    if (videoRef.current) {
      videoRef.current.srcObject = null
    }

    setStream(undefined)
  }

  const openCamera = async () => {
    try {
      stopCamera()

      setPhotoTaken(false)
      setError(undefined)

      const media = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: {
            ideal: 'environment',
          },
          width: {
            ideal: 1920,
          },
          height: {
            ideal: 1080,
          },
        },
        audio: false,
      })

      streamRef.current = media
      setStream(media)
      setPhotoTaken(false)
      setError(undefined)
    } catch (error) {
      if (error instanceof DOMException) {
        switch (error.name) {
          case 'NotAllowedError':
          case 'PermissionDeniedError':
            setCameraError('PERMISSION_DENIED')
            setError('Camera permission is denied. Please allow camera access and try again.')
            break

          case 'NotFoundError':
          case 'DevicesNotFoundError':
            setCameraError('NO_CAMERA')
            setError('No camera was found on this device. Upload a photo instead.')
            break

          case 'NotReadableError':
          case 'TrackStartError':
            setCameraError('CAMERA_BUSY')
            setError('The camera is currently being used by another application.')
            break

          default:
            setCameraError('UNKNOWN')
            setError('Unable to access your camera. Please try again.')
        }
      } else {
        setCameraError('UNKNOWN')
        setError('Unable to access your camera. Please try again.')
      }
    }
  }

  useEffect(() => {
    if (!stream || !videoRef.current) return

    const video = videoRef.current

    video.srcObject = stream

    video.onloadedmetadata = () => {
      video.play().catch(console.error)
    }

    return () => {
      video.onloadedmetadata = null
    }
  }, [stream])

  const drawToCanvas = (source: HTMLImageElement | HTMLVideoElement) => {
    const canvas = canvasRef.current

    if (!canvas) return false

    const ctx = canvas.getContext('2d')

    if (!ctx) return false

    const width = source instanceof HTMLVideoElement ? source.videoWidth : source.naturalWidth

    const height = source instanceof HTMLVideoElement ? source.videoHeight : source.naturalHeight

    if (!width || !height) {
      return false
    }

    canvas.width = width
    canvas.height = height

    ctx.clearRect(0, 0, width, height)

    // gambar foto asli
    ctx.drawImage(source, 0, 0, width, height)

    // buat watermark dengan ukuran proporsional terhadap gambar
    const watermark = createWatermarkCanvas(width, height)

    if (watermark) {
      ctx.drawImage(watermark, 0, height - watermark.height, width, watermark.height)
    }

    setPhotoTaken(true)

    return true
  }

  const capture = () => {
    const video = videoRef.current

    if (!video) return

    if (!video.videoWidth || !video.videoHeight) {
      return
    }

    if (drawToCanvas(video)) {
      stopCamera()
    }
  }

  const createWatermarkCanvas = (targetWidth: number, _targetHeight: number) => {
    const canvas = watermarkCanvasRef.current
    if (!canvas) return null

    const wmWidth = targetWidth

    // Font mengikuti lebar gambar, dibatasi agar tetap proporsional
    const fontSize = Math.max(26, Math.min(30, Math.round(targetWidth * 0.012)))
    const lineHeight = Math.round(fontSize * 1.4)
    const padding = 12

    // 3 baris teks
    const wmHeight = padding * 2 + lineHeight * 3

    canvas.width = wmWidth
    canvas.height = wmHeight

    const ctx = canvas.getContext('2d')
    if (!ctx) return null

    ctx.clearRect(0, 0, wmWidth, wmHeight)

    // Background
    ctx.fillStyle = 'rgba(40,40,40,0.55)'
    ctx.fillRect(0, 0, wmWidth, wmHeight)

    ctx.fillStyle = '#fff'
    ctx.font = `${fontSize}px Arial`
    ctx.textBaseline = 'top'

    const line1 = new Date(salesVisit.start_at).toLocaleString()

    const customer = salesVisit.customer.CardName ?? ''

    const accuracy = salesVisit.accuracy ? ` ±${Math.round(Number(salesVisit.accuracy))}m` : ''

    const line3 =
      salesVisit.lat && salesVisit.lng
        ? `${Number(salesVisit.lat).toFixed(6)}, ${Number(salesVisit.lng).toFixed(6)} (${accuracy})`
        : '-'

    ctx.fillText(line1, padding, padding)
    ctx.fillText(customer, padding, padding + lineHeight)
    ctx.fillText(line3, padding, padding + lineHeight * 2)

    return canvas
  }

  const handleUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]

    if (!file) return

    stopCamera()

    // Gunakan FileReader untuk membaca file sebagai Data URL (Base64)
    const reader = new FileReader()

    reader.onload = (e) => {
      const img = new Image()

      img.onload = () => {
        drawToCanvas(img)
      }

      // Set src menggunakan data Base64 aman yang dihasilkan
      if (e.target?.result) {
        img.src = e.target.result as string
      }
    }

    reader.readAsDataURL(file)

    event.target.value = ''
  }

  const changePhoto = async () => {
    setPhotoTaken(false)

    const canvas = canvasRef.current

    if (canvas) {
      const ctx = canvas.getContext('2d')
      ctx?.clearRect(0, 0, canvas.width, canvas.height)
    }

    await openCamera()
  }

  const handleSave = () => {
    const canvas = canvasRef.current

    if (!canvas) return

    canvas.toBlob(
      (blob) => {
        if (!blob) return

        onSave(
          new File([blob], `visit-${salesVisit.id}-${Date.now()}.jpg`, {
            type: 'image/jpeg',
          })
        )
      },
      'image/jpeg',
      0.92
    )
  }

  const footer = (
    <div className="flex justify-end gap-2">
      <Button label="Cancel" severity="secondary" outlined onClick={onHide} />

      {!photoTaken ? (
        <>
          {stream && <Button label="Capture" icon="pi pi-camera" onClick={capture} />}

          <Button
            label="Upload"
            icon="pi pi-upload"
            severity="secondary"
            onClick={() => inputRef.current?.click()}
          />
        </>
      ) : (
        <>
          {photoTaken && (
            <>
              <Button
                label="Change"
                icon="pi pi-refresh"
                severity="secondary"
                onClick={changePhoto}
              />

              <Button
                disabled={loading}
                loading={loading}
                label="Save"
                icon="pi pi-check"
                onClick={handleSave}
              />
            </>
          )}
        </>
      )}
    </div>
  )

  return (
    <Dialog
      header="Upload Visit Photo"
      visible={visible}
      onHide={onHide}
      footer={footer}
      modal
      maximized
      style={
        isMobile
          ? {
              width: '100vw',
              height: '100vh',
              margin: 0,
            }
          : {
              width: '90vw',
              maxWidth: '500px',
            }
      }
      contentStyle={{
        overflow: 'hidden',
      }}
    >
      <Message
        severity="info"
        text="Please add a photo of your visit. You can capture a new photo or upload an existing one."
        className="mb-3 w-full"
      />
      {error && !photoTaken && (
        <div className="space-y-4">
          <Message severity="warn" className="w-full" text={error} />

          {cameraError === 'PERMISSION_DENIED' && (
            <>
              <NextImage
                src="/images/permissions/camera-permission.png"
                alt="How to enable camera permission"
                width={333}
                height={500}
                className="mx-auto border rounded-lg max-w-xs w-full h-auto mt-2"
              />

              <div className="space-y-2 text-sm leading-6">
                <p>Make sure your browser has permission to access your camera.</p>

                <ol className="list-decimal pl-5 space-y-2">
                  <li>
                    Click the <strong>Site settings</strong> icon next to the website address.
                  </li>
                  <li>
                    Select <strong>Camera</strong>.
                  </li>
                  <li>
                    Change the permission to <strong>Allow</strong>.
                  </li>
                  <li>Refresh the page and try again.</li>
                </ol>
              </div>
            </>
          )}
        </div>
      )}

      <div
        style={{
          width: '100%',
          height: '70vh',
          maxHeight: '600px',
          display: stream || photoTaken ? 'flex' : 'none',
          justifyContent: 'center',
          alignItems: 'center',
          overflow: 'hidden',
        }}
      >
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          style={{
            display: photoTaken ? 'none' : 'block',
            width: '100%',
            height: '100%',
            objectFit: 'contain',
          }}
        />

        <canvas
          ref={canvasRef}
          style={{
            display: photoTaken ? 'block' : 'none',
            width: '100%',
            height: '100%',
            objectFit: 'contain',
          }}
        />
      </div>
      <canvas
        ref={watermarkCanvasRef}
        style={{
          display: 'none',
        }}
      />

      <input ref={inputRef} type="file" accept="image/*" hidden onChange={handleUpload} />
    </Dialog>
  )
}

export default CameraCaptureDialog
