import { IGeoLocation } from '@saleshub-tsm/types'
const R = 6371000
export const getCurrentLocation = async (): Promise<IGeoLocation> => {
  if (!navigator.geolocation) {
    throw new Error('Geolocation is not supported by this browser.')
  }

  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        resolve({
          latitude: coords.latitude,
          longitude: coords.longitude,
          accuracy: coords.accuracy,
        })
      },
      reject,
      {
        enableHighAccuracy: true,
        timeout: 30000,
        maximumAge: 60000,
      }
    )
  })
}

export const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number) => {
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  const d = R * c
  return d
}
