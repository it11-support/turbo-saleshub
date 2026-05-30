'use client'

import styles from './mobile.module.css'
import { useAuth } from '../context/AuthContext'
import { LayoutContext } from '../context/layoutcontext'
import Image from 'next/image'
import Link from 'next/link'
import { Badge } from 'primereact/badge'
import { forwardRef, useContext, useImperativeHandle, useRef } from 'react'
import useSWR from 'swr'

import { fetcher } from '@/app/(main)/lib'
import { createUrl } from '@/lib/api'
import { LayoutState } from '@/types'

type Props = {
  title?: string
  userName?: string
  onMenuToggle?: () => void
}

// Gunakan forwardRef supaya parent (MobileLayout) bisa akses ref tombolnya
export default forwardRef(function MobileTopbar(
  { title = 'SALES HUB', userName, onMenuToggle }: Props,
  ref
) {
  const appTitle = process.env.NEXT_PUBLIC_APP_TITLE || title
  const menubuttonRef = useRef<HTMLButtonElement>(null)
  const { setLayoutState } = useContext(LayoutContext)

  const { logout, user } = useAuth()

  const apiNotifUrl = createUrl('notifications/unread', { userId: Number(user?.id) })
  const { data } = useSWR(() => (user?.id ? apiNotifUrl : null), fetcher, {
    revalidateOnFocus: false,
  })

  const notifications = data?.data
  const totalNotifications = notifications?.length

  useImperativeHandle(ref, () => ({
    menubutton: menubuttonRef.current,
  }))

  const onConfigButtonClick = () => {
    setLayoutState((prevState: LayoutState) => ({ ...prevState, configSidebarVisible: true }))
  }

  return (
    <header className={styles.topbar}>
      <div className={styles.topbarInner}>
        {/* Tombol Menu (ikon hamburger) */}
        <button
          ref={menubuttonRef}
          type="button"
          className={`${styles.menuButton} p-link layout-topbar-button`}
          onClick={onMenuToggle}
          aria-label="Toggle menu"
        >
          <i className="pi pi-bars text-2xl" />
        </button>

        {/* Logo + Title */}
        <div className={styles.logoWrap}>
          <div className={styles.logoCircle} aria-hidden>
            {/* simple home icon */}
            <Image src={`/images/logo/logo.png`} width={35} height={35} alt={'Logo'} />
          </div>
        </div>

        {/* Judul dan User */}
        <div className={styles.titleWrap}>
          <div className={styles.appTitle}>{appTitle}</div>
          {userName && <div className={styles.greeting}>Hi, {userName}</div>}
        </div>
      </div>
      <div>
        <div className="layout-topbar-menu flex w-full justify-end items-center gap-4">
          <Link href={'/notifications'}>
            <button
              type="button"
              className={`${styles.menuButton} p-link layout-topbar-button`}
              aria-label="Seetings"
            >
              <i className="pi pi-bell text-2xl p-overlay-badge">
                {totalNotifications > 0 && (
                  <Badge
                    value={
                      totalNotifications > 0
                        ? totalNotifications > 99
                          ? '99+'
                          : totalNotifications
                        : null
                    }
                    severity={'danger'}
                  ></Badge>
                )}
              </i>
            </button>
          </Link>
          <button
            type="button"
            className={`${styles.menuButton} p-link layout-topbar-button`}
            onClick={onConfigButtonClick}
            aria-label="Seetings"
          >
            <i className="pi pi-cog text-2xl" />
          </button>
          <button
            type="button"
            className={`${styles.menuButton} p-link layout-topbar-button`}
            onClick={logout}
            aria-label="Logout"
          >
            <i className="pi pi-sign-out text-2xl" />
          </button>
        </div>
      </div>
    </header>
  )
})
