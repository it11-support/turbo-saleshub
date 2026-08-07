import { getMarkerIcon } from './function'
import { IVisit } from '@saleshub-tsm/types'
import Feature from 'ol/Feature'
import { Point } from 'ol/geom'
import Circle from 'ol/geom/Circle'
import VectorLayer from 'ol/layer/Vector'
import { fromLonLat } from 'ol/proj'
import Cluster from 'ol/source/Cluster'
import VectorSource from 'ol/source/Vector'
import CircleStyle from 'ol/style/Circle'
import Fill from 'ol/style/Fill'
import Icon from 'ol/style/Icon'
import Stroke from 'ol/style/Stroke'
import Style from 'ol/style/Style'
import Text from 'ol/style/Text'
import { useMemo } from 'react'

export type ClusterItem = {
  lat: number
  lng: number
  accuracy?: number
  [key: string]: any
}

type Props = {
  items: any[]
  distance?: number
  clusterColor?: string
}

const useClusterLayer = ({ items, distance = 20, clusterColor = '#2563eb' }: Props) => {
  const iconCache = new Map<string, Icon>()
  const getCachedIcon = (item: IVisit) => {
    const src = getMarkerIcon(item)

    let icon = iconCache.get(src)

    if (!icon) {
      icon = new Icon({
        src,
        anchor: [0.5, 1],
        anchorXUnits: 'fraction',
        anchorYUnits: 'fraction',
        scale: 1,
      })

      iconCache.set(src, icon)
    }

    return icon
  }

  return useMemo(() => {
    if (!items?.length) return null

    const features = items.map((item) => {
      const feature = new Feature({
        geometry: new Point(fromLonLat([Number(item.lng), Number(item.lat)])),
      })
      feature.set('data', item)

      return feature
    })

    const vectorSource = new VectorSource({
      features,
    })
    const clusterSource = new Cluster({
      distance,
      source: vectorSource,
    })

    const clusterLayer = new VectorLayer({
      source: clusterSource,
      style: (feature) => {
        const size = feature.get('features').length

        if (size === 1) {
          const item = feature.get('features')[0].get('data')
          const pointFeature = feature.get('features')[0]
          const coordinate = (pointFeature.getGeometry() as Point).getCoordinates()

          const styles = [
            new Style({
              image: getCachedIcon(item),
              text: new Text({
                text: item.customer.CardName || '',
                fill: new Fill({
                  color: '#1f2937',
                }),
                font: 'bold 10px sans-serif',
                textAlign: 'center',
                offsetY: -38,
              }),
            }),
          ]

          if (item.accuracy && item.accuracy > 0) {
            styles.unshift(
              new Style({
                geometry: new Circle(coordinate, Number(item.accuracy)),
                stroke: new Stroke({
                  color: 'rgba(59, 130, 246, 0.8)',
                  width: 2,
                }),
                fill: new Fill({
                  color: 'rgba(59, 130, 246, 0.2)',
                }),
              })
            )
          }

          return styles
        }

        return new Style({
          image: new CircleStyle({
            radius: Math.max(12, Math.min(size, 30)),
            fill: new Fill({
              color: clusterColor,
            }),
            stroke: new Stroke({
              color: '#fff',
              width: 2,
            }),
          }),
          text: new Text({
            text: String(size),
            fill: new Fill({
              color: '#fff',
            }),
          }),
        })
      },
    })

    return clusterLayer
  }, [items, distance, clusterColor])
}

export default useClusterLayer
