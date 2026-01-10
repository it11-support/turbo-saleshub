'use client'

import { usePathname } from 'next/navigation'
import React from 'react'

import MobileLayout from './MobileLayout'
import useIsMobile from './useIsMobile'

type ViewportLayoutSwitcherProps = {
  children: React.ReactNode
}

const ViewportLayoutSwitcher = ({ children }: ViewportLayoutSwitcherProps) => {
  const isMobile = useIsMobile(768)
  const pathname = usePathname() || '/'

  const FULL_PAGE_PREFIXES = ['/auth', '/pages', '/landing', '/notfound']
  const isFullPageRoute = FULL_PAGE_PREFIXES.some((p) => pathname.startsWith(p))

  if (isMobile && !isFullPageRoute) {
    return <MobileLayout title="SALES HUB">{children}</MobileLayout>
  }

  return <>{children}</>
}

export default ViewportLayoutSwitcher
