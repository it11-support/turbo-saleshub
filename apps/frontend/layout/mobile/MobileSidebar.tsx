'use client'

import AppMenuitem from '../AppMenuitem'
import { useAuth } from '../context/AuthContext'
import { MenuProvider } from '../context/menucontext'
import { getMenus } from '../menu'
import { Role } from '@saleshub-tsm/types'
import Image from 'next/image'
import Link from 'next/link'
import { Badge } from 'primereact/badge'
import { Sidebar } from 'primereact/sidebar'
import React, { useMemo } from 'react'

import { DialogType, useScheduleDialog } from '@/stores'

type Props = {
  visible: boolean
  onHide: () => void
}

const MobileSidebar = (props: Props) => {
  const { logout } = useAuth()
  const { visible, onHide } = props
  const auth = useAuth()
  const { show } = useScheduleDialog()

  const _showAddScheduleDialog = () => {
    show('schedule')
  }

  const _showNewCustomerDialog = () => {
    show('customer')
  }

  const showDialog = (key: DialogType) => {
    show(key)
  }

  const commandMap: Record<string, () => void> = {
    addSchedule: showDialog.bind(null, 'schedule'),
    logout: logout,
    newCustomer: showDialog.bind(null, 'customer'),
  }

  const baseMenus = useMemo(() => {
    const userRole = auth.user?.roles?.role
    if (!userRole) return []
    return getMenus(userRole as Role)
  }, [auth.user])

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
              <span className="font-semibold text-lg text-gray-500">
                {process.env.NEXT_PUBLIC_APP_TITLE}
              </span>
            </Link>
          </div>
          <div className="flex item-center justify-center px-4 ">
            <Badge value={auth.user?.name} severity="info" />
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
