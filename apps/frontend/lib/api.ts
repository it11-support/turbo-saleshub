import { deleteCookie, getCookie } from 'cookies-next'
import { ofetch } from 'ofetch'

export type QueryValue =
  string | number | boolean | (string | number | boolean)[] | null | undefined
export type QueryParams = Record<string, QueryValue>

const baseURL = process.env.NEXT_PUBLIC_API_BASE_URL

const isClient = typeof window !== 'undefined'

const getAccessToken = () => getCookie('accessToken')

export const $api = ofetch.create({
  baseURL,
  redirect: 'manual',

  async onRequest({ options, request }) {
    const token = getAccessToken()

    if (token) {
      options.headers = new Headers(options.headers || {})
      options.headers.set('Authorization', `Bearer ${token}`)
    } else {
      console.warn('⚠️ No token found for request:', request)
    }
  },

  async onResponse({ request, response }) {
    if (response?.status >= 200 && response?.status < 300) {
      console.log(`✅ [${response.status}] ${request}`)
    }
  },

  async onResponseError({ request: _request, response, error }) {
    if (response?.status === 401 || response?.status === 302) {
      if (isClient) {
        if (!window.location.pathname.includes('/auth/login')) {
          deleteCookie('accessToken')
          deleteCookie('userData')

          setTimeout(() => {
            window.location.href = '/auth/login'
          }, 100)
        }
      } else {
        throw new Error('Unauthorized - invalid or missing token')
      }
    } else if (response?.status === 403) {
      if (isClient) {
        if (!window.location.pathname.includes('/forbidden')) {
          setTimeout(() => {
            window.location.href = '/forbidden'
          }, 100)
        }
      } else {
        throw new Error('Forbidden - access denied')
      }
    } else {
      throw error
    }
  },
})

export const createUrl = (path: string, query?: QueryParams) => {
  const url = new URL(path, baseURL)

  if (!query) return url.toString()

  Object.entries(query).forEach(([key, value]) => {
    if (value === undefined || value === null) return

    if (Array.isArray(value)) {
      value
        .filter((v): v is string | number | boolean => v !== null && v !== undefined && v !== '')
        .forEach((v) => url.searchParams.append(key, String(v)))
      return
    }

    if (value === '') return

    url.searchParams.append(key, String(value))
  })

  return url.toString()
}

export const fetcher = (url: string) => $api(url)

type ApiResponse<T> = {
  data?: T
  message?: string
  error?: string
}

export const apiClient = {
  get: async <T>(url: string): Promise<ApiResponse<T>> => {
    try {
      const data = await $api(url)
      return { data }
    } catch (error: any) {
      return {
        error: error?.message || 'An error occurred',
      }
    }
  },

  post: async <T>(url: string, body: any): Promise<ApiResponse<T>> => {
    try {
      const data = await $api(url, {
        method: 'POST',
        body: JSON.stringify(body),
        headers: {
          'Content-Type': 'application/json',
        },
      })
      return { data }
    } catch (error: any) {
      return {
        error: error?.message || 'An error occurred',
      }
    }
  },

  put: async <T>(url: string, body: any): Promise<ApiResponse<T>> => {
    try {
      const data = await $api(url, {
        method: 'PUT',
        body: JSON.stringify(body),
        headers: {
          'Content-Type': 'application/json',
        },
      })
      return { data }
    } catch (error: any) {
      return {
        error: error?.message || 'An error occurred',
      }
    }
  },

  delete: async <T>(url: string): Promise<ApiResponse<T>> => {
    try {
      const data = await $api(url, {
        method: 'DELETE',
      })
      return { data }
    } catch (error: any) {
      return {
        error: error?.message || 'An error occurred',
      }
    }
  },
}

export type { ApiResponse }
