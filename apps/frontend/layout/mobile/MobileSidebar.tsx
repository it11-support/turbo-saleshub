'use client'

import { getCookie } from 'cookies-next'
import Link from 'next/link'
import { Sidebar } from 'primereact/sidebar'
import React, { useEffect, useState } from 'react'

import AppMenuitem from '../AppMenuitem'
import { useAuth } from '../context/AuthContext'
import { MenuProvider } from '../context/menucontext'
import { getMenus } from '../menu'

import { useLayout } from '@/layout/context/layoutcontext'
import Image from 'next/image'

type Props = {
  visible: boolean
  onHide: () => void
}

const MobileSidebar = (props: Props) => {
  const { logout } = useAuth()
  const { visible, onHide } = props
  const [isAdmin, setIsAdmin] = useState(false)
  const { layoutConfig } = useLayout()

  useEffect(() => {
    const admin = getCookie('isAdmin') === 'true'
    setIsAdmin(admin)
  }, [])

  const commandMap: Record<string, () => void> = {
    logout: logout,
  }

  const baseMenus = getMenus(isAdmin)

  const attachCommands = (items: any[]): any[] => {
    return items.map((item) => {
      const newItem = { ...item }

      if (item.items) {
        newItem.items = attachCommands(item.items)
      }

      if (item.commandKey && commandMap[item.commandKey]) {
        newItem.command = () => {
          commandMap[item.commandKey]()
          onHide?.()
        }
      } else if (item.to) {
        newItem.command = () => onHide?.()
      }

      return newItem
    })
  }

  const menus = attachCommands(baseMenus)

  return (
    <>
      <MenuProvider>
        <Sidebar
          visible={visible}
          onHide={onHide}
          position="left"
          className="layout-config-sidebar w-20rem"
          modal
          dismissable
        >
          <div className="flex items-center justify-center p-4 border-b border-gray-200">
            <Link href="/" onClick={onHide} className="flex items-center gap-2">
              <Image src={`/images/logo/logo.png`} width={35} height={35} alt={'Logo'} />
              <span className="font-semibold text-lg text-gray-800">SalesHub</span>
            </Link>
          </div>

          <div className="layout-menu-container overflow-y-auto">
            <ul className="layout-menu list-none p-3 m-0">
              {menus.map((item, i) =>
                !item?.seperator ? (
                  <AppMenuitem item={item} root={true} index={i} key={item.label} />
                ) : (
                  <li key={`sep-${i}`} className="menu-separator"></li>
                )
              )}
            </ul>
          </div>
        </Sidebar>
      </MenuProvider>
    </>
  )
}

export default MobileSidebar
