'use client'

import Image from 'next/image'
import React from 'react'

const AppFooter = () => {
  return (
    <div className="layout-footer">
      <Image src={`/images/logo/logo.png`} width={30} height={30} alt={'Logo'} />
      <p className="ml-2 font-bold">TSM SalesHub {new Date().getFullYear()}</p>
    </div>
  )
}

export default AppFooter
