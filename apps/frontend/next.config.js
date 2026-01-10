/** @type {import('next').NextConfig} */
const rootPath = process.cwd()
const path = require('path')

const nextConfig = {
  transpilePackages: ['@saleshub-tsm/types'],
  turbopack: {
    root: '../..',
  },
  images: {
    remotePatterns: [
      {
        protocol: process.env.NEXT_REMOTE_PROTOCOL,
        hostname: process.env.NEXT_REMOTE_HOSTNAME,
        port: process.env.NEXT_REMOTE_PORT,
        pathname: process.env.NEXT_REMOTE_PATH,
      },
    ],
  },
}

module.exports = nextConfig
