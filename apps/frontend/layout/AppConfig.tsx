'use client'

import { LayoutContext } from './context/layoutcontext'
import { PrimeReactContext } from 'primereact/api'
import { InputSwitch, InputSwitchChangeEvent } from 'primereact/inputswitch'
import { RadioButtonChangeEvent } from 'primereact/radiobutton'
import { Sidebar } from 'primereact/sidebar'
import { useContext, useEffect } from 'react'

import { useConfigStore } from '@/stores'
import { AppConfigProps, LayoutConfig, LayoutState } from '@/types'

const AppConfig = (props: AppConfigProps) => {
  const configStore = useConfigStore()
  const { layoutConfig, setLayoutConfig, layoutState, setLayoutState } = useContext(LayoutContext)
  const { setRipple, changeTheme } = useContext(PrimeReactContext)

  const _onConfigButtonClick = () => {
    setLayoutState((prevState: LayoutState) => ({ ...prevState, configSidebarVisible: true }))
  }

  const onConfigSidebarHide = () => {
    setLayoutState((prevState: LayoutState) => ({ ...prevState, configSidebarVisible: false }))
  }

  const _changeInputStyle = (e: RadioButtonChangeEvent) => {
    setLayoutConfig((prevState: LayoutConfig) => ({ ...prevState, inputStyle: e.value }))
  }

  const changeRipple = (e: InputSwitchChangeEvent) => {
    setRipple?.(e.value as boolean)
    setLayoutConfig((prevState: LayoutConfig) => ({ ...prevState, ripple: e.value as boolean }))
    const ripple = (e.value as boolean) ? 'true' : 'false'
    configStore.updateConfig({ ripple: ripple })
  }

  const _changeMenuMode = (e: RadioButtonChangeEvent) => {
    setLayoutConfig((prevState: LayoutConfig) => ({ ...prevState, menuMode: e.value }))
  }

  const _changeTheme = (theme: string, colorScheme: string) => {
    const linkId = 'theme-css'
    const oldLink = document.getElementById(linkId) as HTMLLinkElement

    if (oldLink) {
      // 1. Buat elemen <link> baru yang meniru link lama
      const newLink = document.createElement('link')
      newLink.id = 'theme-css-new'
      newLink.rel = 'stylesheet'
      newLink.type = 'text/css'
      // Arahkan href ke folder public theme yang baru
      newLink.href = `/themes/${theme}/theme.css`

      // 2. Tunggu sampai file CSS baru selesai diunduh sepenuhnya oleh browser
      newLink.onload = () => {
        // Ganti id link baru menjadi id utama agar dikenali PrimeReact
        newLink.id = linkId

        // Hapus link lama setelah link baru aktif (Transisi mulus tanpa jeda kosong)
        oldLink.remove()

        // 3. Jalankan callback internal template Anda untuk update state & store
        setLayoutConfig((prevState: LayoutConfig) => ({ ...prevState, theme, colorScheme }))

        // Sinkronisasi Token Warna PrimeFlex v4 agar warna utilitas ikut berganti
        const themeFamily = colorScheme === 'dark' ? 'lara-dark' : 'lara-light'
        document.documentElement.setAttribute('data-theme', themeFamily)

        configStore.updateConfig({
          theme: theme,
          colorScheme: colorScheme,
        })
      }

      // Masukkan link baru ke dalam <head> berdampingan dengan link lama
      document.head.appendChild(newLink)
    } else {
      // Jalankan fungsi fallback bawaan jika element link tidak ditemukan
      changeTheme?.(layoutConfig.theme, theme, linkId, () => {
        setLayoutConfig((prevState: LayoutConfig) => ({ ...prevState, theme, colorScheme }))
        configStore.updateConfig({ theme, colorScheme })
      })
    }
  }

  const _decrementScale = () => {
    setLayoutConfig((prevState: LayoutConfig) => ({ ...prevState, scale: prevState.scale - 1 }))
  }

  const _incrementScale = () => {
    setLayoutConfig((prevState: LayoutConfig) => ({ ...prevState, scale: prevState.scale + 1 }))
  }

  const applyScale = () => {
    document.documentElement.style.fontSize = layoutConfig.scale + 'px'
  }

  useEffect(() => {
    applyScale()
  }, [layoutConfig.scale])

  return (
    <>
      <Sidebar
        visible={layoutState.configSidebarVisible}
        onHide={onConfigSidebarHide}
        position="right"
        className="layout-config-sidebar w-20rem"
      >
        {!props.simple && (
          <>
            <h5>Ripple Effect</h5>
            <InputSwitch
              checked={layoutConfig.ripple as boolean}
              onChange={(e) => changeRipple(e)}
            ></InputSwitch>
          </>
        )}
        <h5>PrimeOne Design</h5>
        <div className="grid">
          <div className="col-3">
            <button
              className="p-link w-2rem h-2rem"
              onClick={() => _changeTheme('lara-light-indigo', 'light')}
            >
              <img
                src="/layout/images/themes/lara-light-indigo.png"
                className="w-2rem h-2rem"
                alt="Lara Light Indigo"
              />
            </button>
          </div>
          <div className="col-3">
            <button
              className="p-link w-2rem h-2rem"
              onClick={() => _changeTheme('lara-light-blue', 'light')}
            >
              <img
                src="/layout/images/themes/lara-light-blue.png"
                className="w-2rem h-2rem"
                alt="Lara Light Blue"
              />
            </button>
          </div>
          <div className="col-3">
            <button
              className="p-link w-2rem h-2rem"
              onClick={() => _changeTheme('lara-light-purple', 'light')}
            >
              <img
                src="/layout/images/themes/lara-light-purple.png"
                className="w-2rem h-2rem"
                alt="Lara Light Purple"
              />
            </button>
          </div>
          <div className="col-3">
            <button
              className="p-link w-2rem h-2rem"
              onClick={() => _changeTheme('lara-light-teal', 'light')}
            >
              <img
                src="/layout/images/themes/lara-light-teal.png"
                className="w-2rem h-2rem"
                alt="Lara Light Teal"
              />
            </button>
          </div>
          <div className="col-3">
            <button
              className="p-link w-2rem h-2rem"
              onClick={() => _changeTheme('lara-dark-indigo', 'dark')}
            >
              <img
                src="/layout/images/themes/lara-dark-indigo.png"
                className="w-2rem h-2rem"
                alt="Lara Dark Indigo"
              />
            </button>
          </div>
          <div className="col-3">
            <button
              className="p-link w-2rem h-2rem"
              onClick={() => _changeTheme('lara-dark-blue', 'dark')}
            >
              <img
                src="/layout/images/themes/lara-dark-blue.png"
                className="w-2rem h-2rem"
                alt="Lara Dark Blue"
              />
            </button>
          </div>
          <div className="col-3">
            <button
              className="p-link w-2rem h-2rem"
              onClick={() => _changeTheme('lara-dark-purple', 'dark')}
            >
              <img
                src="/layout/images/themes/lara-dark-purple.png"
                className="w-2rem h-2rem"
                alt="Lara Dark Purple"
              />
            </button>
          </div>
          <div className="col-3">
            <button
              className="p-link w-2rem h-2rem"
              onClick={() => _changeTheme('lara-dark-teal', 'dark')}
            >
              <img
                src="/layout/images/themes/lara-dark-teal.png"
                className="w-2rem h-2rem"
                alt="Lara Dark Teal"
              />
            </button>
          </div>
          <div className="col-3">
            <button
              className="p-link w-2rem h-2rem"
              onClick={() => _changeTheme('soho-light', 'light')}
            >
              <img
                src="/layout/images/themes/soho-light.png"
                className="w-2rem h-2rem"
                alt="Soho Light"
              />
            </button>
          </div>
          <div className="col-3">
            <button
              className="p-link w-2rem h-2rem"
              onClick={() => _changeTheme('soho-dark', 'dark')}
            >
              <img
                src="/layout/images/themes/soho-dark.png"
                className="w-2rem h-2rem"
                alt="Soho Dark"
              />
            </button>
          </div>
          <div className="col-3">
            <button
              className="p-link w-2rem h-2rem"
              onClick={() => _changeTheme('viva-light', 'light')}
            >
              <img
                src="/layout/images/themes/viva-light.svg"
                className="w-2rem h-2rem"
                alt="Viva Light"
              />
            </button>
          </div>
          <div className="col-3">
            <button
              className="p-link w-2rem h-2rem"
              onClick={() => _changeTheme('viva-dark', 'dark')}
            >
              <img
                src="/layout/images/themes/viva-dark.svg"
                className="w-2rem h-2rem"
                alt="Viva Dark"
              />
            </button>
          </div>
        </div>

        <h5>Bootstrap</h5>
        <div className="grid">
          <div className="col-3">
            <button
              className="p-link w-2rem h-2rem"
              onClick={() => _changeTheme('bootstrap4-light-blue', 'light')}
            >
              <img
                src="/layout/images/themes/bootstrap4-light-blue.svg"
                className="w-2rem h-2rem"
                alt="Bootstrap Light Blue"
              />
            </button>
          </div>
          <div className="col-3">
            <button
              className="p-link w-2rem h-2rem"
              onClick={() => _changeTheme('bootstrap4-light-purple', 'light')}
            >
              <img
                src="/layout/images/themes/bootstrap4-light-purple.svg"
                className="w-2rem h-2rem"
                alt="Bootstrap Light Purple"
              />
            </button>
          </div>
          <div className="col-3">
            <button
              className="p-link w-2rem h-2rem"
              onClick={() => _changeTheme('bootstrap4-dark-blue', 'dark')}
            >
              <img
                src="/layout/images/themes/bootstrap4-dark-blue.svg"
                className="w-2rem h-2rem"
                alt="Bootstrap Dark Blue"
              />
            </button>
          </div>
          <div className="col-3">
            <button
              className="p-link w-2rem h-2rem"
              onClick={() => _changeTheme('bootstrap4-dark-purple', 'dark')}
            >
              <img
                src="/layout/images/themes/bootstrap4-dark-purple.svg"
                className="w-2rem h-2rem"
                alt="Bootstrap Dark Purple"
              />
            </button>
          </div>
        </div>

        <h5>Material Design</h5>
        <div className="grid">
          <div className="col-3">
            <button
              className="p-link w-2rem h-2rem"
              onClick={() => _changeTheme('md-light-indigo', 'light')}
            >
              <img
                src="/layout/images/themes/md-light-indigo.svg"
                className="w-2rem h-2rem"
                alt="Material Light Indigo"
              />
            </button>
          </div>
          <div className="col-3">
            <button
              className="p-link w-2rem h-2rem"
              onClick={() => _changeTheme('md-light-deeppurple', 'light')}
            >
              <img
                src="/layout/images/themes/md-light-deeppurple.svg"
                className="w-2rem h-2rem"
                alt="Material Light DeepPurple"
              />
            </button>
          </div>
          <div className="col-3">
            <button
              className="p-link w-2rem h-2rem"
              onClick={() => _changeTheme('md-dark-indigo', 'dark')}
            >
              <img
                src="/layout/images/themes/md-dark-indigo.svg"
                className="w-2rem h-2rem"
                alt="Material Dark Indigo"
              />
            </button>
          </div>
          <div className="col-3">
            <button
              className="p-link w-2rem h-2rem"
              onClick={() => _changeTheme('md-dark-deeppurple', 'dark')}
            >
              <img
                src="/layout/images/themes/md-dark-deeppurple.svg"
                className="w-2rem h-2rem"
                alt="Material Dark DeepPurple"
              />
            </button>
          </div>
        </div>

        <h5>Material Design Compact</h5>
        <div className="grid">
          <div className="col-3">
            <button
              className="p-link w-2rem h-2rem"
              onClick={() => _changeTheme('mdc-light-indigo', 'light')}
            >
              <img
                src="/layout/images/themes/md-light-indigo.svg"
                className="w-2rem h-2rem"
                alt="Material Light Indigo"
              />
            </button>
          </div>
          <div className="col-3">
            <button
              className="p-link w-2rem h-2rem"
              onClick={() => _changeTheme('mdc-light-deeppurple', 'light')}
            >
              <img
                src="/layout/images/themes/md-light-deeppurple.svg"
                className="w-2rem h-2rem"
                alt="Material Light Deep Purple"
              />
            </button>
          </div>
          <div className="col-3">
            <button
              className="p-link w-2rem h-2rem"
              onClick={() => _changeTheme('mdc-dark-indigo', 'dark')}
            >
              <img
                src="/layout/images/themes/md-dark-indigo.svg"
                className="w-2rem h-2rem"
                alt="Material Dark Indigo"
              />
            </button>
          </div>
          <div className="col-3">
            <button
              className="p-link w-2rem h-2rem"
              onClick={() => _changeTheme('mdc-dark-deeppurple', 'dark')}
            >
              <img
                src="/layout/images/themes/md-dark-deeppurple.svg"
                className="w-2rem h-2rem"
                alt="Material Dark Deep Purple"
              />
            </button>
          </div>
        </div>
      </Sidebar>
    </>
  )
}

export default AppConfig
