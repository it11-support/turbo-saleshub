import { MenuSection } from '@saleshub-tsm/types'

// menuConfig.ts
export const menuConfig: MenuSection[] = [
  {
    label: 'Home',
    items: [
      {
        label: 'Dashboard',
        icon: 'pi pi-fw pi-home',
        to: '/',
      },
    ],
  },

  // 🔥 admin ONLY
  {
    label: 'Users',
    roles: ['admin'],
    items: [
      {
        label: 'User List',
        icon: 'pi pi-fw pi-users',
        to: '/users',
      },
    ],
  },
  {
    label: 'Products',
    roles: ['admin'],
    items: [
      {
        label: 'Product List',
        icon: 'pi pi-fw pi-tags',
        to: '/products',
      },
      {
        label: 'Bulk Upload',
        icon: 'pi pi-fw pi-upload',
        to: '/products/bulk-upload',
      },
    ],
  },

  // 🔥 ALL (atau specific)
  {
    label: 'Customers',
    items: [
      {
        label: 'Customer List',
        icon: 'pi pi-fw pi-users',
        to: '/customers',
        badge: 'NEW',
      },
      {
        label: 'New Customer',
        icon: 'pi pi-fw pi-user-plus',
        to: '/customers/new',
        badge: 'NEW',
      },
    ],
  },

  {
    label: 'Visits',
    roles: ['admin', 'sales'],
    items: [
      {
        label: 'Add Schedule',
        icon: 'pi pi-fw pi-calendar-plus',
        type: 'action', // 🔥 penting
        commandKey: 'addSchedule',
      },
      {
        label: 'Visit Rules',
        icon: 'pi pi-fw pi-sitemap',
        to: '/visit-rules',
        roles: ['admin'],
      },
      {
        label: 'Visit Schedules',
        icon: 'pi pi-fw pi-calendar',
        to: '/visit-schedules',
      },
      {
        label: 'Visits',
        icon: 'pi pi-fw pi-briefcase',
        to: '/visits',
      },
    ],
  },

  {
    label: 'Settings',
    roles: ['admin'],
    items: [
      {
        label: 'Settings',
        icon: 'pi pi-fw pi-cog',
        to: '/settings',
      },
    ],
  },
]
