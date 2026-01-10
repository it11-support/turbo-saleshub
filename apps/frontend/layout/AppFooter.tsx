/* eslint-disable @next/next/no-img-element */
'use client'

import React, { useContext } from 'react'

import { LayoutContext } from './context/layoutcontext'
import Image from 'next/image'

const AppFooter = () => {
  const { layoutConfig } = useContext(LayoutContext)

  return (
    <div className="layout-footer">
      <Image src={`/images/logo/logo.png`} width={30} height={30} alt={'Logo'} />
      <p className='ml-2 font-bold'>TSM SalesHub {new Date().getFullYear()}</p>
    </div>
  )
}

export default AppFooter
