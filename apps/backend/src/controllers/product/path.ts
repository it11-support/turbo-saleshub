import path from 'path'

export const isSafeRelativePath = (
  baseDir: string,
  targetPath: string
) => {
  const relative = path.relative(
    baseDir,
    targetPath
  )

  return (
    !relative.startsWith('..') &&
    !path.isAbsolute(relative)
  )
}

export const buildDestinationPath = (
  baseDir: string,
  fileName: string
) => {
  const destinationPath = path.resolve(
    baseDir,
    fileName
  )

  if (
    !isSafeRelativePath(
      baseDir,
      destinationPath
    )
  ) {
    throw new Error('Invalid file path')
  }

  return destinationPath
}
