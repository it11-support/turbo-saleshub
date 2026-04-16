export interface IConfig {
  key: string
  value: string | number | boolean | null
}

export interface ConfigState {
  userId: number | null
  configs: Record<string, IConfig['value']>
  loading: boolean
  error: string | null

  resolveThemePattern: (theme: string, colorScheme: string) => string
  fetchConfigs: () => Promise<void>
  updateConfig: (payload: Record<string, IConfig['value']>) => Promise<void>
  getConfig: (key: string, defaultValue?: any) => any
  clearConfigs: () => void
}
