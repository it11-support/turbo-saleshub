'use client'

import React from 'react'
import GaugeComponent from 'react-gauge-component'

interface CustomMeterBarProps {
  value: number
  width?: number
}

const CustomMeterBar: React.FC<CustomMeterBarProps> = ({ value, width = 300 }) => {
  return (
    <div className="flex">
      <GaugeComponent
        style={{ maxWidth: width }}
        value={value}
        type="semicircle"
        minValue={0}
        maxValue={150}
        arc={{
          width: 0.2,
          cornerRadius: 0,
          padding: 0,
          subArcsStrokeWidth: 1,
          subArcsStrokeColor: '#000000',
          // Hapus nbSubArcs dan colorArray, ganti dengan subArcs
          subArcs: [
            { limit: 10, color: '#FF0000' }, // val <= 10
            { limit: 20, color: '#FF4B4B' }, // val <= 20
            { limit: 30, color: '#FFA500' }, // val <= 30
            { limit: 40, color: '#FFD93D' }, // val <= 40
            { limit: 50, color: '#90EE90' }, // val <= 50
            { color: '#27AE60' }, // Sisa rentang hingga 108
          ],
          effects: { glow: true, glowBlur: 1, glowSpread: 2 },
        }}
        pointer={{
          type: 'blob',
          elastic: false,
          animationDelay: 100,
          animationDuration: 1000,
          length: 0.87,
          width: 12,
          baseColor: '#ffffff',
          strokeWidth: 1,
          strokeColor: '#000000',
          maxFps: 30,
          animationThreshold: 0.0096,
        }}
        labels={{
          valueLabel: {
            matchColorWithArc: true,
            style: { fontSize: '20px', fontWeight: 'bold' },
            offsetY: 15,
            animateValue: false,
            formatTextValue: (val) => val,
          },
          tickLabels: {
            type: 'outer',
            hideMinMax: false,
            autoSpaceTickLabels: true,
            ticks: [{ value: 0 }, { value: 100 }],
            defaultTickValueConfig: {
              formatTextValue: (val) => val,
            },
          },
        }}
      />
    </div>
  )
}

export default CustomMeterBar
