'use client'
import styles from './mobile.module.css'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import React from 'react'

type MenuItems = {
  href: string
  label: string
  icon: string
  action?: () => void
}[]
const MobileBottomNav = () => {
  const pathname = usePathname?.() || '/'

  const items: MenuItems = [
    { href: '/', label: 'Home', icon: 'pi pi-fw pi-home' },
    { href: '/visit-schedules', label: 'Schedules', icon: 'pi pi-fw pi-calendar' },
    { href: '/visits', label: 'Visit List', icon: 'pi pi-fw pi-list' },
  ]

  return (
    <nav className={styles.bottomNav} aria-label="Primary">
      {items.map((i) => {
        const active = pathname === i.href

        // Jika tidak punya action → render Link
        return (
          <Link
            key={i.href}
            href={i.href}
            className={`${styles.navItem} ${active ? styles.active : ''}`}
            onClick={(e) => {
              if (i.action) {
                e.preventDefault()
                e.stopPropagation()
                i.action()
              }
            }}
          >
            <i className={`${i.icon} ${active ? styles.active : ''} text-2xl`} />
            <span className={styles.label}>{i.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}

export default MobileBottomNav
