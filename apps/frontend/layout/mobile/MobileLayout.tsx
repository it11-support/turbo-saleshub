'use client'

import styles from './mobile.module.css'
import MobileBottomNav from './MobileBottomNav'
import MobileSidebar from './MobileSidebar'
import MobileTopbar from './MobileTopbar'
import { useEventListener } from 'primereact/hooks' // PrimeReact helper
import React, { ReactNode, useEffect, useRef, useState } from 'react'

type Props = {
  children: ReactNode
  title?: string
  userName?: string
}

export default function MobileLayout({ children, title, userName }: Props) {
  const topbarRef = useRef<{ menubutton?: HTMLButtonElement }>(null)
  const [sidebarVisible, setSidebarVisible] = useState(false)

  // 🔹 toggle sidebar
  const onMenuToggle = () => setSidebarVisible((prev) => !prev)
  const hideMenu = () => setSidebarVisible(false)

  // 🔹 event listener untuk klik di luar sidebar
  const [bindMenuOutsideClickListener, unbindMenuOutsideClickListener] = useEventListener({
    type: 'click',
    listener: (event) => {
      const sidebarEl = document.querySelector('.layout-config-sidebar')
      const menuButtonEl = topbarRef.current?.menubutton
      const target = event.target as Node

      const isInsideSidebar = sidebarEl?.contains(target)
      const isInsideMenuButton = menuButtonEl?.contains(target)

      if (!isInsideSidebar && !isInsideMenuButton) {
        hideMenu()
      }
    },
  })

  // 🔹 aktifkan / matikan event listener sesuai kondisi
  useEffect(() => {
    if (sidebarVisible) {
      bindMenuOutsideClickListener()
    } else {
      unbindMenuOutsideClickListener()
    }
  }, [sidebarVisible, bindMenuOutsideClickListener, unbindMenuOutsideClickListener])

  return (
    <div className={styles.mobileRoot}>
      {/* TOPBAR */}
      <MobileTopbar ref={topbarRef} title={title} userName={userName} onMenuToggle={onMenuToggle} />

      {/* SIDEBAR */}
      {sidebarVisible && <MobileSidebar visible={sidebarVisible} onHide={hideMenu} />}

      {/* OVERLAY (klik luar juga menutup sidebar) */}
      {sidebarVisible && <div className={styles.overlay} onClick={hideMenu}></div>}

      <main className={styles.mobileContent}>{children}</main>
      <MobileBottomNav />
    </div>
  )
}
