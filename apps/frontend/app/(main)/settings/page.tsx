'use client'

import { useConcernStore } from '@/stores'
import { Button } from 'primereact/button'
import { useEffect } from 'react'

const SettingsPage = () => {

  const concernStore = useConcernStore()
  const { fetchConcernCategories, concernCategories } = concernStore

  useEffect(() => {
    fetchConcernCategories()
  }, [])

  return (
    <>
      <div className="card p-4">
        <div className="flex justify-between mb-4 items-center">
          <Button
            label="Back"
            icon="pi pi-chevron-left"
            severity="danger"
            size="small"
            outlined
            onClick={() => history.back()}
          />
        </div>
        <h5>Settings</h5>
        <div className="grid p-2">
          <h6>Customer Concerns / Blocking Issue</h6>
          <div className="col-12">
            {/* Button add */}
            <Button
              label="Add New"
              icon="pi pi-plus"
              severity="success"
              size="small"
              onClick={() => {}}
            />
          </div>
          <div className="col-12 lg:col-6">
            {/* Card */}
            {concernCategories.map((category) => (
              <div
                className="border-1 surface-border border-round p-2 mb-3 surface-50"
                key={Number(category.id)}
              >
                <div className="flex justify-between items-start gap-3">
                  <div className="flex flex-column gap-1">
                    <p className="m-0 font-semibold">{category.name}</p>
                    <p className="m-0 text-sm text-600">{category.description}</p>
                  </div>
                  <div className="flex align-items-center gap-2 ml-auto">
                    <Button
                      label="Edit"
                      icon="pi pi-pencil"
                      size="small"
                      outlined
                      onClick={() => {}}
                    />
                    <Button
                      label="Delete"
                      icon="pi pi-trash"
                      size="small"
                      severity="danger"
                      outlined
                      onClick={() => {}}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}

export default SettingsPage
