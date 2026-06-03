import { useAuth } from './context/AuthContext'
import { LayoutContext } from './context/layoutcontext'
import { useSocket } from './context/SocketIoContext'
import { INotification } from '@saleshub-tsm/types'
import Link from 'next/link'
import { Badge } from 'primereact/badge'
import { classNames } from 'primereact/utils'
import { forwardRef, useContext, useEffect, useImperativeHandle, useRef } from 'react'
import useSWR from 'swr'

import { fetcher } from '@/app/(main)/lib'
import Logo from '@/app/components/logo/Logo'
import { createUrl } from '@/lib/api'
import { AppTopbarRef, LayoutState } from '@/types'

const AppTopbar = forwardRef<AppTopbarRef>((props, ref) => {
  const { layoutState, setLayoutState } = useContext(LayoutContext)
  const menubuttonRef = useRef(null)
  const topbarmenuRef = useRef(null)
  const topbarmenubuttonRef = useRef(null)
  const auth = useAuth()
  const socket = useSocket()

  const { logout, user } = auth

  const apiNotifUrl = createUrl('notifications/unread', { userId: Number(user?.id) })
  const { data, mutate } = useSWR(() => (user?.id ? apiNotifUrl : null), fetcher, {
    revalidateOnFocus: false,
  })

  useEffect(() => {
    const currentSocket = socket

    if (currentSocket) {
      const handleUpdate = (newNotification: INotification) => {
        mutate((currentData: any) => {
          if (!currentData) return currentData

          return {
            ...currentData,
            data: [newNotification, ...(currentData.data || [])],
          }
        }, false)
      }

      currentSocket.on('followUpUpdate', handleUpdate)

      return () => {
        currentSocket.off('followUpUpdate', handleUpdate)
      }
    }
  }, [socket, mutate])

  const notifications = data?.data
  const totalNotifications = notifications?.length

  useImperativeHandle(ref, () => ({
    menubutton: menubuttonRef.current,
    topbarmenu: topbarmenuRef.current,
    topbarmenubutton: topbarmenubuttonRef.current,
  }))

  const openSettings = () => {
    setLayoutState((prevState: LayoutState) => ({ ...prevState, configSidebarVisible: true }))
  }
  const onProfileButtonClick = () => {
    setLayoutState((prev) => ({
      ...prev,
      profileSidebarVisible: !prev.profileSidebarVisible,
    }))
  }

  return (
    <div className="layout-topbar">
      <Logo width={35} height={35} className="flex-shrink-0" />

      <p className="mb-0 ml-2 text-xl font-bold">
        {process.env.NEXT_PUBLIC_APP_TITLE || 'TSM SalesHub'}
      </p>
      <button
        ref={topbarmenubuttonRef}
        type="button"
        className="p-link layout-topbar-menu-button layout-topbar-button"
        onClick={onProfileButtonClick}
      >
        <i className="pi pi-ellipsis-v" />
      </button>

      <div
        ref={topbarmenuRef}
        className={classNames('layout-topbar-menu', {
          'layout-topbar-menu-mobile-active': layoutState.profileSidebarVisible,
        })}
      >
        {auth.user?.name && (
          <div className="flex align-items-center justify-content-start">
            <Badge value={auth.user?.name} severity="info" />
          </div>
        )}
        <Link href={'/notifications'}>
          <button type="button" className="p-link layout-topbar-button">
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
            <span>Notifications</span>
          </button>
        </Link>
        <Link href={'/visit-schedules'}>
          <button type="button" className="p-link layout-topbar-button">
            <i className="pi pi-calendar"></i>
            <span>Calendar</span>
          </button>
        </Link>
        <button type="button" className="p-link layout-topbar-button" onClick={openSettings}>
          <i className="pi pi-cog"></i>
          <span>Settings</span>
        </button>
        <button type="button" className="p-link layout-topbar-button" onClick={logout}>
          <i className="pi pi-sign-out"></i>
          <span>Logout</span>
        </button>
      </div>
    </div>
  )
})

AppTopbar.displayName = 'AppTopbar'

export default AppTopbar
