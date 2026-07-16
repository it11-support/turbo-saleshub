'use client'

import { useEffect, useState } from 'react'

const useIsMobile = (breakpoint = 768) => {
  // start with a deterministic value so server and initial client render match
  const [isMobile, setIsMobile] = useState<boolean>(false)

  useEffect(() => {
    if (typeof window === 'undefined') return

    const onResize = () => {
      const width = window.innerWidth
      setIsMobile(width <= breakpoint)
    }
    // set initial value on mount (client-side only)
    onResize()
    window.addEventListener('resize', onResize)
    window.addEventListener('orientationchange', onResize)

    const interval = setInterval(() => {
      onResize()
    }, 500)

    return () => {
      window.removeEventListener('resize', onResize)
      window.removeEventListener('orientationchange', onResize)
      clearInterval(interval)
    }
  }, [breakpoint])

  return isMobile
}

export default useIsMobile
