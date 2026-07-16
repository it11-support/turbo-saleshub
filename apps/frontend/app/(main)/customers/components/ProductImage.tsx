'use client'
import Image from 'next/image'

const ProductImage = ({ code, alt }: { code: string; alt: string }) => {
  return (
    <Image
      src={`${process.env.NEXT_PUBLIC_API_BASE_URL}product/image/${code}`}
      width={80}
      height={80}
      alt={alt}
      loading="eager"
    />
  )
}

export default ProductImage
