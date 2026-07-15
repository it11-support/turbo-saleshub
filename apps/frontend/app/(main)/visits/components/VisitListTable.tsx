'use client'
import { visitFilters } from './filters'
import VisitDataTable, { SalesVisit } from '../../components/visits/VisitDataTable'
import { fetcher } from '../../lib'
import { EFollowUpStatus, IResPaginated, IVisitItemConcern } from '@saleshub-tsm/types'
import Link from 'next/link'
import { createSerializer, useQueryStates } from 'nuqs'
import useSWR from 'swr'

import { createUrl } from '@/lib/api'
import { buildVisitPayload } from '@/lib/visits'

const VisitListTable = () => {
  const [filters, setFilters] = useQueryStates(visitFilters)
  const serialize = createSerializer(visitFilters)
  const payload = buildVisitPayload(filters)

  const visitsUrl = createUrl('visits', payload)

  const fromUrl = `visits${serialize(filters)}`

  const { data: visitData, isValidating } = useSWR<IResPaginated<SalesVisit>>(visitsUrl, fetcher)

  const data = visitData?.data.items || []
  const totalRecords = visitData?.data.totalRecords || 0
  const totalPages = visitData?.data.totalPages || 0

  const followUpsBodyTemplate = (
    rowData: SalesVisit,
    { preloadVisit }: { preloadVisit: (visit: SalesVisit['visits']) => void }
  ) => {
    const visitItems = rowData.visits?.visit_items
    if (!visitItems?.length) return

    // 1. Kumpulkan semua concern dari visit items
    const allConcerns = visitItems.flatMap((item) => item.visit_item_concerns || [])

    // 2. Fungsi untuk mengambil status paling akhir dari array follow_ups
    const getLatestStatus = (concern: IVisitItemConcern): EFollowUpStatus | null => {
      const followUps = concern.follow_ups || []
      if (followUps.length > 0) {
        // Mengambil data follow_up urutan paling terakhir (terbaru)
        const latestFollowUp = followUps[followUps.length - 1]
        return latestFollowUp.concern_status?.status as EFollowUpStatus
      }
      // Fallback jika tidak ada riwayat follow_ups
      return concern.status?.status as EFollowUpStatus
    }

    // 3. Kelompokkan data berdasarkan status terakhirnya
    const openIssues = allConcerns.filter((concern) => {
      const latestStatus = getLatestStatus(concern)
      return latestStatus && ![EFollowUpStatus.Done, EFollowUpStatus.Closed].includes(latestStatus)
    })

    const doneIssues = allConcerns.filter((concern) => {
      return getLatestStatus(concern) === EFollowUpStatus.Done
    })

    const closedIssues = allConcerns.filter((concern) => {
      return getLatestStatus(concern) === EFollowUpStatus.Closed
    })

    // 4. Validasi tampilan: jika tidak ada isu apa pun atau visit belum Completed, sembunyikan komponen
    const hasAnyIssue = openIssues.length > 0 || doneIssues.length > 0 || closedIssues.length > 0
    if (!hasAnyIssue || rowData.status !== 'Completed') return

    return (
      <Link
        href={`/visits/issues/${Number(rowData.visits.id)}?from=${encodeURIComponent(fromUrl)}`}
        className="no-underline"
        prefetch={false}
        onMouseEnter={() => preloadVisit(rowData.visits)}
      >
        <div className="flex flex-column gap-2 cursor-pointer text-sm">
          {/* Tampilan jika ada Open Issues (Belum Done & Belum Closed) */}
          {openIssues.length > 0 && (
            <div className="flex align-items-center gap-2 text-gray-600 hover:text-yellow-600 transition-colors">
              <i className="pi pi-exclamation-triangle text-yellow-500"></i>
              <span className="font-medium">{openIssues.length} Open Issues</span>
            </div>
          )}

          {/* Tampilan jika ada Done Issues */}
          {doneIssues.length > 0 && (
            <div className="flex align-items-center gap-2 text-green-600 hover:text-green-700 transition-colors">
              <i className="pi pi-check-circle text-green-500"></i>
              <span className="font-medium">{doneIssues.length} Done</span>
            </div>
          )}

          {/* Tampilan jika ada Closed Issues */}
          {closedIssues.length > 0 && (
            <div className="flex align-items-center gap-2 text-red-600 hover:text-red-700 transition-colors">
              <i className="pi pi-times text-red-500"></i>
              <span className="font-medium">{closedIssues.length} Closed</span>
            </div>
          )}
        </div>
      </Link>
    )
  }

  return (
    <VisitDataTable
      data={data}
      loading={isValidating}
      totalRecords={totalRecords}
      totalPages={totalPages}
      filters={filters}
      setFilters={setFilters}
      payload={payload}
      fromUrl={fromUrl}
      endpoint="visits"
      followUpsBodyTemplate={followUpsBodyTemplate}
    />
  )
}

export default VisitListTable
