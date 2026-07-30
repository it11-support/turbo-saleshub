import prisma from '@/libs/prisma.js'
import fileUpload from 'express-fileupload'
import path from 'path'

import {
  IMAGE_FILENAME_REGEX,
  IMAGE_MIME_TO_EXT,
  MAX_IMAGE_SIZE,
} from './constants.js'

export interface UploadValidationResult {
  valid: boolean
  reason?: string
  itemCode?: string
  ext?: string
  safeFileName?: string
}

export const isSafeItemCode = (
  itemCode: string
): boolean =>
  /^[A-Za-z0-9_-]+$/.test(itemCode)

export const validateUploadFile = async (
  imageFile: fileUpload.UploadedFile
): Promise<UploadValidationResult> => {
  const ext = IMAGE_MIME_TO_EXT[imageFile.mimetype]

  if (!ext) {
    return {
      valid: false,
      reason: 'Invalid file type',
    }
  }

  const itemCode = path.parse(imageFile.name).name

  if (!isSafeItemCode(itemCode)) {
    return {
      valid: false,
      reason: 'Invalid filename',
    }
  }

  if (imageFile.size > MAX_IMAGE_SIZE) {
    return {
      valid: false,
      reason: 'File exceeds 5MB limit',
    }
  }

  const productExist = await prisma.products.findUnique({
    where: {
      ItemCode: itemCode,
    },
  })

  if (!productExist) {
    return {
      valid: false,
      reason: 'Item code not found',
    }
  }

  const safeFileName = `${itemCode}${ext}`

  if (!IMAGE_FILENAME_REGEX.test(safeFileName)) {
    return {
      valid: false,
      reason: 'Invalid filename',
    }
  }

  return {
    valid: true,
    itemCode,
    ext,
    safeFileName,
  }
}
