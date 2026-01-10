import { AppMenuItem } from '@/types'

export const getMenus = (isAdmin: boolean): AppMenuItem[] => {
  const adminMenus = isAdmin
    ? [
        {
          label: 'Users',
          items: [{ label: 'User List', icon: 'pi pi-fw pi-users', to: '/users' }],
        },
      ]
    : []

  return [
    {
      label: 'Home',
      items: [{ label: 'Dashboard', icon: 'pi pi-fw pi-home', to: '/' }],
    },
    ...adminMenus,
    {
      label: 'Customers',
      items: [
        { label: 'Customer List', icon: 'pi pi-fw pi-users', to: '/customers', badge: 'NEW' },
      ],
    },
    {
      label: 'Visits',
      items: [
        {
          label: 'Visit Rules',
          icon: 'pi pi-fw pi-sitemap',
          to: '/visit-rules',
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
  ]
}
