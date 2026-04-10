import { menuConfig } from '@/lib/menuConfig'
import { Role } from '@saleshub-tsm/types'


export const getMenus = (role: Role) => {
  return menuConfig
    .filter((section) => {
      if (section.roles && !section.roles.includes(role)) return false;
      return true;
    })
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => {
        if (item.roles) {
          return item.roles.includes(role);
        }
        return true;
      }),
    }))
    .filter((section) => section.items.length > 0);
};
