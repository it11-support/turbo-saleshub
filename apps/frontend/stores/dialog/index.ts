import { create } from 'zustand'

interface ScheduleDialogStore {
  open: boolean
  show: () => void
  hide: () => void
}

export const useScheduleDialog = create<ScheduleDialogStore>((set) => ({
  open: false,
  show: () => set({ open: true }),
  hide: () => set({ open: false }),
}))
