import { getCookie, setCookie } from 'cookies-next'
import { create } from 'zustand'

import { $api, createUrl } from '@/lib/api'
import { ConfigState } from '@saleshub-tsm/types'

export const useConfigStore = create<ConfigState>((set, get) => ({
  userId: null,
  configs: {
    theme: 'viva-light',
    colorScheme: 'light',
    ripple: 'false',
    scale: 14,
  },
  loading: false,
  error: null,
  resolveThemePattern: (theme: string, colorScheme: string) => {
    return `${theme}-${colorScheme}`
  },
  fetchConfigs: async () => {
    const isLoginPage = typeof window !== 'undefined' && window.location.pathname === '/login'
    if (isLoginPage) return

    const userCookie = getCookie('userData')
    const userData = userCookie ? JSON.parse(String(userCookie)) : null
    if (!userData?.id) return

    set({ userId: userData.id, loading: true, error: null })

    // fallback ke API
    try {
      const url = createUrl('config', { userId: userData.id })
      const res = await $api<any>(url)

      const list = res.data?.configs || []
      const configsObj = list.reduce((acc: any, cur: any) => {
        acc[cur.key] = cur.value
        return acc
      }, {})

      set({ configs: configsObj, loading: false })
    } catch (err: any) {
      set({ error: err.message || 'Failed to load configs', loading: false })
    }
  },

  updateConfig: async (payload) => {
    const { userId } = get()
    if (!userId) return

    try {
      const url = createUrl('config')

      const res = await $api<any>(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          configs: payload, // 🔥 kirim object
        }),
      })

      // response: { data: { configs: { key1: val1, key2: val2 } } }

      set((state) => ({
        configs: {
          ...state.configs,
          ...res.data.configs, // 🔥 merge semua sekaligus
        },
      }))
    } catch (err: any) {
      set({ error: err.message || 'Failed to update config' })
    }
  },
  getConfig: (key, defaultValue = null) => {
    return get().configs[key] ?? defaultValue
  },

  clearConfigs: () => {
    set({ configs: {}, error: null, userId: null })
  },
}))

useConfigStore.subscribe((state, prevState) => {
  if (state.configs === prevState?.configs) return

  const userId = state.userId
  if (!userId) return

  setCookie(`user_configs_${userId}`, JSON.stringify(state.configs))
})
