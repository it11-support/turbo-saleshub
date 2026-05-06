'use client'

import { usePathname } from 'next/navigation'
import { useEventListener, useUnmountEffect } from 'primereact/hooks'
import { classNames } from 'primereact/utils'
import React, { useContext, useEffect, useRef } from 'react'

import AppConfig from './AppConfig'
import AppFooter from './AppFooter'
import AppSidebar from './AppSidebar'
import AppTopbar from './AppTopbar'
import { LayoutContext } from './context/layoutcontext'
import useIsMobile from './mobile/useIsMobile'

import { AppTopbarRef, ChildContainerProps, LayoutState } from '@/types'
import AddScheduleDialog from '@/app/(main)/components/add-schedule/dialog'
import NewCustomerDialog from '@/app/(main)/components/customer/new-customer'
import { ScrollTop } from 'primereact/scrolltop'
import { useSocket } from './context/SocketIoContext'
import { FollowUpUpdateData, IVisit } from '@saleshub-tsm/types'
import { useGlobalToast } from './context/ToastContext'
import { useRouter } from 'next/navigation'
import { Button } from 'primereact/button'
import { ToastMessage, ToastProps } from 'primereact/toast'
import { createUrl } from '@/lib/api'
import { useAuth } from './context/AuthContext'
import { mutate } from "swr"

interface CustomToastContentProps {
  message: ToastMessage
  onClose?: () => void
}

const Layout = ({ children }: ChildContainerProps) => {
  const router = useRouter()
  const socket = useSocket()
  const {user} = useAuth()
  const { showToast } = useGlobalToast()
  const { layoutConfig, layoutState, setLayoutState } = useContext(LayoutContext)
  const topbarRef = useRef<AppTopbarRef>(null)
  const sidebarRef = useRef<HTMLDivElement>(null)
  const [bindMenuOutsideClickListener, unbindMenuOutsideClickListener] = useEventListener({
    type: 'click',
    listener: (event) => {
      const isOutsideClicked = !(
        sidebarRef.current?.isSameNode(event.target as Node) ||
        sidebarRef.current?.contains(event.target as Node) ||
        topbarRef.current?.menubutton?.isSameNode(event.target as Node) ||
        topbarRef.current?.menubutton?.contains(event.target as Node)
      )

      if (isOutsideClicked) {
        hideMenu()
      }
    },
  })

  const pathname = usePathname()

  useEffect(() => {
    const currentSocket = socket

    if (currentSocket) {
      const handleUpdate = (data: FollowUpUpdateData<IVisit>) => {
        const info = data.info
        const apiNotifUrl = createUrl('notifications', {userId: Number(user?.id)})


        mutate(apiNotifUrl)
        showToast({
          severity: info.severity,

          sticky: true,
          content: (props: CustomToastContentProps) => (
            <div className="flex flex-column align-items-start" style={{ flex: '1' }}>
              {/* Judul Notifikasi */}
              <div className="flex align-items-center gap-2">
                <i
                  className={`pi ${
                    info.severity === 'error' ? 'pi-times-circle' : 'pi-info-circle'
                  } text-lg`}
                ></i>
                <span className="font-bold text-900">{info.title}</span>
              </div>

              {/* Isi Pesan */}
              <div style={{ whiteSpace: 'pre-line' }} className="font-medium text-sm my-3 text-700 line-height-3">{info.message}</div>

              {/* Tombol Aksi */}
              <div className="flex gap-2 w-full">
                <Button
                  type="button"
                  label="View Details"
                  className="p-button-sm p-button-outlined" // Menggunakan outlined
                  onClick={() => {
                    if (info.action_url) router.push(info.action_url)
                    props?.onClose?.()
                  }}
                />
              </div>
            </div>
          ),
        })
      }

      currentSocket.on('followUpUpdate', handleUpdate)

      return () => {
        currentSocket.off('followUpUpdate', handleUpdate)
      }
    }
  }, [socket, showToast])

  useEffect(() => {
    hideMenu()
    hideProfileMenu()
  }, [pathname])

  const [bindProfileMenuOutsideClickListener, unbindProfileMenuOutsideClickListener] =
    useEventListener({
      type: 'click',
      listener: (event) => {
        const isOutsideClicked = !(
          topbarRef.current?.topbarmenu?.isSameNode(event.target as Node) ||
          topbarRef.current?.topbarmenu?.contains(event.target as Node) ||
          topbarRef.current?.topbarmenubutton?.isSameNode(event.target as Node) ||
          topbarRef.current?.topbarmenubutton?.contains(event.target as Node)
        )

        if (isOutsideClicked) {
          hideProfileMenu()
        }
      },
    })

  const hideMenu = () => {
    setLayoutState((prevLayoutState: LayoutState) => ({
      ...prevLayoutState,
      overlayMenuActive: false,
      staticMenuMobileActive: false,
      menuHoverActive: false,
    }))
    unbindMenuOutsideClickListener()
    unblockBodyScroll()
  }

  const hideProfileMenu = () => {
    setLayoutState((prevLayoutState: LayoutState) => ({
      ...prevLayoutState,
      profileSidebarVisible: false,
    }))
    unbindProfileMenuOutsideClickListener()
  }

  const blockBodyScroll = (): void => {
    if (document.body.classList) {
      document.body.classList.add('blocked-scroll')
    } else {
      document.body.className += ' blocked-scroll'
    }
  }

  const unblockBodyScroll = (): void => {
    if (document.body.classList) {
      document.body.classList.remove('blocked-scroll')
    } else {
      document.body.className = document.body.className.replace(
        new RegExp('(^|\\b)' + 'blocked-scroll'.split(' ').join('|') + '(\\b|$)', 'gi'),
        ' '
      )
    }
  }

  useEffect(() => {
    if (layoutState.overlayMenuActive || layoutState.staticMenuMobileActive) {
      bindMenuOutsideClickListener()
    }

    layoutState.staticMenuMobileActive && blockBodyScroll()
  }, [layoutState.overlayMenuActive, layoutState.staticMenuMobileActive])

  useEffect(() => {
    if (layoutState.profileSidebarVisible) {
      bindProfileMenuOutsideClickListener()
    }
  }, [layoutState.profileSidebarVisible])

  useUnmountEffect(() => {
    unbindMenuOutsideClickListener()
    unbindProfileMenuOutsideClickListener()
  })

  const containerClass = classNames('layout-wrapper', {
    'layout-overlay': layoutConfig.menuMode === 'overlay',
    'layout-static': layoutConfig.menuMode === 'static',
    'layout-static-inactive':
      layoutState.staticMenuDesktopInactive && layoutConfig.menuMode === 'static',
    'layout-overlay-active': layoutState.overlayMenuActive,
    'layout-mobile-active': layoutState.staticMenuMobileActive,
    'p-input-filled': layoutConfig.inputStyle === 'filled',
    'p-ripple-disabled': !layoutConfig.ripple,
  })

  const isMobile = useIsMobile(768)

  return (
    <React.Fragment>
      <div className={containerClass}>
        {!isMobile && <AppTopbar ref={topbarRef} />}
        {!isMobile && (
          <div ref={sidebarRef} className="layout-sidebar">
            <AppSidebar />
          </div>
        )}
        <div className="layout-main-container">
          <div className="layout-main">{children}</div>
          {!isMobile && <AppFooter />}
        </div>
        <AppConfig />
        <div className="layout-mask"></div>
        <AddScheduleDialog />
        <NewCustomerDialog />
        <ScrollTop threshold={300} className="z-5" icon="pi pi-chevron-up" />
      </div>
    </React.Fragment>
  )
}

export default Layout
