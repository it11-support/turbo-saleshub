'use client'

import { markerIcon, popupContent } from '../map/function'
import { useAddLayer } from '../map/useAddLayer'
import useClusterInteraction from '../map/useClusterInteraction'
import useClusterLayer from '../map/useClusterLayer'
import useMapOverlay from '../map/useMapOverlay'
import { useOpenLayersMap } from '../map/useOpenLayersMap'
import SkeletonLoader from '../skeleton-loader/SkeletonLoader'
import { IDashboardData } from '@saleshub-tsm/types'
import { Card } from 'primereact/card'
import { useRef } from 'react'

import 'ol/ol.css'

type Props = {
  isValidating: boolean
  data?: IDashboardData['data']
}

const VisitDistribution = ({ isValidating, data }: Props) => {
  const mapRef = useRef<HTMLDivElement>(null)
  const visitsDistribution = data?.visitsDistribution ?? []

  const avg =
    visitsDistribution && visitsDistribution.length > 0
      ? visitsDistribution.reduce(
          (acc, visit) => {
            acc.lat += Number(visit.lat)
            acc.lng += Number(visit.lng)
            return acc
          },
          { lat: 0, lng: 0 }
        )
      : null

  const center: [number, number] = avg
    ? [avg.lng / visitsDistribution.length, avg.lat / visitsDistribution.length]
    : [115.1889, -8.4095]

  const mapInstanceRef = useOpenLayersMap(mapRef, center, 10)

  const layer = useClusterLayer({
    items: visitsDistribution,
    distance: 20,
    markerIcon,
    clusterColor: '#2563eb',
  })

  useAddLayer(mapInstanceRef, layer)

  const { popupRef, showOverlay, hideOverlay } = useMapOverlay(mapInstanceRef)

  useClusterInteraction({
    mapInstanceRef,
    onFeatureClick: (feature) => {
      const visit = feature.get('data')
      const coordinate = (feature.getGeometry() as any).getCoordinates() as [number, number]

      showOverlay(coordinate)
      if (popupRef.current) {
        popupRef.current.innerHTML = popupContent(visit)
      }
    },
    onClusterClick: (features, coordinate) => {
      showOverlay(coordinate)
      if (popupRef.current) {
        popupRef.current.innerHTML = `<div style="font-weight:600">${features.length} visits</div>`
      }
    },
    onEmptyClick: hideOverlay,
  })

  return (
    <Card title="Visit Distribution" subTitle="Last 30 Days" style={{ height: 556 }}>
      <div
        className="relative"
        style={{
          height: '430px',
        }}
      >
        <div
          ref={mapRef}
          style={{
            width: '100%',
            height: '100%',
          }}
        />

        {isValidating && (
          <div className="absolute inset-0 flex items-center justify-center">
            <SkeletonLoader type="chart-horizontal" />
          </div>
        )}

        <div
          ref={popupRef}
          className="bg-white border-round shadow-3 p-3"
          style={{
            position: 'absolute',
            minWidth: 220,
            display: 'none',
          }}
        />
      </div>
    </Card>
  )
}

export default VisitDistribution
