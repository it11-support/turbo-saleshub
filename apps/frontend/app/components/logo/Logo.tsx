import Image from 'next/image'

type LogoProps = {
  src?: string
  width?: number
  height?: number
  className?: string
}
const Logo = ({
  src = '/images/logo/logo.png',
  width = 84,
  height = 84,
  className = ' mb-5 w-6rem flex-shrink-0 ',
}: LogoProps) => {
  return (
    <Image
      src={src}
      alt="logo"
      width={width}
      height={height}
      className={className}
      loading="eager"
    />
  )
}

export default Logo
