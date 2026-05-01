import { Card } from 'primereact/card'
import { Skeleton } from 'primereact/skeleton'

type SkeletonLoaderProps = {
  type: 'circle' | 'rect' | 'chart-vertical' | 'chart-horizontal'
}

const SkeletonLoader = ({ type }: SkeletonLoaderProps) => {
  if (type === 'circle') {
    return (
      <Card className="text-center">
        <Skeleton width="60%" height="1.2rem" className="mx-auto mb-2" />
        <Skeleton width="80%" height="0.8rem" className="mx-auto mb-3" />

        <div className="flex justify-content-center">
          <Skeleton shape="circle" size="200px" />
        </div>
      </Card>
    )
  }

  if (type === 'chart-vertical') {
    const heights = [60, 80, 40, 90, 50, 70, 60, 80, 40, 90, 50, 70]

    return (
      <Card className="text-center w-full h-full">
        <div
          className="flex align-items-end justify-content-between gap-2 px-2"
          style={{ height: 250 }}
        >
          {heights.map((h, i) => (
            <Skeleton key={i} width="10%" height={`${h}%`} borderRadius="6px" />
          ))}
        </div>
      </Card>
    )
  }

  if (type === 'chart-horizontal') {
    const widths = [70, 50, 90, 40, 80]

    return (
      <Card className="text-center w-full h-full">
        <div className="flex flex-column gap-3 px-2">
          {widths.map((w, i) => (
            <div key={i} className="flex align-items-center gap-2">
              {/* label fake */}
              <Skeleton width={`${w}%`} height="2rem" borderRadius="6px" />
            </div>
          ))}
        </div>
      </Card>
    )
  }

  // default rect
  return (
    <Card className="text-center w-full h-full">
      <Skeleton width="60%" height="1.2rem" className="mx-auto mb-2" />
      <Skeleton width="80%" height="0.8rem" className="mx-auto mb-3" />

      <div className="flex justify-content-center">
        <Skeleton width="100%" height="120px" borderRadius="12px" />
      </div>
    </Card>
  )
}

export default SkeletonLoader
