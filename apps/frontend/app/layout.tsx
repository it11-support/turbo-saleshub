'use client'
import { LayoutProvider } from '../layout/context/layoutcontext'
import { NuqsAdapter } from 'nuqs/adapters/next/app'
import 'primeflex/primeflex.css'
import 'primeflex/themes/primeone-light.css'
import 'primeicons/primeicons.css'
import { PrimeReactProvider } from 'primereact/api'
import 'primereact/resources/primereact.css'
import { Suspense } from 'react'
import '../styles/demo/Demos.scss'
import '../styles/layout/layout.scss'
import { SWRConfig } from 'swr'

import AuthProvider from '@/layout/context/AuthContext'
import SocketIoProvider from '@/layout/context/SocketIoContext'
import { ToastProvider } from '@/layout/context/ToastContext'

interface RootLayoutProps {
  children: React.ReactNode
}

const RootLayout = ({ children }: RootLayoutProps) => {
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
                    <LayoutProvider>
                      <SWRConfig value={{ keepPreviousData: true, revalidateOnFocus: false }}>
                        {children}
                      </SWRConfig>
                    </LayoutProvider>
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

export default RootLayout
