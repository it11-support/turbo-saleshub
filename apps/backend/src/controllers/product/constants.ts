import path from 'path'

export const PRODUCT_IMAGE_DIR = path.resolve(
  process.cwd(),
  'public/images/product'
)

export const IMAGE_MIME_TO_EXT: Record<string, string> = {
  'image/png': '.png',
  'image/jpeg': '.jpg',
  'image/webp': '.webp',
}

export const PRODUCT_IMAGE_EXTENSIONS = [
  '.png',
  '.jpg',
  '.jpeg',
]

export const MAX_IMAGE_SIZE = 5 * 1024 * 1024

export const IMAGE_FILENAME_REGEX =
  /^[A-Za-z0-9_-]+\.(png|jpg|webp)$/i
