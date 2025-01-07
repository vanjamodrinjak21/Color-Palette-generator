import { useState } from 'react'
import { ClipboardIcon } from '@heroicons/react/24/outline'

function GradientGenerator({ colors }) {
  const [gradientType, setGradientType] = useState('linear')
  const [direction, setDirection] = useState('to right')
  const [position, setPosition] = useState('center')
  const [copied, setCopied] = useState(false)

  const linearDirections = [
    { value: 'to right', label: 'Horizontal →' },
    { value: 'to left', label: '← Horizontal' },
    { value: 'to bottom', label: 'Vertical ↓' },
    { value: 'to top', label: '↑ Vertical' },
    { value: 'to bottom right', label: 'Diagonal ↘' },
    { value: 'to bottom left', label: '↙ Diagonal' },
    { value: 'to top right', label: '↗ Diagonal' },
    { value: 'to top left', label: '↖ Diagonal' }
  ]

  const radialPositions = [
    { value: 'center', label: 'Center' },
    { value: 'top', label: 'Top' },
    { value: 'right', label: 'Right' },
    { value: 'bottom', label: 'Bottom' },
    { value: 'left', label: 'Left' },
    { value: 'top right', label: 'Top Right' },
    { value: 'top left', label: 'Top Left' },
    { value: 'bottom right', label: 'Bottom Right' },
    { value: 'bottom left', label: 'Bottom Left' }
  ]

  const getGradientStyle = () => {
    const colorStops = colors.map(c => c.hex).join(', ')
    switch (gradientType) {
      case 'linear':
        return `linear-gradient(${direction}, ${colorStops})`
      case 'radial':
        return `radial-gradient(circle at ${position}, ${colorStops})`
      case 'conic':
        return `conic-gradient(from 0deg at ${position}, ${colorStops})`
      default:
        return `linear-gradient(${direction}, ${colorStops})`
    }
  }

  const gradientStyle = {
    background: getGradientStyle()
  }

  const gradientCSS = `background: ${getGradientStyle()};`

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(gradientCSS)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex border-b border-gray-200 dark:border-gray-700 mb-4">
        {['linear', 'radial', 'conic'].map(type => (
          <button
            key={type}
            onClick={() => setGradientType(type)}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors relative ${
              gradientType === type
                ? 'text-[#2F81F7] border-b-2 border-[#2F81F7]'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            {type.charAt(0).toUpperCase() + type.slice(1)}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {gradientType === 'linear' ? (
          linearDirections.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setDirection(value)}
              className={`px-3 py-1.5 rounded text-sm transition-all ${
                direction === value
                  ? 'bg-[#2F81F7] text-white hover:bg-[#2871DB]'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/80'
              }`}
            >
              {label}
            </button>
          ))
        ) : (
          radialPositions.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setPosition(value)}
              className={`px-3 py-1.5 rounded text-sm transition-all ${
                position === value
                  ? 'bg-[#2F81F7] text-white hover:bg-[#2871DB]'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/80'
              }`}
            >
              {label}
            </button>
          ))
        )}
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Preview</h3>
          <button
            onClick={copyToClipboard}
            className="flex items-center gap-1.5 px-2 py-1 text-xs rounded bg-gray-100 dark:bg-gray-700/50 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600/50 transition-colors"
          >
            <ClipboardIcon className="h-3.5 w-3.5" />
            {copied ? 'Copied!' : 'Copy CSS'}
          </button>
        </div>

        <div className="relative rounded-lg overflow-hidden">
          <div className="grid grid-cols-5 gap-1 mb-1">
            {colors.map((color, index) => (
              <div
                key={index}
                className="h-12 first:rounded-l-lg last:rounded-r-lg"
                style={{ backgroundColor: color.hex }}
              />
            ))}
          </div>
          <div
            className="h-32 rounded-lg transition-all duration-300"
            style={gradientStyle}
          />
        </div>

        <div className="bg-gray-50 dark:bg-[#0D1117] rounded p-3 font-mono text-sm text-gray-800 dark:text-gray-200">
          {gradientCSS}
        </div>
      </div>
    </div>
  )
}

export default GradientGenerator 