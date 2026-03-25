'use client'

import React, { useContext, useMemo } from 'react'
import { useScheduleDialog } from '@/stores'
import AppMenuitem from './AppMenuitem'
import { useAuth } from './context/AuthContext'
import { MenuProvider } from './context/menucontext'
import { getMenus } from './menu'
import { LayoutState } from '@/types'
import { LayoutContext } from './context/layoutcontext'
import { Role } from '@saleshub-tsm/types'

const AppMenu = () => {
  const { logout, user, loading } = useAuth()
  const { setLayoutState } = useContext(LayoutContext)

  const isAdmin = user?.roles?.role === 'admin'

  const showAddScheduleDialog = () => {
    useScheduleDialog.getState().show()
  }

  const openSettings = () => {
    setLayoutState((prevState: LayoutState) => ({
      ...prevState,
      configSidebarVisible: true,
    }))
  }

  const commandMap: Record<string, () => void> = {
    addSchedule: showAddScheduleDialog,
    logout,
    openSettings,
  }

const baseMenus = useMemo(() => {
  const userRole = user?.roles?.role;
  if (!userRole) return [];
  return getMenus(userRole as Role);
}, [user?.roles?.role]);

  const attachCommands = (items: any[]): any[] => {
    return items.map((item) => {
      const newItem = { ...item }

      if (item.items) {
        newItem.items = attachCommands(item.items)
      }

      if (item.commandKey && commandMap[item.commandKey]) {
        newItem.command = commandMap[item.commandKey]
      }

      return newItem
    })
  }

  const menus = attachCommands(baseMenus)

  if (loading) {
    return null
  }

  return (
    <MenuProvider>
      <ul className="layout-menu">
        {menus.map((item, i) =>
          !item?.seperator ? (
            <AppMenuitem item={item} root index={i} key={item.label} />
          ) : (
            <li className="menu-separator" key={i}></li>
          )
        )}
      </ul>
    </MenuProvider>
  )
}

export default AppMenu
