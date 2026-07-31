'use client'

import 'ol/ol.css'

import BaseMap from './BaseMap'
import { getMarkerIcon } from './function'
import Feature from 'ol/Feature'
import Circle from 'ol/geom/Circle'
import Point from 'ol/geom/Point'
import VectorLayer from 'ol/layer/Vector'
import { fromLonLat } from 'ol/proj'
import VectorSource from 'ol/source/Vector'
import Fill from 'ol/style/Fill'
import Icon from 'ol/style/Icon'
import Stroke from 'ol/style/Stroke'
import Style from 'ol/style/Style'
import { useMemo } from 'react'

type Props = {
  lat: number
  lng: number
  width?: number | string
  height?: number | string
  className?: string
  zoom?: number
  accuracy?: number
}
const MapPreview = (props: Props) => {
  const { lat, lng, width = 320, height = 320, className, zoom = 12, accuracy } = props

  const layer = useMemo(() => {
    const coordinate = fromLonLat([lng, lat])
    const marker = new Feature({ geometry: new Point(coordinate) })
    marker.setStyle(
      new Style({
        image: new Icon({
          src: getMarkerIcon(),
          anchor: [0.5, 1],
          anchorXUnits: 'fraction',
          anchorYUnits: 'fraction',
          scale: 1,
        }),
      })
    )

    const features = [marker] as Feature<Point | Circle>[]

    if (accuracy != null && accuracy > 0) {
      const accuracyCircle = new Feature({ geometry: new Circle(coordinate, accuracy) })
      accuracyCircle.setStyle(
        new Style({
          stroke: new Stroke({
            color: 'rgba(59, 130, 246, 0.8)',
            width: 2,
          }),
          fill: new Fill({
            color: 'rgba(59, 130, 246, 0.2)',
          }),
        })
      )
      features.push(accuracyCircle)
    }

    return new VectorLayer({
      source: new VectorSource({ features }),
    })
  }, [lat, lng, accuracy])

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
