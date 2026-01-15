'use client'

import Image from 'next/image'
import { Button } from 'primereact/button'
import { Dialog } from 'primereact/dialog'
import { FileUpload } from 'primereact/fileupload'
import { useState, useEffect, useRef } from 'react'

import { $api } from '@/lib/api'

type ProductImageUploaderProps = {
  code: string
  alt: string
  width?: number
  height?: number
}

export default function ProductImageUploader({
  code,
  alt,
  width = 120,
  height = 120,
}: ProductImageUploaderProps) {
  const [preview, setPreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [hasImage, setHasImage] = useState<boolean>(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // Cek image eksis
  useEffect(() => {
    const checkImage = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}product/image/${code}?nofallback=1`
        )

        if (!res.ok) {
          setHasImage(false)
          return
        }

        // parse JSON, fallback jika bukan JSON
        let exists = true
        try {
          const data = await res.json()
          if (data.exists === false) exists = false
        } catch {
          // jika server kirim file langsung, anggap exists = true
          exists = true
        }

        setHasImage(exists)
      } catch {
        setHasImage(false)
      }
    }

    checkImage()
  }, [code])

  const handleUpload = async (file: File) => {
    const form = new FormData()
    form.append('image', file)
    setPreview(URL.createObjectURL(file))
    setLoading(true)

    try {
      await $api(`/product/image/${code}`, {
        method: 'POST',
        body: form,
      })
      setHasImage(true)
      setPreview(null)
    } catch (e) {
      console.error(e)
      setPreview(null)
    } finally {
      setLoading(false)
    }
  }

  const handleRemove = async () => {
    setLoading(true)
    try {
      await $api(`/product/image/${code}`, {
        method: 'DELETE',
      })
      setHasImage(false)
      setPreview(null)
      setShowDeleteDialog(false)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  // Jika tidak ada gambar sama sekali, tampil FileUpload
  if (!hasImage && !preview) {
    const chooseOptions = {
      icon: 'pi pi-fw pi-images',
      iconOnly: false,
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
    <div className="relative border-1 border-gray-200 overflow-hidden" style={{ width, height }}>
      {(hasImage || preview) && (
        <>
          <Image
            src={
              preview ??
              `${
                process.env.NEXT_PUBLIC_API_BASE_URL
              }product/image/${code}?t=${Date.now()}&noFallback=false`
            }
            sizes={
              width && height
                ? `(max-width: ${width}px) ${width}px, (max-height: ${height}px) ${height}px, ${width}px`
                : '100vw'
            }
            priority
            alt={alt}
            fill
            className="object-contain"
          />

          {!preview && hasImage && (
            <div className="absolute top-1 right-1 flex gap-2 my-2 ml-2 ">
              <Button
                onClick={() => inputRef.current?.click()}
                outlined
                className="rounded-full p-1 shadow text-green-500 hover:bg-green-100 "
              >
                <i className="pi pi-pencil"></i>
              </Button>
              <Button
                onClick={() => setShowDeleteDialog(true)}
                outlined
                className="rounded-full p-1 shadow text-red-500 hover:bg-red-100"
              >
                <i className="pi pi-trash"></i>
              </Button>
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
            <div className="absolute inset-0 bg-white bg-opacity-50 flex items-center justify-center text-sm font-bold">
              Uploading…
            </div>
          )}
        </>
      )}

      <Dialog
        header="Confirm Delete"
        visible={showDeleteDialog}
        onHide={() => setShowDeleteDialog(false)}
        modal
        footer={
          <div className="flex justify-end gap-2">
            <Button label="Cancel" outlined onClick={() => setShowDeleteDialog(false)} />
            <Button label="Delete" severity="danger" onClick={handleRemove} />
          </div>
        }
      >
        <p>Are you sure you want to delete this image?</p>
      </Dialog>
    </div>
  )
}
