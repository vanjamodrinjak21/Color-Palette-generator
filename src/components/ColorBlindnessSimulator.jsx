import { useState } from 'react'

const ColorBlindnessSimulator = ({ color }) => {
  const [mode, setMode] = useState('normal')

  const simulateColorBlindness = (hex, type) => {
    // Convert hex to RGB
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)

    // Simulation matrices from https://www.color-blindness.com/
    const matrices = {
      protanopia: [ // Red-blind
        [0.567, 0.433, 0],
        [0.558, 0.442, 0],
        [0, 0.242, 0.758]
      ],
      deuteranopia: [ // Green-blind
        [0.625, 0.375, 0],
        [0.7, 0.3, 0],
        [0, 0.3, 0.7]
      ],
      tritanopia: [ // Blue-blind
        [0.95, 0.05, 0],
        [0, 0.433, 0.567],
        [0, 0.475, 0.525]
      ]
    }

    if (type === 'normal') return hex

    const matrix = matrices[type]
    const newR = Math.round(r * matrix[0][0] + g * matrix[0][1] + b * matrix[0][2])
    const newG = Math.round(r * matrix[1][0] + g * matrix[1][1] + b * matrix[1][2])
    const newB = Math.round(r * matrix[2][0] + g * matrix[2][1] + b * matrix[2][2])

    return `#${((1 << 24) + (newR << 16) + (newG << 8) + newB).toString(16).slice(1).toUpperCase()}`
  }

  return (
    <div className="flex gap-1">
      {['normal', 'protanopia', 'deuteranopia', 'tritanopia'].map(type => (
        <button
          key={type}
          onClick={() => setMode(type)}
          className={`flex-1 h-6 rounded transition-transform hover:scale-95 ${
            mode === type ? 'ring-1 ring-[#2F81F7]' : ''
          }`}
          style={{ 
            backgroundColor: simulateColorBlindness(color, type),
          }}
          title={type.charAt(0).toUpperCase() + type.slice(1)}
        />
      ))}
    </div>
  )
}

export default ColorBlindnessSimulator 