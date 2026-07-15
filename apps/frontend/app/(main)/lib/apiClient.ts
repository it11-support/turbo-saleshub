import { $api } from '@/lib/api'

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
