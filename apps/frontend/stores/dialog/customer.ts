import { create } from 'zustand'

interface CustomerDialogStore {
  open: boolean
  show: () => void
  hide: () => void
}

export const useCustomerDialog = create<CustomerDialogStore>((set) => ({
  open: false,
  show: () => set({ open: true }),
  hide: () => set({ open: false }),
}))
