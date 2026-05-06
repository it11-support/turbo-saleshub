'use client'
import { LayoutProvider } from '../layout/context/layoutcontext'
import { NuqsAdapter } from 'nuqs/adapters/next/app'
import { PrimeReactProvider } from 'primereact/api'
import { Suspense } from 'react'

import AuthProvider from '@/layout/context/AuthContext'

import 'primeflex/primeflex.css'
import 'primeicons/primeicons.css'
import 'primereact/resources/primereact.css'

import '../styles/demo/Demos.scss'
import '../styles/layout/layout.scss'
import SocketIoProvider from '@/layout/context/SocketIoContext'
import { ToastProvider } from '@/layout/context/ToastContext'

interface RootLayoutProps {
  children: React.ReactNode
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link id="theme-css" href={`/themes/viva-light/theme.css`} rel="stylesheet"></link>
        <meta charSet="utf-8" />
      </head>
      <body>
        <PrimeReactProvider>
          <ToastProvider>
            <AuthProvider>
              <SocketIoProvider>
                <NuqsAdapter>
                  <Suspense fallback={null}>
                    <LayoutProvider>{children}</LayoutProvider>
                  </Suspense>
                </NuqsAdapter>
              </SocketIoProvider>
            </AuthProvider>
          </ToastProvider>
        </PrimeReactProvider>
      </body>
    </html>
  )
}
