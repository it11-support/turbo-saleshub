import fs from 'fs'
import path from 'path'

import {
  PRODUCT_IMAGE_DIR,
  PRODUCT_IMAGE_EXTENSIONS,
} from './constants.js'

import { buildDestinationPath, isSafeRelativePath } from './path.js'
import fileUpload from 'express-fileupload'
import { validateUploadFile } from './validation.js'
import { deleteExistingImages, saveImage } from './upload.js'

interface ProcessUploadResult {
  success: boolean
  reason?: string
  itemCode?: string
  fileName?: string
}

export const getFallbackImage = () =>
  path.resolve(
    PRODUCT_IMAGE_DIR,
    'no-image.png'
  )

export const findProductImage = (
  itemCode: string
): string | null => {
  for (const ext of PRODUCT_IMAGE_EXTENSIONS) {
    const targetPath = path.resolve(
      PRODUCT_IMAGE_DIR,
      `${itemCode}${ext}`
    )

    if (
      !isSafeRelativePath(
        PRODUCT_IMAGE_DIR,
        targetPath
      )
    ) {
      continue
    }

    if (fs.existsSync(targetPath)) {
      return targetPath
    }
  }

  return null
}




export const processUploadFile = async (
  imageFile: fileUpload.UploadedFile
): Promise<ProcessUploadResult> => {
  const validation =
    await validateUploadFile(imageFile)

  if (!validation.valid) {
    return {
      success: false,
      reason: validation.reason,
    }
  }

  const {
    itemCode,
    ext,
    safeFileName,
  } = validation

  const destinationPath = buildDestinationPath(
    PRODUCT_IMAGE_DIR,
    safeFileName!
  )

  await deleteExistingImages(
    PRODUCT_IMAGE_DIR,
    itemCode!
  )

  await saveImage(
    imageFile,
    destinationPath,
    ext!,
    PRODUCT_IMAGE_DIR
  )

  return {
    success: true,
    itemCode,
    fileName: safeFileName,
  }
}

