import { useEffect, useRef } from 'react'

const ColorWheel = ({ onColorSelect }) => {
  const canvasRef = useRef(null)
  const isDraggingRef = useRef(false)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const centerX = canvas.width / 2
    const centerY = canvas.height / 2
    const radius = Math.min(centerX, centerY) - 5

    // Draw color wheel with smoother gradient
    for (let angle = 0; angle < 360; angle += 0.5) {
      const startAngle = (angle - 1) * Math.PI / 180
      const endAngle = (angle + 1) * Math.PI / 180

      ctx.beginPath()
      ctx.moveTo(centerX, centerY)
      ctx.arc(centerX, centerY, radius, startAngle, endAngle)
      ctx.closePath()

      const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius)
      gradient.addColorStop(0, 'white')
      gradient.addColorStop(0.5, `hsl(${angle}, 100%, 50%)`)
      gradient.addColorStop(1, 'black')

      ctx.fillStyle = gradient
      ctx.fill()
    }

    // Add inner white circle for better UX
    ctx.beginPath()
    ctx.arc(centerX, centerY, radius * 0.1, 0, Math.PI * 2)
    ctx.fillStyle = 'white'
    ctx.fill()
    ctx.strokeStyle = '#21262D'
    ctx.lineWidth = 2
    ctx.stroke()
  }, [])

  const getColorFromPoint = (x, y) => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const imageData = ctx.getImageData(x, y, 1, 1).data
    const [r, g, b] = imageData
    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase()}`
  }

  const handleInteraction = (e) => {
    if (!isDraggingRef.current) return

    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const color = getColorFromPoint(x, y)
    onColorSelect(color)
  }

  return (
    <canvas
      ref={canvasRef}
      width={280}
      height={280}
      className="cursor-crosshair rounded-full shadow-lg"
      onMouseDown={() => isDraggingRef.current = true}
      onMouseUp={() => isDraggingRef.current = false}
      onMouseLeave={() => isDraggingRef.current = false}
      onMouseMove={handleInteraction}
    />
  )
}

export default ColorWheel 