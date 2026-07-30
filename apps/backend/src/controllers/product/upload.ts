import crypto from 'crypto'
import fileUpload from 'express-fileupload'
import path from 'path'
import { promises as fsAsync } from 'fs'

import { isSafeRelativePath } from './path.js'

export const deleteExistingImages = async (
  baseDir: string,
  itemCode: string
): Promise<boolean> => {
  let deleted = false

  const files = await fsAsync.readdir(baseDir)

  for (const file of files) {
    if (!file.startsWith(`${itemCode}.`)) {
      continue
    }

    const oldPath = path.resolve(baseDir, file)

    if (!isSafeRelativePath(baseDir, oldPath)) {
      continue
    }

    await fsAsync.rm(oldPath, {
      force: true,
    })

    deleted = true
  }

  return deleted
}


export const saveImage = async (
  imageFile: fileUpload.UploadedFile,
  destinationPath: string,
  ext: string,
  baseDir: string
) => {
  const tempDir = await fsAsync.mkdtemp(
    path.join(baseDir, '.upload-')
  )

  try {
    const tempFile = path.resolve(
      tempDir,
      `${crypto.randomUUID()}${ext}`
    )

    if (!isSafeRelativePath(tempDir, tempFile)) {
      throw new Error('Invalid temporary file path')
    }

    await imageFile.mv(tempFile)

    const resolvedBaseDir =
      await fsAsync.realpath(baseDir)
    const destinationFileName = path.basename(
      destinationPath
    )
    const resolvedDestinationPath = path.resolve(
      resolvedBaseDir,
      destinationFileName
    )
    const resolvedDestinationDir =
      await fsAsync.realpath(
        path.dirname(resolvedDestinationPath)
      )
    const canonicalDestinationPath = path.join(
      resolvedDestinationDir,
      destinationFileName
    )

    if (
      !isSafeRelativePath(
        resolvedBaseDir,
        canonicalDestinationPath
      )
    ) {
      throw new Error(
        'Invalid destination file path'
      )
    }

    await fsAsync.copyFile(
      tempFile,
      canonicalDestinationPath
    )

    await fsAsync.unlink(tempFile)
  } finally {
    await fsAsync.rm(tempDir, {
      recursive: true,
      force: true,
    })
  }
}
