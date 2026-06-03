'use client'

import Logo from '@/app/components/logo/Logo'
const AppFooter = () => {
  return (
    <div className="layout-footer">
      <Logo width={30} height={30} className="flex-shrink-0" />
      <p className="ml-2 font-bold">TSM SalesHub {new Date().getFullYear()}</p>
    </div>
  )
}

export default AppFooter
