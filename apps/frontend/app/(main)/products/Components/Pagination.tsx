import { Paginator } from 'primereact/paginator'
import React from 'react'

type PaginationProps = {
  totalPages: number
  currentPage: number
  onPageChange: (page: number) => void
  rowsPerPage?: number
  totalRecords?: number // opsional kalau mau pakai totalRecords dari API
}

const Pagination = ({
  totalPages,
  currentPage,
  onPageChange,
  rowsPerPage = 10,
  totalRecords,
}: PaginationProps) => {
  if (totalPages <= 1) return null

  // Paginator menggunakan 'first' sebagai index item pertama
  const first = (currentPage - 1) * rowsPerPage
  const total = totalRecords ?? totalPages * rowsPerPage

  return (
    <div className="my-4">
      <Paginator
        first={first}
        rows={rowsPerPage}
        totalRecords={total}
        onPageChange={(e) => {
          // e.first = index item pertama, e.rows = rows per page
          const newPage = Math.floor(e.first / e.rows) + 1
          onPageChange(newPage)
        }}
        template="FirstPageLink PrevPageLink CurrentPageReport NextPageLink LastPageLink PageLinks CurrentPageReport"
        // currentPageReportTemplate="Page {currentPage} of {totalPages}"
        rowsPerPageOptions={[rowsPerPage]} // disable ganti rows
      />
    </div>
  )
}

export default Pagination
