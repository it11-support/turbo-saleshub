'use client'

import { yupResolver } from '@hookform/resolvers/yup'
import { IRole, ISalesPerson, IUser } from '@saleshub-tsm/types'
import { Button } from 'primereact/button'
import { Dropdown } from 'primereact/dropdown'
import { InputText } from 'primereact/inputtext'
import { Password } from 'primereact/password'
import React, { useEffect } from 'react'
import { Controller, useForm } from 'react-hook-form'
import * as yup from 'yup'

type Props = {
  isEdit?: boolean
  userData: IUser | null
  roles: [] | IRole[]
  salesPersons?: ISalesPerson[]
  onSubmit: (data: Partial<IUser>) => void
}

interface UserFormValues {
  name?: string
  username?: string
  email?: string
  password?: string
  confirm_password?: string
  role_id?: number
  sales_person_id?: number
}

const schema = () =>
  yup.object({
    name: yup.string().required('Name is required'),
    username: yup.string().required('Username is required'),
    email: yup.string().email('Email is invalid').required('Email is required'),
    password: yup.string().min(6, 'Minimal 6 characters').optional(),
    confirm_password: yup.string().when('password', {
      is: (val: string) => !!val,
      then: (schema) =>
        schema
          .required('Password confirmation required')
          .oneOf([yup.ref('password')], 'Password confirmation does not match'),
      otherwise: (schema) => schema.notRequired(),
    }),
    role_id: yup.number().required('Role required'),
    sales_person_id: yup.number().optional(),
  })

const UserForm: React.FC<Props> = ({
  isEdit = false,
  userData,
  roles = [],
  salesPersons = [],
  onSubmit,
}) => {
  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors },
    watch,
  } = useForm({
    resolver: yupResolver(schema()),
  })

  const roleOptions = roles.map((role) => ({
    label: role.role.toUpperCase(),
    value: role.id,
  }))

  const salesPersonOptions = [
    { label: '-- No Sales Person --', value: null },
    ...salesPersons
      .filter((sp) => !sp.user)
      .map((salesPerson) => ({
        label: salesPerson.SlpName,
        value: Number(salesPerson.id),
      })),
  ]

  useEffect(() => {
    if (isEdit && userData) {
      setValue('name', userData.name ?? '')
      setValue('username', userData.username ?? '')
      setValue('email', userData.email ?? '')
      setValue('role_id', Number(userData.roles?.id))
      setValue(
        'sales_person_id',
        userData.sales_person ? Number(userData.sales_person.id) : undefined
      )
    }
  }, [isEdit, userData, setValue])

  const id = Number(userData?.sales_person?.id)
  const exists = salesPersonOptions.some((opt) => opt.value === id)

  if (!exists) {
    salesPersonOptions.push({
      label: userData?.sales_person?.SlpName ?? '',
      value: id,
    })
  }

  const handleFormSubmit = (data: UserFormValues) => {
    const passwordEmpty =
      data.password === undefined || data.password === null || data.password.trim() === ''

    if (isEdit && passwordEmpty) {
      delete data.password
      delete data.confirm_password
    }
    onSubmit(data)
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="p-fluid space-y-3">
      <div className="mb-3">
        <label className="block mb-2">Nama</label>
        <InputText {...register('name')} className={errors.name ? 'p-invalid' : ''} />
        {errors.name && <small className="p-error">{errors.name.message}</small>}
      </div>

      <div className="mb-3">
        <label className="block mb-2">Username</label>
        <InputText {...register('username')} className={errors.username ? 'p-invalid' : ''} />
        {errors.username && <small className="p-error">{errors.username.message}</small>}
      </div>

      <div className="mb-3">
        <label className="block mb-2">Email</label>
        <InputText {...register('email')} className={errors.email ? 'p-invalid' : ''} />
        {errors.email && <small className="p-error">{errors.email.message}</small>}
      </div>

      {(!isEdit || isEdit) && (
        <>
          <div className="mb-3">
            <label className="block mb-2">Password</label>
            <Controller
              name="password"
              control={control}
              rules={{
                required: !isEdit ? 'Password is required' : false,
                validate: (value) => {
                  if (isEdit && !value) return true
                  return (value?.length ?? 0) >= 6 || 'Minimal 6 characters'
                },
              }}
              render={({ field }) => (
                <Password
                  value={field.value || ''}
                  onChange={(e) => field.onChange(e.target.value)}
                  feedback={false}
                  toggleMask
                  placeholder={isEdit ? 'Leave empty if not changing' : ''}
                />
              )}
            />

            {errors.password && <small className="p-error">{errors.password.message}</small>}
          </div>

          <div className="mb-3">
            <label className="block mb-2">Password Confirmation</label>
            <Controller
              name="confirm_password"
              control={control}
              rules={{
                validate: (value) => {
                  const password = watch('password')
                  // ✔ Kalau password diisi, konfirmasi harus sama
                  if (password) {
                    if (value !== password) return 'Password confirmation does not match'
                    if (!value) return 'Password confirmation required'
                  }
                  // ✔ Kalau password kosong saat edit, konfirmasi boleh kosong
                  return true
                },
              }}
              render={({ field }) => (
                <Password
                  value={field.value || ''}
                  onChange={(e) => field.onChange(e.target.value)}
                  feedback={false}
                  toggleMask
                  placeholder={isEdit ? 'Leave empty if not changing' : ''}
                />
              )}
            />

            {errors.confirm_password && (
              <small className="p-error">{errors.confirm_password.message}</small>
            )}
          </div>
        </>
      )}

      <div className="mb-3">
        <label className="block mb-2">Role</label>
        <Controller
          name="role_id"
          control={control}
          render={({ field }) => (
            <Dropdown
              {...field}
              onChange={(e) => field.onChange(e.value)}
              options={roleOptions}
              value={field.value ?? null}
              optionLabel="label"
              optionValue="value"
              placeholder="Select Role"
              className={errors.role_id ? 'p-invalid w-full' : 'w-full'}
            />
          )}
        />
        {errors.role_id && <small className="p-error">{errors.role_id.message}</small>}
      </div>

      <div className="mb-3">
        <label className="block mb-2">Sales Person</label>
        <Controller
          name="sales_person_id"
          control={control}
          render={({ field }) => (
            <Dropdown
              {...field}
              options={salesPersonOptions}
              onChange={(e) => field.onChange(e.value)}
              value={field.value ?? null}
              optionLabel="label"
              optionValue="value"
              placeholder="Select Sales Person (Optional)"
              className={errors.sales_person_id ? 'p-invalid w-full' : 'w-full'}
            />
          )}
        />
        {errors.sales_person_id && (
          <small className="p-error">{errors.sales_person_id.message}</small>
        )}
      </div>

      <div className="flex justify-end">
        <Button
          label={isEdit ? 'Update' : 'Save'}
          type="submit"
          icon="pi pi-save"
          className="w-auto"
        />
      </div>
    </form>
  )
}

export default UserForm
