'use client'

import 'ol/ol.css'
import { useAddLayer } from './useAddLayer'
import { useOpenLayersMap } from './useOpenLayersMap'
import Feature from 'ol/Feature'
import { useRef } from 'react'
import useMapOverlay from './useMapOverlay'
import useFeatureInteraction from './useFeatureIntersection'

type Props = {
  center?: [number, number]
  zoom?: number
  className?: string
  style?: React.CSSProperties
  layer?: any
  popupContent?: (feature: Feature) => string
}

const BaseMap = ({ center, zoom = 2, className, style, layer, popupContent }: Props) => {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useOpenLayersMap(mapRef, center, zoom)
  useAddLayer(mapInstanceRef, layer)

  const { popupRef, showOverlay, hideOverlay } = useMapOverlay(mapInstanceRef)

  if (popupContent) {
    useFeatureInteraction({
      mapInstanceRef,
      onFeatureHover: (feature, coordinate) => {
        showOverlay(coordinate)

        if (popupRef.current) {
          popupRef.current.innerHTML = popupContent(feature)
        }
      },
      onEmptyHover: hideOverlay,
    })
  }

  return (
    <>
      <div ref={mapRef} className={className} style={style} />
      <div
        ref={popupRef}
        className="bg-white border-round shadow-3 p-3"
        style={{
          position: 'absolute',
          minWidth: 220,
          display: 'none',
        }}
      />
    </>
  )
}

export default BaseMap
