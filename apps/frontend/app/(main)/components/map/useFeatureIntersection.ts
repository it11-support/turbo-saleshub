import Feature from 'ol/Feature'
import Point from 'ol/geom/Point'
import Map from 'ol/Map'
import { useEffect } from 'react'

type Props = {
  mapInstanceRef: React.RefObject<Map | null>
  onFeatureHover?: (feature: Feature, coordinate: [number, number]) => void
  onEmptyHover?: () => void
}

const useFeatureInteraction = ({ mapInstanceRef, onFeatureHover, onEmptyHover }: Props) => {
  useEffect(() => {
    const map = mapInstanceRef.current
    if (!map) return

    const handlePointerMove = (e: any) => {
      const feature = map.forEachFeatureAtPixel(e.pixel, (f) => f as Feature)

      map.getTargetElement().style.cursor = feature ? 'pointer' : ''

      if (!feature) {
        onEmptyHover?.()
        return
      }

      const coordinate = (feature.getGeometry() as Point).getCoordinates() as [number, number]

      onFeatureHover?.(feature, coordinate)
    }

    map.on('pointermove', handlePointerMove)

    return () => {
      map.un('pointermove', handlePointerMove)
    }
  }, [mapInstanceRef, onFeatureHover, onEmptyHover])
}

export default useFeatureInteraction
