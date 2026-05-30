import { IInquiry, IProductInquiryState } from '@saleshub-tsm/types'
import { create } from 'zustand'

import { $api, createUrl } from '@/lib/api'

export const useInquiryStore = create<IProductInquiryState>()((set, get) => ({
  loading: false,
  inquiries: [],
  setInquiries(inquiries) {
    set({ inquiries })
  },
  setLoading(loading) {
    set({ loading: loading })
  },
  addInquiry: () =>
    set((state) => ({
      inquiries: [...state.inquiries, { product_id: null, product_name: '', notes: '' }],
    })),
  removeInquiry: (index) =>
    set((state) => ({
      inquiries: state.inquiries.filter((_, i) => i !== index),
    })),
  updateInquiry: (index: number, field: keyof IInquiry, value: any) =>
    set((state) => {
      const updated = [...state.inquiries]

      const current = updated[index]

      if (!current) return state

      updated[index] = {
        ...current,
        [field]: value,
      }

      // jika user set product_id (dari select) → biarkan name tetap (tidak di-reset)
      if (field === 'product_id') {
        // optional: pastikan konsisten
        updated[index].product_id = value
      }

      return { inquiries: updated }
    }),
  fetchInquiries: async (id) => {
    const { setInquiries } = get()
    try {
      set({ loading: true })
      const url = createUrl(`inquiry/${id}`) // id => visit_id
      const res = await $api<any>(url)
      const { data } = res
      setInquiries(data.inquiries)
    } catch (error) {
      console.error(error)
      set({ loading: false })
      throw error
    } finally {
      set({ loading: false })
    }
  },
  syncInquiries: async (id) => {
    try {
      const { inquiries, setInquiries } = get()
      set({ loading: true })
      const filteredInquiries = inquiries.filter((item) => {
        return item.product_id || item.product_name?.trim() || item.notes?.trim()
      })

      const payload = {
        visit_id: id,
        inquiries: filteredInquiries,
      }

      const url = createUrl(`inquiry`)
      const res = await $api<any>(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payload }),
      })

      const { data } = res
      setInquiries(data.inquiries)
    } catch (error) {
      console.error(error)
      set({ loading: false })
      throw error
    } finally {
      set({ loading: false })
    }
  },
}))
