
const path = require('node:path')

/** @type {import('next').NextConfig} */

const nextConfig = {
  devIndicators: false,
  transpilePackages: ['@saleshub-tsm/types'],
  turbopack: {
    root: path.resolve(__dirname, '../..'),
  },
  images: {
    remotePatterns: [
      {
        protocol: process.env.NEXT_REMOTE_PROTOCOL,
        hostname: process.env.NEXT_REMOTE_HOSTNAME,
        port: process.env.NEXT_REMOTE_PORT || undefined,
        pathname: process.env.NEXT_REMOTE_PATH,
      },
    ],
  },
}

module.exports = nextConfig
