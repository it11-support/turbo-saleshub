import Layout from '../../layout/layout'
import { Metadata, Viewport } from 'next'

interface AppLayoutProps {
  children: React.ReactNode
}

export const metadata: Metadata = {
  title: process.env.NEXT_PUBLIC_APP_NAME || 'SalesHub TSM',
  description:
    'SalesHub TSM is a comprehensive sales management tool designed to streamline your sales processes and enhance productivity. With a user-friendly interface, it provides real-time visibility into your sales data, allowing you to make informed decisions and drive success in your sales operations.',
  robots: { index: false, follow: false },
  openGraph: {
    type: 'website',
    title: process.env.NEXT_PUBLIC_APP_NAME || 'SalesHub TSM',
    url: 'https://saleshub.centralbali.com',
    description:
      'SalesHub TSM is a comprehensive sales management tool designed to streamline your sales processes and enhance productivity. With a user-friendly interface, it provides real-time visibility into your sales data, allowing you to make informed decisions and drive success in your sales operations.',
    images: ['https://saleshub.centralbali.com/images/logo/logo.png'],
    ttl: 604800,
  },
  icons: {
    icon: '/favicon.ico',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1.0,
}

export default function AppLayout({ children }: AppLayoutProps) {
  return <Layout>{children}</Layout>
}
