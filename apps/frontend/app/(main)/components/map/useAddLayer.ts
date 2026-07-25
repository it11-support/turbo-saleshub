import Layer from 'ol/layer/Layer'
import Map from 'ol/Map'
import { useEffect } from 'react'

export const useAddLayer = (
  mapInstanceRef: React.RefObject<Map | null>,
  layer: Layer<any> | null
) => {
  useEffect(() => {
    const map = mapInstanceRef.current
    if (!map || !layer) return

    map.addLayer(layer)

    return () => {
      map.removeLayer(layer)
    }
  }, [mapInstanceRef, layer])
}
