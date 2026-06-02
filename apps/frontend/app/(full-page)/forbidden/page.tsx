'use client'

import Image from 'next/image'
import Link from 'next/link'
import React from 'react'

const ForbiddenPage = () => {
  return (
    <div className="surface-ground flex align-items-center justify-content-center min-h-screen min-w-screen overflow-hidden">
      <div className="flex flex-column align-items-center justify-content-center">
        <Image
          src="/images/logo/logo.png"
          alt="logo"
          className="mb-5 w-6rem flex-shrink-0"
          loading="eager"
        />
        <div
          style={{
            borderRadius: '53px',
            maxWidth: '90vw',
            padding: '0.1rem',
            background: 'linear-gradient(180deg, var(--red-500) 10%, rgba(244, 67, 54, 0) 60%)',
          }}
        >
          <div
            className="w-full surface-card py-8 px-5 sm:px-8 flex flex-column align-items-center"
            style={{ borderRadius: '53px' }}
          >
            <span className="text-red-500 font-bold text-3xl">403</span>
            <h1 className="text-900 font-bold text-5xl mb-2">Access Denied</h1>
            <div className="text-600 mb-5">You do not have permission to access this page.</div>

            <Link
              href="/"
              className="w-full flex align-items-center mb-5 py-5 border-300 border-bottom-1"
            >
              <span
                className="flex justify-content-center align-items-center bg-red-400 border-round"
                style={{ height: '2rem', width: '2rem' }}
              >
                <i className="pi pi-lock text-50 text-xl"></i>
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

export default ForbiddenPage
