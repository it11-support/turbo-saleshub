import { boundingExtent } from 'ol/extent'
import Feature from 'ol/Feature'
import { Point } from 'ol/geom'
import Map from 'ol/Map'
import { useEffect, useRef } from 'react'

type UseClusterInteractionOptions = {
  mapInstanceRef: React.RefObject<Map | null>
  onFeatureClick?: (feature: Feature<Point>, coordinate: [number, number]) => void
  onClusterClick?: (features: Feature<Point>[], coordinate: [number, number]) => void
  onEmptyClick?: () => void
  maxZoom?: number
}

const useClusterInteraction = (
  {
    mapInstanceRef,
    onFeatureClick,
    onClusterClick,
    onEmptyClick,
    maxZoom = 22,
  }: UseClusterInteractionOptions = {} as UseClusterInteractionOptions
) => {
  const handlersRef = useRef({ onFeatureClick, onClusterClick, onEmptyClick, maxZoom })

  useEffect(() => {
    handlersRef.current = { onFeatureClick, onClusterClick, onEmptyClick, maxZoom }
  })

  useEffect(() => {
    const map = mapInstanceRef.current
    if (!map) return

    const singleClickHandler = (event: any) => {
      const feature = map.forEachFeatureAtPixel(event.pixel, (feature) => feature) as
        Feature<Point> | undefined

      if (!feature) {
        handlersRef.current.onEmptyClick?.()
        return
      }

      const features = feature.get('features') as Feature<Point>[]

      if (!features?.length) return

      if (features.length > 1) {
        const extent = boundingExtent(
          features.map((f) => (f.getGeometry() as Point).getCoordinates())
        )
        map.getView().fit(extent, {
          padding: [80, 80, 80, 80],
          duration: 300,
          maxZoom: handlersRef.current.maxZoom,
        })

        handlersRef.current.onClusterClick?.(features, [
          extent[0] / 2 + extent[2] / 2,
          extent[1] / 2 + extent[3] / 2,
        ])
        return
      }

      const singleFeature = features[0]
      const coordinate = (singleFeature.getGeometry() as Point).getCoordinates() as [number, number]

      handlersRef.current.onFeatureClick?.(singleFeature, coordinate)
    }

    const pointerMoveHandler = (event: any) => {
      const hit = map.hasFeatureAtPixel(event.pixel)
      map.getTargetElement().style.cursor = hit ? 'pointer' : ''
    }

    map.on('singleclick', singleClickHandler)
    map.on('pointermove', pointerMoveHandler)

    return () => {
      map.un('singleclick', singleClickHandler)
      map.un('pointermove', pointerMoveHandler)
    }
  }, [mapInstanceRef])
}

export default useClusterInteraction
