'use client'

import { LayoutContext } from '../../../../layout/context/layoutcontext'
import { yupResolver } from '@hookform/resolvers/yup'
import { Button } from 'primereact/button'
import { Checkbox } from 'primereact/checkbox'
import { InputText } from 'primereact/inputtext'
import { Password } from 'primereact/password'
import { classNames } from 'primereact/utils'
import { useContext } from 'react'
import { Controller, useForm } from 'react-hook-form'
import * as yup from 'yup'

import { useAuth } from '@/layout/context/AuthContext'
import { $api } from '@/lib/api'
import { useConfigStore } from '@/stores'

type Credentials = {
  username: string
  password: string
  remember: boolean
}

const schema = yup.object().shape({
  username: yup
    .string()
    .required('Email or username is required')
    .test('is-valid', 'Please enter a valid email or username', (value) => {
      if (!value) return false
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/
      return emailRegex.test(value) || usernameRegex.test(value)
    }),
  password: yup
    .string()
    .required('Password is required')
    .matches(/[A-Z]/, 'Must contain at least one uppercase letter')
    .matches(/[0-9]/, 'Must contain at least one number')
    .min(6, 'Must be at least 6 characters long'),
  remember: yup.boolean().default(false),
})

const LoginPage = () => {
  const {
    setError,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: yupResolver(schema),
  })

  const { login, setLoading } = useAuth()
  const { fetchConfigs } = useConfigStore()

  const { layoutConfig } = useContext(LayoutContext)

  const containerClassName = classNames(
    'surface-ground flex align-items-center justify-content-center min-h-screen min-w-screen overflow-hidden',
    { 'p-input-filled': layoutConfig.inputStyle === 'filled' }
  )

  const onSubmit = async (credentials: Credentials) => {
    try {
      setLoading(true)

      const res = await $api('/auth/login', {
        method: 'POST',
        body: {
          username: credentials.username,
          password: credentials.password,
          remember: credentials.remember,
        },
        onResponseError({ response }) {
          const data = response?._data

          if (data?.errors) {
            Object.entries(data.errors).forEach(([key, value]) => {
              if (['username', 'password', 'remember'].includes(key)) {
                setError(key as 'username' | 'password' | 'remember', {
                  type: 'server',
                  message: value as string,
                })
              }
            })
          }
        },
      })

      const { data } = res
      if (!data?.token) {
        throw new Error('Invalid login response')
      }

      await login(data.token, data.user)
      await fetchConfigs()
    } catch (err: unknown) {
      console.error('Login error:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={containerClassName}>
      <div className="flex flex-column align-items-center justify-content-center">
        <img
          src={`/layout/images/logo-${layoutConfig.colorScheme === 'light' ? 'dark' : 'white'}.svg`}
          alt="Sakai logo"
          className="mb-5 w-6rem flex-shrink-0"
        />
        <div
          style={{
            borderRadius: '53px',
            padding: '0.1rem',
            background:
              'linear-gradient(180deg, var(--primary-color) 10%, rgba(33, 150, 243, 0) 60%)',
          }}
        >
          <div className="w-full surface-card py-8 px-5 sm:px-8" style={{ borderRadius: '53px' }}>
            <div className="text-center mb-5">
              <span className="text-700 text-3xl font-medium">Sign in to continue</span>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="p-4">
              <div>
                <label htmlFor="username" className="block text-900 text-xl font-medium mb-2">
                  Email / Username
                </label>
                <Controller
                  name="username"
                  control={control}
                  defaultValue=""
                  render={({ field }) => (
                    <InputText
                      id="identifier"
                      {...field}
                      placeholder="Email address or username"
                      className={`w-full md:w-30rem mb-2 ${errors.username ? 'p-invalid' : ''}`}
                      style={{ padding: '1rem' }}
                    />
                  )}
                />
                {errors.username && (
                  <small className="p-error block mb-3">{errors.username.message}</small>
                )}

                <label htmlFor="password" className="block text-900 font-medium text-xl mb-2">
                  Password
                </label>

                <Controller
                  name="password"
                  control={control}
                  defaultValue=""
                  render={({ field }) => (
                    <Password
                      inputId="password"
                      {...field}
                      placeholder="Password"
                      toggleMask
                      // feedback={false} // hilangkan strength meter kalau tidak perlu
                      className={`w-full mb-5 ${errors.password ? 'p-invalid' : ''}`}
                      inputClassName="w-full p-3 md:w-30rem"
                    />
                  )}
                />
                {errors.password && (
                  <small className="p-error block mb-3">{errors.password.message}</small>
                )}
                <div className="flex align-items-center justify-content-between mb-5 gap-5">
                  <div className="flex align-items-center">
                    <Controller
                      name="remember"
                      control={control}
                      defaultValue={false}
                      render={({ field }) => (
                        <div className="flex align-items-center">
                          <Checkbox
                            inputId="remember"
                            checked={field.value}
                            onChange={(e) => field.onChange(e.checked ?? false)}
                            className="mr-2"
                          />
                          <label htmlFor="remember">Remember me</label>
                        </div>
                      )}
                    />
                  </div>
                </div>
                <Button
                  label="Sign In"
                  className="w-full p-3 text-xl"
                  type="submit"
                  loading={isSubmitting}
                ></Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LoginPage
