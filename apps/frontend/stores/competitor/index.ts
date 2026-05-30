import {
  Competitor,
  CompetitorProduct,
  VisitCompetitor,
  VisitCompetitorState,
} from '@saleshub-tsm/types'
import { create } from 'zustand'

import { $api, createUrl } from '@/lib/api'

export const useCompetitorStore = create<VisitCompetitorState>((set, get) => ({
  masterCompetitors: [],
  currentVisitId: null,
  selectedCompetitors: [],

  fetchMasterCompetitors: async () => {},
  syncCompetitors: async (visitId: string | number) => {
    const { selectedCompetitors, resetForm } = get()
    if (selectedCompetitors.length === 0) return
    try {
      const payload = selectedCompetitors.map((c) => ({
        competitor_id: c.competitor_id,
        name: c.name,
        products: c.products.map((p) => ({
          product_name: p.product_name,
          brand: p.brand,
          price: p.price,
          monthly_usage: p.monthly_usage,
          unit: p.unit,
          is_promo: p.is_promo,
          notes: p.notes,
          stock_status: p.stock_status,
        })),
      }))

      const url = createUrl(`competitors/${visitId}/sync`)

      const res = await $api<any>(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (res.status === 200) {
        resetForm()
      }
    } catch (error) {
      console.error('Failed to sync competitors:', error)
    }
  },

  addCompetitorToVisit: (item: Competitor | string) => {
    const isNew = typeof item === 'string'
    const name = isNew ? item : item.name
    const { selectedCompetitors } = get()

    // Cegah duplikat berdasarkan nama
    if (selectedCompetitors.some((c) => c.name.toLowerCase() === name.toLowerCase())) return

    const newEntry: VisitCompetitor = {
      competitor_id: isNew ? undefined : item.id,
      name: name,
      products: [
        {
          product_name: '',
          brand: '',
          price: 0,
          monthly_usage: 0,
          unit: '',
          is_promo: false,
          notes: '',
          stock_status: 'AVAILABLE',
        },
      ],
    }

    set({ selectedCompetitors: [...selectedCompetitors, newEntry] })
  },

  removeCompetitorFromVisit: (index: number) => {
    set((state) => ({
      selectedCompetitors: state.selectedCompetitors.filter((_, i) => i !== index),
    }))
  },

  updateProduct: (compIndex: number, prodIndex: number, data: Partial<CompetitorProduct>) => {
    set((state) => {
      const updatedCompetitors = [...state.selectedCompetitors]

      const targetCompetitor = { ...updatedCompetitors[compIndex] }

      const updatedProducts = [...targetCompetitor.products]

      updatedProducts[prodIndex] = {
        ...updatedProducts[prodIndex],
        ...data,
      }

      targetCompetitor.products = updatedProducts

      updatedCompetitors[compIndex] = targetCompetitor

      return { selectedCompetitors: updatedCompetitors }
    })
  },

  addProductToCompetitor: (compIndex: number) => {
    set((state) => {
      const updatedCompetitors = [...state.selectedCompetitors]
      const targetCompetitor = { ...updatedCompetitors[compIndex] }

      const updatedProducts: CompetitorProduct[] = [
        ...targetCompetitor.products,
        {
          product_name: '',
          brand: '',
          price: 0,
          monthly_usage: 0,
          unit: '',
          is_promo: false,
          notes: '',
          stock_status: 'AVAILABLE',
        },
      ]

      targetCompetitor.products = updatedProducts

      updatedCompetitors[compIndex] = targetCompetitor

      return { selectedCompetitors: updatedCompetitors }
    })
  },

  setSelectedCompetitor: (competitor: VisitCompetitor) =>
    set((state) => ({ selectedCompetitors: [...state.selectedCompetitors, competitor] })),
  setCompetitors: (competitors: VisitCompetitor[]) => set({ selectedCompetitors: competitors }),

  resetForm: () => set({ selectedCompetitors: [], currentVisitId: null }),
  removeProductFromCompetitor: (compIndex: number, prodIndex: number) => {
    set((state) => {
      const updatedCompetitors = [...state.selectedCompetitors]

      const targetCompetitor = { ...updatedCompetitors[compIndex] }

      const updatedProducts = targetCompetitor.products.filter((_, i) => i !== prodIndex)

      targetCompetitor.products = updatedProducts

      updatedCompetitors[compIndex] = targetCompetitor

      return { selectedCompetitors: updatedCompetitors }
    })
  },
}))
