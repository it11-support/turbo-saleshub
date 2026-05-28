'use client'
import NavButton from '../../customers/components/NavButton'
import Image from 'next/image'
import { Button } from 'primereact/button'
import {
  FileUpload,
  FileUploadHandlerEvent,
  FileUploadHeaderTemplateOptions,
  FileUploadSelectEvent,
  FileUploadUploadEvent,
  ItemTemplateOptions,
} from 'primereact/fileupload'
import { ProgressBar } from 'primereact/progressbar'
import { Tag } from 'primereact/tag'
import { Toast } from 'primereact/toast'
import { Tooltip } from 'primereact/tooltip'
import React, { SyntheticEvent, useRef, useState } from 'react'

import { $api } from '@/lib/api'

type UploadedFile = {
  itemCode: string
  filename: string
  url: string
}
const BulkUpload = () => {
  const toast = useRef<Toast>(null)
  const [totalSize, setTotalSize] = useState(0)
  const fileUploadRef = useRef<FileUpload>(null)

  const onTemplateSelect = (e: FileUploadSelectEvent) => {
    let _totalSize = totalSize
    const files = e.files

    for (let i = 0; i < files.length; i++) {
      _totalSize += files[i].size || 0
    }

    setTotalSize(_totalSize)
  }

  const onTemplateUpload = (e: FileUploadUploadEvent) => {
    let _totalSize = 0

    e.files.forEach((file) => {
      _totalSize += file.size || 0
    })

    setTotalSize(_totalSize)
    toast.current?.show({ severity: 'info', summary: 'Success', detail: 'File Uploaded' })
  }

  const onTemplateRemove = (file: File, callback: (event: SyntheticEvent) => void) => {
    setTotalSize(totalSize - file.size)
    callback({} as SyntheticEvent)
  }

  const onTemplateClear = () => {
    setTotalSize(0)
  }

  const headerTemplate = (options: FileUploadHeaderTemplateOptions) => {
    const { className, chooseButton, uploadButton, cancelButton } = options
    const value = (totalSize / 5242880) * 100
    const formatedValue =
      fileUploadRef && fileUploadRef.current ? fileUploadRef.current.formatSize(totalSize) : '0 B'

    return (
      <>
        <div
          className={className}
          style={{ backgroundColor: 'transparent', display: 'flex', alignItems: 'center' }}
        >
          {chooseButton}
          {uploadButton}
          {cancelButton}
          <div className="flex align-items-center gap-3 ml-auto">
            <span>{formatedValue} / 5 MB</span>
            <ProgressBar
              value={value}
              showValue={false}
              style={{ width: '10rem', height: '12px' }}
            ></ProgressBar>
          </div>
        </div>
      </>
    )
  }

  const fileObjectURL = (file: File) => {
    return URL.createObjectURL(file)
  }

  const itemTemplate = (inFile: object, props: ItemTemplateOptions) => {
    const file = inFile as File
    return (
      <div className="flex align-items-center flex-wrap">
        <div className="flex align-items-center" style={{ width: '40%' }}>
          <Image alt={file.name} role="presentation" src={fileObjectURL(file)} width={100} />
          <span className="flex flex-column text-left ml-3">
            {file.name}
            <small>{new Date().toLocaleDateString()}</small>
          </span>
        </div>
        <Tag value={props.formatSize} severity="warning" className="px-3 py-2" />
        <Button
          type="button"
          icon="pi pi-times"
          className="p-button-outlined p-button-rounded p-button-danger ml-auto"
          onClick={() => onTemplateRemove(file, props.onRemove)}
        />
      </div>
    )
  }

  const emptyTemplate = () => {
    return (
      <div className="flex align-items-center flex-column">
        <i
          className="pi pi-image mt-3 p-5"
          style={{
            fontSize: '5em',
            borderRadius: '50%',
            backgroundColor: 'var(--surface-b)',
            color: 'var(--surface-d)',
          }}
        ></i>
        <span style={{ fontSize: '1.2em', color: 'var(--text-color-secondary)' }} className="my-5">
          Drag and Drop Image Here
        </span>
      </div>
    )
  }

  const chooseOptions = {
    icon: 'pi pi-fw pi-images',
    iconOnly: true,
    className: 'custom-choose-btn p-button-rounded p-button-outlined',
  }
  const uploadOptions = {
    icon: 'pi pi-fw pi-cloud-upload',
    iconOnly: true,
    className: 'custom-upload-btn p-button-success p-button-rounded p-button-outlined',
  }
  const cancelOptions = {
    icon: 'pi pi-fw pi-times',
    iconOnly: true,
    className: 'custom-cancel-btn p-button-danger p-button-rounded p-button-outlined',
  }

  const uploadHandler = async (event: FileUploadHandlerEvent) => {
    try {
      const files = event.files as File[]

      const formData = new FormData()
      files.forEach((file) => {
        formData.append('files', file)
      })

      const { data, message, status } = await $api(`/product/images`, {
        method: 'POST',
        body: formData,
      })

      const successNames = data.map((d: UploadedFile) => d.filename)
      const remainFiles = files.filter((file) => !successNames.includes(file.name))
      fileUploadRef.current?.setFiles(remainFiles)

      const newTotalSize = remainFiles.reduce((sum, f) => sum + f.size, 0)
      setTotalSize(newTotalSize)

      toast.current?.show({
        severity: status === 'success' ? 'success' : 'error',
        summary: status === 'success' ? 'Success' : 'Error',
        detail: message,
      })
    } catch (error) {
      console.error('Error uploading files:', error)
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to upload files',
      })
    }
  }

  const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    const items = e.clipboardData.items

    const files: File[] = []

    for (let i = 0; i < items.length; i++) {
      const item = items[i]
      if (item.type.startsWith('image')) {
        const file = item.getAsFile()
        if (file) files.push(file)
      }
    }

    if (files.length && fileUploadRef.current) {
      fileUploadRef.current.setFiles([...(fileUploadRef.current.getFiles() || []), ...files])
    }
  }

  return (
    <div className="card p-4">
      {/* Header */}
      <NavButton />
      <h5 className="mb-0">Bulk Upload</h5>
      <div className="mb-3">
        <p className="text-sm text-gray-500">The filename must match the product's Item Code.</p>
      </div>
      <div className="grid mb-4">
        <div className="col-12 lg:col-8 md:col-10">
          <Toast ref={toast}></Toast>

          <Tooltip target=".custom-choose-btn" content="Choose" position="bottom" />
          <Tooltip target=".custom-upload-btn" content="Upload" position="bottom" />
          <Tooltip target=".custom-cancel-btn" content="Clear" position="bottom" />
          <div onPaste={handlePaste}>
            <FileUpload
              ref={fileUploadRef}
              name="product_images[]"
              multiple
              accept="image/*"
              maxFileSize={5242880}
              onUpload={onTemplateUpload}
              onSelect={onTemplateSelect}
              onError={onTemplateClear}
              onClear={onTemplateClear}
              headerTemplate={headerTemplate}
              itemTemplate={itemTemplate}
              emptyTemplate={emptyTemplate}
              chooseOptions={chooseOptions}
              uploadOptions={uploadOptions}
              cancelOptions={cancelOptions}
              customUpload
              uploadHandler={uploadHandler}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default BulkUpload
