import { useState, useRef, useEffect } from 'react'

function ImageColorExtractor({ onColorsExtracted }) {
  const [image, setImage] = useState(null)
  const [selectedPoints, setSelectedPoints] = useState([])
  const canvasRef = useRef(null)
  const imageRef = useRef(null)
  const containerRef = useRef(null)

  const handleImageLoad = (e) => {
    const img = e.target
    imageRef.current = img
    drawImage()
  }

  const drawImage = () => {
    if (!imageRef.current || !canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const container = containerRef.current
    const containerRect = container.getBoundingClientRect()

    // Set canvas size to match container while maintaining aspect ratio
    const imgAspectRatio = imageRef.current.naturalWidth / imageRef.current.naturalHeight
    const containerAspectRatio = containerRect.width / containerRect.height

    let width, height
    if (imgAspectRatio > containerAspectRatio) {
      width = containerRect.width
      height = width / imgAspectRatio
    } else {
      height = containerRect.height
      width = height * imgAspectRatio
    }

    canvas.width = width
    canvas.height = height

    // Draw image
    ctx.drawImage(imageRef.current, 0, 0, width, height)

    // Draw selected points
    selectedPoints.forEach(point => {
      ctx.beginPath()
      ctx.arc(point.x, point.y, 10, 0, 2 * Math.PI)
      ctx.strokeStyle = 'white'
      ctx.lineWidth = 2
      ctx.stroke()
      ctx.fillStyle = point.color
      ctx.fill()
    })
  }

  const handleCanvasClick = (e) => {
    if (!canvasRef.current) return
    if (selectedPoints.length >= 5) return

    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const ctx = canvas.getContext('2d')
    const pixel = ctx.getImageData(x, y, 1, 1).data
    const color = `#${[pixel[0], pixel[1], pixel[2]].map(x => x.toString(16).padStart(2, '0')).join('')}`

    const newPoint = { x, y, color }
    const newPoints = [...selectedPoints, newPoint]
    setSelectedPoints(newPoints)
    onColorsExtracted(newPoints.map(p => ({ hex: p.color, locked: false })))

    drawImage()
  }

  const handleDrop = (e) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file && file.type.startsWith('image/')) {
      handleFile(file)
    }
  }

  const handleFile = (file) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      setImage(e.target.result)
      setSelectedPoints([])
    }
    reader.readAsDataURL(file)
  }

  useEffect(() => {
    if (image) {
      const img = new Image()
      img.src = image
      img.onload = handleImageLoad
    }
  }, [image])

  useEffect(() => {
    drawImage()
  }, [selectedPoints])

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-full rounded-xl overflow-hidden bg-white dark:bg-[#161B22]"
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
    >
      {!image ? (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <input
              type="file"
              id="imageInput"
              className="hidden"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files[0]
                if (file) handleFile(file)
              }}
            />
            <button
              onClick={() => document.getElementById('imageInput').click()}
              className="px-6 py-3 bg-[#2F81F7] text-white rounded-lg hover:bg-[#2871DB] transition-colors"
            >
              Upload an image
            </button>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              or drag and drop it here
            </p>
          </div>
        </div>
      ) : (
        <canvas
          ref={canvasRef}
          onClick={handleCanvasClick}
          className="w-full h-full cursor-crosshair"
        />
      )}
    </div>
  )
}

export default ImageColorExtractor 