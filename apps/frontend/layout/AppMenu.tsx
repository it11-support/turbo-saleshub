/* eslint-disable @next/next/no-img-element */
''
import { getCookie } from 'cookies-next'
import React, { useContext, useEffect, useMemo, useState } from 'react'

import AppMenuitem from './AppMenuitem'
import { useAuth } from './context/AuthContext'
import { MenuProvider } from './context/menucontext'
import { getMenus } from './menu'
import { LayoutState } from '@/types'
import { LayoutContext } from './context/layoutcontext'

const AppMenu = () => {
  const { logout } = useAuth()
  const [isAdmin, setIsAdmin] = useState(false)
  const { layoutConfig, setLayoutConfig, layoutState, setLayoutState } = useContext(LayoutContext)

  useEffect(() => {
    const admin = getCookie('isAdmin') === 'true'

    setIsAdmin(admin)
  }, [])

   const openSettings = () => {
      setLayoutState((prevState: LayoutState) => ({ ...prevState, configSidebarVisible: true }))
    }
  const commandMap: Record<string, () => void> = {
    logout: logout,
    openSettings: openSettings
  }

  const baseMenus = useMemo(() => getMenus(isAdmin), [isAdmin])

  const attachCommands = (items: any[]): any[] => {
    return items.map((item) => {
      const newItem = { ...item }

      if (item.items) {
        newItem.items = attachCommands(item.items)
      }

      if (item.commandKey && commandMap[item.commandKey]) {
        newItem.command = () => {
          commandMap[item.commandKey]()
        }
      }

      return newItem
    })
  }

  const menus = attachCommands(baseMenus)

  return (
    <MenuProvider>
      <ul className="layout-menu">
        {menus.map((item, i) => {
          return !item?.seperator ? (
            <AppMenuitem item={item} root={true} index={i} key={item.label} />
          ) : (
            <li className="menu-separator"></li>
          )
        })}
      </ul>
    </MenuProvider>
  )
}

export default AppMenu
