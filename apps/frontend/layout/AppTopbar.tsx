import Link from 'next/link'
import { classNames } from 'primereact/utils'
import { forwardRef, useContext, useImperativeHandle, useRef } from 'react'

import { useAuth } from './context/AuthContext'
import { LayoutContext } from './context/layoutcontext'

import { AppTopbarRef, LayoutState } from '@/types'
import Image from 'next/image'

const AppTopbar = forwardRef<AppTopbarRef>((props, ref) => {
  const { layoutConfig, layoutState, onMenuToggle, showProfileSidebar, setLayoutState } =
    useContext(LayoutContext)
  const menubuttonRef = useRef(null)
  const topbarmenuRef = useRef(null)
  const topbarmenubuttonRef = useRef(null)
  const auth = useAuth()

  const { logout } = auth
  useImperativeHandle(ref, () => ({
    menubutton: menubuttonRef.current,
    topbarmenu: topbarmenuRef.current,
    topbarmenubutton: topbarmenubuttonRef.current,
  }))

  const openSettings = () => {
    setLayoutState((prevState: LayoutState) => ({ ...prevState, configSidebarVisible: true }))
  }

  return (
    <div className="layout-topbar">
      <Image src={`/images/logo/logo.png`} width={35} height={35} alt={'Logo'} />

      <p className='mb-0 ml-2 text-xl font-bold'>{process.env.NEXT_PUBLIC_APP_TITLE || 'TSM SalesHub'}</p>
      <button
        ref={topbarmenubuttonRef}
        type="button"
        className="p-link layout-topbar-menu-button layout-topbar-button"
        onClick={showProfileSidebar}
      >
        <i className="pi pi-ellipsis-v" />
      </button>


      <div
        ref={topbarmenuRef}
        className={classNames('layout-topbar-menu', {
          'layout-topbar-menu-mobile-active': layoutState.profileSidebarVisible,
        })}
      >
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
