import TileLayer from 'ol/layer/Tile'
import Map from 'ol/Map'
import { fromLonLat } from 'ol/proj'
import OSM from 'ol/source/OSM'
import View from 'ol/View'
import { useEffect, useRef } from 'react'

export const useOpenLayersMap = (
  mapRef: React.RefObject<HTMLDivElement | null>,
  center?: [number, number],
  zoom = 2
) => {
  const mapInstanceRef = useRef<Map | null>(null)

  useEffect(() => {
    if (!mapRef.current) return
    if (mapInstanceRef.current) return

    const view = new View({ zoom })

    const map = new Map({
      target: mapRef.current,
      layers: [new TileLayer({ source: new OSM() })],
      view,
    })

    mapInstanceRef.current = map

    const observer = new ResizeObserver(() => {
      map.updateSize()
    })
    observer.observe(mapRef.current)

    return () => {
      observer.disconnect()
      map.setTarget(undefined)
      mapInstanceRef.current = null
    }
  }, [])

  useEffect(() => {
    const map = mapInstanceRef.current
    if (!map) return

    if (center) {
      map.getView().setCenter(fromLonLat(center))
    }

    map.getView().setZoom(zoom)
  }, [center?.[0], center?.[1], zoom])

  return mapInstanceRef
}
