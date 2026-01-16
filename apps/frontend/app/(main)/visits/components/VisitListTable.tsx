'use client'
import { ISalesVisitRule, IVisit } from '@saleshub-tsm/types'
import { formatDate } from 'date-fns'
import { useRouter } from 'next/navigation'
import { Button } from 'primereact/button'
import { Column } from 'primereact/column'
import { DataTable } from 'primereact/datatable'

import { useVisitsStore } from '@/stores'

type SalesVisit = {
  customer_id: number
  id: number
  is_virtual: boolean
  max_items_per_visit: number
  rule: ISalesVisitRule
  sales_person_id: number
  status: string
  visits: IVisit
  visit_date: string
}
const VisitListTable = () => {
  const { data, limit, page, total, loading, setPage, setLimit, multiSortMeta, setMultiSortMeta } =
    useVisitsStore()

  const router = useRouter()

  const visitDateTemplate = (rowData: SalesVisit) => {
    return formatDate(rowData.visit_date, 'EEE MMM do, yyyy')
  }

  const dateTimeTemplate = (rowData: SalesVisit, type: 'start_at' | 'end_at') => {
    const dateValue = rowData.visits[type]
    if (!dateValue) return
    return formatDate(dateValue, 'hh:mm a')
  }

  const handleClickEdit = (data: IVisit) => {
    router.push(`/visit/details/${data.id}`)
  }

  const statusBodyTemplate = (rowData: SalesVisit) => {
    return (
      <>
        <Button
          severity={`${rowData.status === 'Completed' ? 'success' : 'warning'}`}
          label={rowData.status}
          className={`p-button-outlined p-button-sm p-2`}
          size="small"
          icon={`${rowData.status === 'Completed' ? 'pi pi-check' : 'pi pi-clock'}`}
        />
      </>
    )
  }

  return (
    <>
      <DataTable
        value={data}
        paginator
        lazy
        rows={limit}
        first={(page - 1) * limit}
        totalRecords={total}
        sortMode="multiple"
        removableSort
        multiSortMeta={multiSortMeta}
        onPage={(e) => {
          setPage((e.page ?? 0) + 1)
          setLimit(e.rows)
        }}
        onSort={(e) => setMultiSortMeta((e.multiSortMeta || []).filter((m) => m.order !== 0))}
        dataKey="id"
        loading={loading}
        emptyMessage="No visit found"
        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
        currentPageReportTemplate="Showing {first} to {last} of {totalRecords} entries"
        rowsPerPageOptions={[10, 25, 50]}
      >
        <Column field="visit_date" header="Visit Date" sortable body={visitDateTemplate} />
        <Column
          field="visits.customer.CardName"
          header="Customer"
          sortField="customer.CardName"
          sortable
        />
        <Column
          field="visits.start_at"
          sortField="start_at"
          header="Start Time"
          sortable
          body={(rowData) => dateTimeTemplate(rowData, 'start_at')}
        />
        <Column
          field="visits.end_at"
          header="End Time"
          sortField="end_at"
          sortable
          body={(rowData) => dateTimeTemplate(rowData, 'end_at')}
        />
        <Column field="visits.notes" header="Visit Notes" sortField="notes" sortable />
        <Column
          field="visits.status"
          header="Status"
          sortField="status"
          body={statusBodyTemplate}
          sortable
        />

        <Column
          header="Action"
          body={(rowData) => {
            const isAdmin = rowData.roles?.role === 'admin'
            return (
              <>
                <Button
                  onClick={() => handleClickEdit(rowData)}
                  disabled={isAdmin}
                  className={`p-button-text p-button-plain p-button-sm ${
                    isAdmin ? 'p-disabled' : ''
                  }`}
                >
                  View Details <i className="pi pi-eye py-1 ml-2"></i>
                </Button>
              </>
            )
          }}
        />
      </DataTable>
    </>
  )
}

export default VisitListTable
