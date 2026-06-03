'use client'

import Image from 'next/image'
import { Button } from 'primereact/button'
import { Dialog } from 'primereact/dialog'
import { FileUpload } from 'primereact/fileupload'
import { useRef, useState } from 'react'
import useSWRImmutable, { useSWRConfig } from 'swr' // Gunakan mutate dari sini

import { $api } from '@/lib/api'

type ProductImageUploaderProps = {
  code: string
  alt: string
  width?: number
  height?: number
}

// Fetcher di luar komponen agar tidak dibuat ulang setiap render
const imageCheckFetcher = async (url: string) => {
  try {
    const res = await fetch(url)
    if (!res.ok) return false
    try {
      const data = await res.json()
      return data.exists !== false
    } catch {
      return true
    }
  } catch {
    return false
  }
}

export default function ProductImageUploader({
  code,
  alt,
  width = 120,
  height = 120,
}: ProductImageUploaderProps) {
  const [preview, setPreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const [version, setVersion] = useState(Date.now())

  const { mutate } = useSWRConfig()

  const swrKey = code
    ? `${process.env.NEXT_PUBLIC_API_BASE_URL}product/image/${code}?nofallback=1`
    : null

  const { data: hasImage } = useSWRImmutable(swrKey, imageCheckFetcher)

  const handleUpload = async (file: File) => {
    const form = new FormData()
    form.append('image', file)

    // Optimistic UI: tampilkan preview dulu
    const objectUrl = URL.createObjectURL(file)
    setPreview(objectUrl)
    setLoading(true)

    try {
      await $api(`/product/image/${code}`, {
        method: 'POST',
        body: form,
      })

      // Paksa SWR cek ulang ke server bahwa gambar sekarang "exists: true"
      setVersion(Date.now())
      await mutate(swrKey)
      setPreview(null)
    } catch (e) {
      console.error(e)
      setPreview(null)
    } finally {
      setLoading(false)
      URL.revokeObjectURL(objectUrl) // Bersihkan memory
    }
  }

  const handleRemove = async () => {
    setLoading(true)
    try {
      await $api(`/product/image/${code}`, {
        method: 'DELETE',
      })

      // Paksa SWR cek ulang agar hasImage jadi false
      await mutate(swrKey)
      setPreview(null)
      setShowDeleteDialog(false)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  // State loading awal SWR
  const isInitializing = hasImage === undefined

  if (isInitializing) {
    return <div className="bg-gray-100 animate-pulse" style={{ width, height }} />
  }

  if (!hasImage && !preview) {
    const chooseOptions = {
      icon: 'pi pi-fw pi-images',
      className: 'custom-choose-btn p-button-rounded p-button-outlined p-button-success',
    }

    return (
      <FileUpload
        chooseOptions={chooseOptions}
        mode="basic"
        chooseLabel="Upload"
        accept="image/png,image/jpeg"
        customUpload
        auto
        uploadHandler={(e) => handleUpload(e.files[0])}
      />
    )
  }

  return (
    <div
      className="relative border-1 border-gray-200 overflow-hidden bg-white"
      style={{ width, height }}
    >
      <Image
        src={
          preview ??
          `${process.env.NEXT_PUBLIC_API_BASE_URL}product/image/${code}?t=${version}&noFallback=false`
        }
        alt={alt}
        fill
        sizes={`${width}px`}
        className="object-contain"
        unoptimized
        loading="eager"
      />

      {!preview && hasImage && (
        <div className="absolute top-1 right-1 flex gap-1">
          <Button
            icon="pi pi-pencil"
            onClick={() => inputRef.current?.click()}
            className="p-button-rounded p-button-text p-button-success bg-white shadow-2"
            style={{ width: '2rem', height: '2rem' }}
          />
          <Button
            icon="pi pi-trash"
            onClick={() => setShowDeleteDialog(true)}
            className="p-button-rounded p-button-text p-button-danger bg-white shadow-2"
            style={{ width: '2rem', height: '2rem' }}
          />
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) handleUpload(file)
          e.target.value = ''
        }}
      />

      {loading && (
        <div className="absolute inset-0 bg-white-alpha-50 flex align-items-center justify-content-center">
          <i className="pi pi-spin pi-spinner" style={{ fontSize: '1.5rem' }}></i>
        </div>
      )}

      <Dialog
        header="Confirm Delete"
        visible={showDeleteDialog}
        onHide={() => setShowDeleteDialog(false)}
        modal
        footer={
          <div className="flex justify-content-end gap-2">
            <Button
              label="Cancel"
              className="p-button-text"
              onClick={() => setShowDeleteDialog(false)}
            />
            <Button label="Delete" severity="danger" onClick={handleRemove} />
          </div>
        }
      >
        <p>Are you sure you want to delete this image?</p>
      </Dialog>
    </div>
  )
}
