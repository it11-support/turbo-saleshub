'use client'

import 'ol/ol.css'

import BaseMap from './BaseMap'
import { markerIcon } from './function'
import Feature from 'ol/Feature'
import Point from 'ol/geom/Point'
import VectorLayer from 'ol/layer/Vector'
import { fromLonLat } from 'ol/proj'
import VectorSource from 'ol/source/Vector'
import Icon from 'ol/style/Icon'
import Style from 'ol/style/Style'
import { useMemo } from 'react'

type Props = {
  lat: number
  lng: number
  width?: number | string
  height?: number | string
  className?: string
  zoom?: number
}
const MapPreview = (props: Props) => {
  const { lat, lng, width = 320, height = 320, className, zoom = 12 } = props

  const layer = useMemo(() => {
    const coordinate = fromLonLat([lng, lat])
    const marker = new Feature({ geometry: new Point(coordinate) })
    marker.setStyle(
      new Style({
        image: new Icon({
          src: markerIcon,
          anchor: [0.5, 1],
          anchorXUnits: 'fraction',
          anchorYUnits: 'fraction',
          scale: 1,
        }),
      })
    )
    return new VectorLayer({
      source: new VectorSource({ features: [marker] }),
    })
  }, [lat, lng])

  return (
    <div className={`rounded-xl border border-gray-200 bg-white ${className ?? ''}`}>
      <BaseMap
        center={[lng, lat]}
        zoom={zoom}
        layer={layer}
        style={{ width, height, maxWidth: '100%' }}
      />
    </div>
  )
}

export default MapPreview
