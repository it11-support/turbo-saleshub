import { fetcher } from '../../lib'
import { Competitor, IResSingle } from '@saleshub-tsm/types'
import { useParams } from 'next/navigation'
import {
  AutoComplete,
  AutoCompleteChangeEvent,
  AutoCompleteCompleteEvent,
} from 'primereact/autocomplete'
import { Button } from 'primereact/button'
import { Dialog } from 'primereact/dialog'
import React, { useMemo, useState } from 'react'
import useSWR from 'swr'

import { createUrl } from '@/lib/api'
import { useCompetitorStore } from '@/stores/competitor'

const CompetitorDialog = () => {
  const [visible, setVisible] = useState<boolean>(false)
  const [tempValue, setTempValue] = useState<Competitor | string | null>(null)
  const [filteredCompetitors, setFilteredCompetitors] = useState<Competitor[]>([])
  const { id } = useParams()

  const { addCompetitorToVisit, selectedCompetitors, syncCompetitors } = useCompetitorStore()

  const apiUrl = createUrl('competitors')
  const { data: competitorData } = useSWR<IResSingle<Competitor>>(apiUrl, fetcher)

  const competitorOptions = useMemo<Competitor[]>(() => {
    const list = competitorData?.data || []
    return list.map((c) => ({
      name: c.name,
      id: Number(c.id),
    }))
  }, [competitorData])

  const searchCompetitor = (event: AutoCompleteCompleteEvent) => {
    const query = event.query.toLowerCase()
    const _filteredCompetitors = competitorOptions?.filter((c) =>
      c.name.toLowerCase().startsWith(query)
    )
    setFilteredCompetitors(_filteredCompetitors)
  }

  const handleSave = () => {
    if (tempValue) {
      addCompetitorToVisit(tempValue)
      setTempValue(null)
      setVisible(false)
    }
  }

  const onHide = () => {
    setTempValue(null)
    setVisible(false)
  }

  const footerContent = (
    <div className="flex justify-content-end gap-2">
      <Button outlined severity="danger" label="Cancel" onClick={onHide} />
      <Button
        label="Add Competitor"
        icon="pi pi-plus"
        onClick={handleSave}
        disabled={!tempValue}
        autoFocus
      />
    </div>
  )

  return (
    <>
      <div className="flex justify-content-start gap-2">
        <Button
          label="Add Competitor"
          icon="pi pi-plus-circle"
          text
          className="p-button-secondary font-small"
          onClick={() => setVisible(true)}
        />
        {selectedCompetitors.length > 0 && (
          <Button
            label="Save"
            icon="pi pi-check-circle"
            text
            className="p-button-success font-small"
            onClick={() => syncCompetitors(Number(id))}
          />
        )}
      </div>

      <Dialog
        header="Add Competitor"
        visible={visible}
        dismissableMask
        className="w-11 md:w-4 lg:w-3"
        onHide={onHide}
        footer={footerContent}
      >
        <div className="flex flex-column gap-2 mt-2">
          <label htmlFor="competitor" className="font-bold text-sm">
            Competitor Name
          </label>
          <AutoComplete
            id="competitor"
            value={tempValue}
            suggestions={filteredCompetitors}
            completeMethod={searchCompetitor}
            field="name"
            onChange={(e: AutoCompleteChangeEvent) => setTempValue(e.value)}
            placeholder="Search or type new name..."
            className="w-full"
            inputClassName="w-full"
            autoFocus
          />
          <small className="text-gray-500">
            Pick a competitor from the list or type a new name.
          </small>
        </div>
      </Dialog>
    </>
  )
}

export default CompetitorDialog
