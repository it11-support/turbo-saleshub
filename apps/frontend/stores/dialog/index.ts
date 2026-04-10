import { create } from 'zustand'

export type DialogType = 'schedule' | 'customer' | null

interface ScheduleDialogStore {
  activeDialog: DialogType
  show: (dialog: DialogType) => void
  hide: () => void
}

export const useScheduleDialog = create<ScheduleDialogStore>((set) => ({
  activeDialog: null,
  show: (dialog) => set({ activeDialog: dialog }),
  hide: () => set({ activeDialog: null }),
}))
