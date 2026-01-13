'use client'
import { LayoutProvider } from '../layout/context/layoutcontext'
import { PrimeReactProvider } from 'primereact/api'

import AuthProvider from '@/layout/context/AuthContext'
import ViewportLayoutSwitcher from '@/layout/mobile/ViewportLayoutSwitcher'

import 'primeflex/primeflex.css'
import 'primeicons/primeicons.css'

import 'primereact/resources/primereact.css'

import '../styles/demo/Demos.scss'
import '../styles/layout/layout.scss'

interface RootLayoutProps {
  children: React.ReactNode
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link id="theme-css" href={`/themes/lara-light-teal/theme.css`} rel="stylesheet"></link>
        <meta charSet="utf-8" />
      </head>
      <body>
        <PrimeReactProvider>
          <AuthProvider>
            <LayoutProvider>
              <ViewportLayoutSwitcher>{children}</ViewportLayoutSwitcher>
            </LayoutProvider>
          </AuthProvider>
        </PrimeReactProvider>
      </body>
    </html>
  )
}
