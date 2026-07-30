import Map from 'ol/Map'
import Overlay, { Positioning } from 'ol/Overlay'
import { useCallback, useEffect, useRef } from 'react'

type UseMapOverlayOptions = {
  positioning?: Positioning
  offset?: [number, number]
}

type UseMapOverlayReturn = {
  popupRef: React.RefObject<HTMLDivElement | null>
  showOverlay: (coordinate: [number, number]) => void
  hideOverlay: () => void
}

const useMapOverlay = (
  mapInstanceRef: React.RefObject<Map | null>,
  { positioning = 'bottom-center', offset = [0, -40] }: UseMapOverlayOptions = {}
): UseMapOverlayReturn => {
  const popupRef = useRef<HTMLDivElement>(null)
  const overlayRef = useRef<Overlay | null>(null)

  useEffect(() => {
    const map = mapInstanceRef.current
    if (!map || !popupRef.current) return

    const overlay = new Overlay({
      element: popupRef.current,
      positioning,
      offset,
    })

    overlayRef.current = overlay
    map.addOverlay(overlay)

    return () => {
      map.removeOverlay(overlay)
      overlayRef.current = null
    }
  }, [mapInstanceRef, positioning, offset])

  const showOverlay = useCallback((coordinate: [number, number]) => {
    const overlay = overlayRef.current
    if (!overlay || !popupRef.current) return

    overlay.setPosition(coordinate)
    popupRef.current.style.display = 'block'
  }, [])

  const hideOverlay = useCallback(() => {
    const overlay = overlayRef.current
    if (!overlay) return

    overlay.setPosition(undefined)
    if (popupRef.current) {
      popupRef.current.style.display = 'none'
    }
  }, [])

  return { popupRef, showOverlay, hideOverlay }
}

export default useMapOverlay
