'use client'

import { createContext, useContext, useEffect, useState } from 'react'

import { useConfigStore } from '@/stores'
import { ChildContainerProps, LayoutConfig, LayoutContextProps, LayoutState } from '@/types'

export const LayoutContext = createContext({} as LayoutContextProps)

export const LayoutProvider = ({ children }: ChildContainerProps) => {
  const { fetchConfigs, configs } = useConfigStore()

  const [layoutConfig, setLayoutConfig] = useState<LayoutConfig>({
    ripple: false,
    inputStyle: 'outlined',
    menuMode: 'static',
    colorScheme: 'light',
    theme: 'viva-light',
    scale: 14,
  })

  const [layoutState, setLayoutState] = useState<LayoutState>({
    staticMenuDesktopInactive: false,
    overlayMenuActive: false,
    profileSidebarVisible: false,
    configSidebarVisible: false,
    staticMenuMobileActive: false,
    menuHoverActive: false,
  })

  useEffect(() => {
    fetchConfigs()
  }, [])

  useEffect(() => {
    if (!configs.theme || !configs.colorScheme) return

    const theme = `${configs.theme}`
    const link = document.getElementById('theme-css') as HTMLLinkElement | null
    if (!link) return

    const href = `/themes/${theme}/theme.css`

    // already applied
    if (link.href.includes(href)) return

    link.href = href

    setLayoutConfig((prev) => ({
      ...prev,
      theme,
      ripple: configs.ripple === 'true',
      colorScheme: configs.colorScheme as string,
    }))
  }, [configs.theme, configs.colorScheme, configs.ripple])

  const value: LayoutContextProps = {
    layoutConfig,
    setLayoutConfig,
    layoutState,
    setLayoutState,
    onMenuToggle: () => {},
    showProfileSidebar: () => {},
  }

  return <LayoutContext.Provider value={value}>{children}</LayoutContext.Provider>
}

export const useLayout = () => useContext(LayoutContext)
