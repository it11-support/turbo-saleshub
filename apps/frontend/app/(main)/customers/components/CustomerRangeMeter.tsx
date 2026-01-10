'use client'

import React from 'react'

interface CustomMeterBarProps {
  value: number
  width?: number
  height?: number
}

const CustomMeterBar: React.FC<CustomMeterBarProps> = ({ value, width = 200, height = 10 }) => {
  const getColor = (val: number) => {
    if (val <= 10) return '#FF0000'
    if (val <= 20) return '#FF4B4B'
    if (val <= 30) return '#FFA500'
    if (val <= 40) return '#FFD93D'
    if (val <= 50) return '#90EE90'
    return '#27AE60'
  }

  const segments = 6 // 10,20,30,40,50
  const segmentWidth = width / segments

  const radius = height / 2
  const markerX = Math.min(width, (value / 50) * width)

  return (
    <div className="flex">
      <svg width={width + 100} height={height + 20}>
        <rect
          width={width}
          height={height + 2}
          fill="white"
          stroke="gray"
          strokeWidth={1}
          rx={radius}
          ry={radius}
        />

        {Array.from({ length: segments }).map((_, i) => {
          const segmentValue = (i + 1) * 10
          const segmentColor = getColor(segmentValue)

          const segX = i * segmentWidth

          // Jika segmen berada *setelah* marker, warnai abu-abu
          const finalColor = segX >= markerX ? '#D3D3D3' : segmentColor

          return (
            <rect
              key={i}
              x={segX}
              y={0}
              width={segmentWidth}
              height={height + 2}
              fill={finalColor}
            />
          )
        })}

        <line x1={markerX} y1={-2} x2={markerX} y2={height + 4} stroke="black" strokeWidth={2} />
        <text
          x={width + 10}
          y={(height + 2) / 2}
          dominantBaseline="middle"
          textAnchor="start"
          fontSize="12"
          fill="var(--text-color)"
        >
          {value} items
        </text>
      </svg>
    </div>
  )
}

export default CustomMeterBar
