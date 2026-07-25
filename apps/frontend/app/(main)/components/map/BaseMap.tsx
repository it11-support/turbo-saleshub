'use client'

import 'ol/ol.css'
import { useAddLayer } from './useAddLayer'
import { useOpenLayersMap } from './useOpenLayersMap'
import { useRef } from 'react'

type Props = {
  center?: [number, number]
  zoom?: number
  className?: string
  style?: React.CSSProperties
  layer?: any
}

const BaseMap = ({ center, zoom = 2, className, style, layer }: Props) => {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useOpenLayersMap(mapRef, center, zoom)
  useAddLayer(mapInstanceRef, layer)

  return <div ref={mapRef} className={className} style={style} />
}

export default BaseMap
