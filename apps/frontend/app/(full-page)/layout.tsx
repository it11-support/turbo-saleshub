import { Metadata } from 'next'
import React from 'react'

import AppConfig from '@/layout/AppConfig'

export const metadata: Metadata = {
  title: `${process.env.NEXT_PUBLIC_APP_NAME || 'SalesHub TSM'} - Login`,
  description:
    'SalesHub TSM is a comprehensive sales management tool designed to streamline your sales processes and enhance productivity. With a user-friendly interface, it provides real-time visibility into your sales data, allowing you to make informed decisions and drive success in your sales operations.',
}

const SimpleLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <React.Fragment>
      {children}
      <AppConfig />
    </React.Fragment>
  )
}

export default SimpleLayout
