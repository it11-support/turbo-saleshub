import { AutoComplete, AutoCompleteProps } from 'primereact/autocomplete'
import { Calendar, CalendarProps } from 'primereact/calendar'
import { Dropdown, DropdownProps } from 'primereact/dropdown'
import { InputNumber, InputNumberProps } from 'primereact/inputnumber'
import { InputSwitch, InputSwitchProps } from 'primereact/inputswitch'
import { InputText, InputTextProps } from 'primereact/inputtext'
import { InputTextarea, InputTextareaProps } from 'primereact/inputtextarea'
import { SelectButton, SelectButtonProps } from 'primereact/selectbutton'
import React from 'react'

type FormFieldBaseProps = {
  label?: string
  error?: string
  required?: boolean
  className?: string
  labelClassName?: string
  errorClassName?: string
}

type FormInputProps = FormFieldBaseProps & InputTextProps
type FormTextareaProps = FormFieldBaseProps & InputTextareaProps
type FormDropdownProps = FormFieldBaseProps &
  Omit<DropdownProps, 'options'> & {
    options: any[]
    optionLabel?: string
    optionValue?: string
  }
type FormNumberProps = FormFieldBaseProps & InputNumberProps
type FormSwitchProps = FormFieldBaseProps & InputSwitchProps
type FormSelectButtonProps = FormFieldBaseProps &
  Omit<SelectButtonProps, 'options'> & {
    options: { label: string; value: any; icon?: string; color?: string }[]
  }
type FormAutoCompleteProps = FormFieldBaseProps &
  Omit<AutoCompleteProps, 'suggestions'> & {
    suggestions: any[]
  }
type FormCalendarProps = FormFieldBaseProps &
  Omit<CalendarProps<any>, 'value'> & {
    value?: Date | Date[] | null
  }

export const FormInput = ({
  label,
  error,
  required,
  className = 'w-full h-11',
  labelClassName = 'block font-bold mb-2 text-secondary',
  errorClassName = 'p-error',
  id,
  ...props
}: FormInputProps) => {
  return (
    <div className="field col-12 md:col-12">
      {label && (
        <label htmlFor={id} className={labelClassName}>
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <InputText id={id} className={`${className} ${error ? 'p-invalid' : ''}`} {...props} />
      {error && <small className={errorClassName}>{error}</small>}
    </div>
  )
}

export const FormTextarea = ({
  label,
  error,
  required,
  className = '',
  labelClassName = 'block font-bold mb-2 text-secondary',
  errorClassName = 'p-error',
  id,
  ...props
}: FormTextareaProps) => {
  return (
    <div className="field col-12">
      {label && (
        <label htmlFor={id} className={labelClassName}>
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <InputTextarea id={id} className={`${className} ${error ? 'p-invalid' : ''}`} {...props} />
      {error && <small className={errorClassName}>{error}</small>}
    </div>
  )
}

export const FormDropdown = ({
  label,
  error,
  required,
  options = [],
  optionLabel = 'label',
  optionValue = 'value',
  className = 'w-full h-11 flex items-center',
  labelClassName = 'block font-bold mb-2 text-secondary',
  errorClassName = 'p-error',
  id,
  ...props
}: FormDropdownProps) => {
  return (
    <div className="field col-12 md:col-12">
      {label && (
        <label htmlFor={id} className={labelClassName}>
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <Dropdown
        id={id}
        options={options}
        optionLabel={optionLabel}
        optionValue={optionValue}
        className={`${className} ${error ? 'p-invalid' : ''}`}
        {...props}
      />
      {error && <small className={errorClassName}>{error}</small>}
    </div>
  )
}

export const FormNumber = ({
  label,
  error,
  required,
  className = 'w-full',
  labelClassName = 'block font-bold mb-2 text-secondary',
  errorClassName = 'p-error',
  id,
  ...props
}: FormNumberProps) => {
  return (
    <div className="field col-12 md:col-2">
      {label && (
        <label htmlFor={id} className={labelClassName}>
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <InputNumber id={id} className={`${className} ${error ? 'p-invalid' : ''}`} {...props} />
      {error && <small className={errorClassName}>{error}</small>}
    </div>
  )
}

export const FormSwitch = ({
  label,
  error,
  required,
  className = '',
  labelClassName = 'block font-bold mb-2 text-secondary',
  errorClassName = 'p-error',
  id,
  ...props
}: FormSwitchProps) => {
  return (
    <div className="field col-12 md:col-3 flex flex-column">
      {label && (
        <label htmlFor={id} className={labelClassName}>
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <InputSwitch id={id} className={className} {...props} />
      {error && <small className={errorClassName}>{error}</small>}
    </div>
  )
}

export const FormSelectButton = ({
  label,
  error,
  required,
  options = [],
  className = 'w-full',
  labelClassName = 'block font-bold mb-2 text-secondary',
  errorClassName = 'p-error',
  id,
  ...props
}: FormSelectButtonProps) => {
  return (
    <div className="field col-12 md:col-3">
      {label && (
        <label htmlFor={id} className={labelClassName}>
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <SelectButton id={id} options={options} className={className} {...props} />
      {error && <small className={errorClassName}>{error}</small>}
    </div>
  )
}

export const FormAutoComplete = ({
  label,
  error,
  required,
  className = 'w-full',
  labelClassName = 'block font-bold mb-2 text-secondary',
  errorClassName = 'p-error',
  id,
  suggestions = [],
  ...props
}: FormAutoCompleteProps) => {
  return (
    <div className="field col-12 md:col-12">
      {label && (
        <label htmlFor={id} className={labelClassName}>
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <AutoComplete
        id={id}
        suggestions={suggestions}
        className={`${className} ${error ? 'p-invalid' : ''}`}
        {...props}
      />
      {error && <small className={errorClassName}>{error}</small>}
    </div>
  )
}

export const FormCalendar = ({
  label,
  error,
  required,
  className = 'w-full',
  labelClassName = 'block font-bold mb-2 text-secondary',
  errorClassName = 'p-error',
  id,
  ...props
}: FormCalendarProps) => {
  return (
    <div className="field col-12 md:col-12">
      {label && (
        <label htmlFor={id} className={labelClassName}>
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <Calendar id={id} className={`${className} ${error ? 'p-invalid' : ''}`} {...props} />
      {error && <small className={errorClassName}>{error}</small>}
    </div>
  )
}
