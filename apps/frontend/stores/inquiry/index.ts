import { IInquiry, IProductInquiryState } from '@saleshub-tsm/types'
import { create } from 'zustand'

import { $api, createUrl } from '@/lib/api'
import { addItemToArray, jsonBody, withLoading } from '@/lib/storeHelper'

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
      inquiries: addItemToArray(state.inquiries, { product_id: null, product_name: '', notes: '' }),
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

      if (field === 'product_id') {
        updated[index].product_id = value
      }

      return { inquiries: updated }
    }),
  fetchInquiries: async (id) => {
    const { setInquiries } = get()
    await withLoading(
      set,
      async () => {
        const url = createUrl(`inquiry/${id}`) // id => visit_id
        const res = await $api<any>(url)
        const { data } = res
        setInquiries(data.inquiries)
      },
      console.error
    )
  },
  syncInquiries: async (id) => {
    await withLoading(
      set,
      async () => {
        const { inquiries, setInquiries } = get()
        const filteredInquiries = inquiries.filter((item) => {
          return item.product_id || item.product_name?.trim() || item.notes?.trim()
        })

        const payload = {
          visit_id: id,
          inquiries: filteredInquiries,
        }

        const url = createUrl(`inquiry`)
        const res = await $api<any>(url, jsonBody(payload))

        const { data } = res
        setInquiries(data.inquiries)
      },
      console.error
    )
  },
}))
