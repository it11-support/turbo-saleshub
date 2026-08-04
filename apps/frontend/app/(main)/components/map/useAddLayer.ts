import Layer from 'ol/layer/Layer'
import Map from 'ol/Map'
import Source from 'ol/source/Source'
import { useEffect } from 'react'

export const useAddLayer = <T extends Source = Source>(
  mapInstanceRef: React.RefObject<Map | null>,
  layer: Layer<T> | readonly Layer<T>[] | null
) => {
  useEffect(() => {
    const map = mapInstanceRef.current
    if (!map) return

    const layers = Array.isArray(layer) ? layer : layer ? [layer] : []

    layers.forEach((l) => map.addLayer(l))

    return () => {
      layers.forEach((l) => map.removeLayer(l))
    }
  }, [mapInstanceRef, layer])
}
