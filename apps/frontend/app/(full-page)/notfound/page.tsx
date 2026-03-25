'use client'

import Link from 'next/link'
import { PrimeReactContext } from 'primereact/api'
import React, { useContext, useEffect } from 'react'

import { LayoutContext } from '@/layout/context/layoutcontext'
import { LayoutConfig } from '@/types'

const NotFoundPage = () => {
  const { layoutConfig, setLayoutConfig } = useContext(LayoutContext)
  const { changeTheme } = useContext(PrimeReactContext)

  const _changeTheme = (theme: string, colorScheme: string) => {
    changeTheme?.(layoutConfig.theme, theme, 'theme-css', () => {
      setLayoutConfig((prevState: LayoutConfig) => ({ ...prevState, theme, colorScheme }))
    })
  }

  useEffect(() => {
    _changeTheme('soho-dark', 'dark')
  }, [])

  return (
    <div className="surface-ground flex align-items-center justify-content-center min-h-screen min-w-screen overflow-hidden">
      <div className="flex flex-column align-items-center justify-content-center">
        <img src="/images/logo/logo.png" alt="logo" className="mb-5 w-6rem flex-shrink-0" />
        <div
          style={{
            borderRadius: '53px',
            padding: '0.1rem',
            background:
              'linear-gradient(180deg, var(--primary-color) 10%, rgba(33, 150, 243, 0) 60%)',
          }}
        >
          <div
            className="w-full surface-card py-8 px-5 sm:px-8 flex flex-column align-items-center"
            style={{ borderRadius: '53px' }}
          >
            <span className="text-blue-500 font-bold text-3xl">404</span>
            <h1 className="text-900 font-bold text-5xl mb-2">Not Found</h1>
            <div className="text-600 mb-5">The page you are looking for is not found.</div>

            <Link
              href="/"
              className="w-full flex align-items-center mb-5 py-5 border-300 border-bottom-1"
            >
              <span
                className="flex justify-content-center align-items-center bg-indigo-400 border-round"
                style={{ height: '2rem', width: '2rem' }}
              >
                <i className="pi pi-fw pi-home text-50 text-xl"></i>
              </span>
              <span className="ml-2 flex flex-column">
                <span className="text-900 lg:text-xl font-medium mb-1">Back to Home</span>
              </span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default NotFoundPage
