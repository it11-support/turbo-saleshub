'use client'
import { Toast, ToastMessage } from 'primereact/toast'
import React, { createContext, useCallback, useContext, useRef } from 'react'

const ToastContext = createContext<any>(null)

export const ToastProvider = ({ children }: { children: React.ReactNode }) => {
  const toastRef = useRef<Toast>(null)

  const showToast = useCallback((options: ToastMessage) => {
    toastRef.current?.show(options)
  }, [])

  return (
    <ToastContext.Provider value={{ showToast }}>
      <Toast ref={toastRef} position="top-right" baseZIndex={9999} />
      {children}
    </ToastContext.Provider>
  )
}

export const useGlobalToast = () => useContext(ToastContext)
