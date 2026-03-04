import { $api, createUrl } from "@/lib/api";
import { IConcernState } from "@saleshub-tsm/types";
import { create } from "zustand";

export const useConcernStore = create<IConcernState>()((set, get) => ({
  concernCategory: null,
  loading: false,
  concernCategories: [],
  fetchConcernCategories: async () => {
    try {
      set({ loading: true })
      const url = createUrl('concern-categories')
      const res = await $api<any>(url)
      set({ loading: false })
      set({ concernCategories: res.data.concernCategories })
      return res.data
    } catch (error) {
      console.error(error)
      set({ loading: false })
      return null
    }
  },
}))
