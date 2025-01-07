import { useState, useEffect } from 'react'
import { LockClosedIcon, LockOpenIcon, ClipboardIcon, SunIcon, MoonIcon, HeartIcon, CodeBracketIcon, EyeIcon, SwatchIcon } from '@heroicons/react/24/solid'
import { HeartIcon as HeartOutlineIcon } from '@heroicons/react/24/outline'
import ImageColorExtractor from './components/ImageColorExtractor'
import ColorWheel from './components/ColorWheel'
import ColorBlindnessSimulator from './components/ColorBlindnessSimulator'
import Toast from './components/Toast'
import { generateColorName } from './utils/colorNames'
import GradientGenerator from './components/GradientGenerator'
import AccessibilityScore from './components/AccessibilityScore'
import PaletteHistory from './components/PaletteHistory'

function App() {
  const [colors, setColors] = useState(Array(5).fill(null).map(() => ({
    hex: '#FAFAFA',
    locked: false,
    textBg: false,
    sampleText: ''
  })))
  const [colorMode, setColorMode] = useState('analogous')
  const [darkMode, setDarkMode] = useState(false)
  const [savedPalettes, setSavedPalettes] = useState([])
  const [showExportModal, setShowExportModal] = useState(false)
  const [showSavedPalettes, setShowSavedPalettes] = useState(false)
  const [showColorWheel, setShowColorWheel] = useState(false)
  const [activeColorIndex, setActiveColorIndex] = useState(null)
  const [toast, setToast] = useState(null)
  const [history, setHistory] = useState([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const [showGradient, setShowGradient] = useState(false)
  const [colorCount, setColorCount] = useState(5)
  const [currentPage, setCurrentPage] = useState('palette')
  const [activeExportTab, setActiveExportTab] = useState('css')

  // Load saved palettes from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('savedPalettes')
    if (saved) {
      setSavedPalettes(JSON.parse(saved))
    }
    
    // Check system dark mode preference
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setDarkMode(true)
      document.documentElement.classList.add('dark')
    }
  }, [])

  // Save palettes to localStorage when updated
  useEffect(() => {
    localStorage.setItem('savedPalettes', JSON.stringify(savedPalettes))
  }, [savedPalettes])

  // Convert hex to HSL for better color manipulation
  const hexToHSL = (hex) => {
    let r = parseInt(hex.slice(1, 3), 16) / 255
    let g = parseInt(hex.slice(3, 5), 16) / 255
    let b = parseInt(hex.slice(5, 7), 16) / 255

    let max = Math.max(r, g, b)
    let min = Math.min(r, g, b)
    let h, s, l = (max + min) / 2

    if (max === min) {
      h = s = 0
    } else {
      let d = max - min
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break
        case g: h = (b - r) / d + 2; break
        case b: h = (r - g) / d + 4; break
      }
      h /= 6
    }

    return { h: h * 360, s: s * 100, l: l * 100 }
  }

  // Convert HSL to hex
  const HSLToHex = (h, s, l) => {
    s /= 100
    l /= 100
    const k = n => (n + h / 30) % 12
    const a = s * Math.min(l, 1 - l)
    const f = n =>
      l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)))
    
    const toHex = (x) => {
      const hex = Math.round(x * 255).toString(16)
      return hex.length === 1 ? '0' + hex : hex
    }
    
    return `#${toHex(f(0))}${toHex(f(8))}${toHex(f(4))}`.toUpperCase()
  }

  // Improve color generation logic
  const generateRandomColor = () => {
    const h = Math.random() * 360
    const s = 70 + Math.random() * 20 // 70-90% saturation for vibrant colors
    const l = 45 + Math.random() * 10 // 45-55% lightness for good contrast
    return HSLToHex(h, s, l)
  }

  const generateNewPalette = () => {
    // If all colors are locked, do nothing
    if (colors.every(c => c.locked)) return

    // Find first unlocked color to use as base, or generate new one
    const baseColorIndex = colors.findIndex(c => c.locked)
    const baseColor = baseColorIndex !== -1 
      ? hexToHSL(colors[baseColorIndex].hex)
      : { h: Math.random() * 360, s: 80, l: 50 }

    const newColors = generateColorsByMode(baseColor)
    
    setColors(prevColors => 
      prevColors.map((color, i) => 
        color.locked ? color : { 
          ...color,
          hex: newColors[i]
        }
      )
    )

    // Add to history
    const newHistory = [...history.slice(0, historyIndex + 1), colors]
    setHistory(newHistory)
    setHistoryIndex(newHistory.length - 1)
  }

  // Improve color mode generation
  const generateColorsByMode = (baseColor) => {
    const hsl = typeof baseColor === 'object' ? baseColor : hexToHSL(baseColor)
    const colors = []

    switch (colorMode) {
      case 'analogous':
        const angleStep = 30 / (colorCount - 1)
        const startAngle = -15
        for (let i = 0; i < colorCount; i++) {
          const h = (hsl.h + startAngle + i * angleStep + 360) % 360
          colors.push(HSLToHex(h, hsl.s, hsl.l))
        }
        break

      case 'monochromatic':
        for (let i = 0; i < colorCount; i++) {
          const l = 30 + (i * (40 / (colorCount - 1)))
          const s = Math.min(100, hsl.s + (i - (colorCount - 1) / 2) * 5)
          colors.push(HSLToHex(hsl.h, s, l))
        }
        break

      case 'triad':
        const triadAngles = [0, 120, 240]
        for (let i = 0; i < colorCount; i++) {
          const baseIndex = Math.floor(i * 3 / colorCount)
          const nextIndex = (baseIndex + 1) % 3
          const progress = (i * 3 / colorCount) % 1
          const h = (hsl.h + triadAngles[baseIndex] * (1 - progress) + triadAngles[nextIndex] * progress) % 360
          colors.push(HSLToHex(h, hsl.s, hsl.l))
        }
        break

      case 'complementary':
        const complement = (hsl.h + 180) % 360
        for (let i = 0; i < colorCount; i++) {
          const progress = i / (colorCount - 1)
          const h = progress < 0.5
            ? hsl.h + (progress * 2) * 30
            : complement + ((progress - 0.5) * 2) * 30
          colors.push(HSLToHex(h % 360, hsl.s, hsl.l))
        }
        break

      case 'shades':
        for (let i = 0; i < colorCount; i++) {
          const l = 85 - (i * (60 / (colorCount - 1)))
          colors.push(HSLToHex(hsl.h, hsl.s, l))
        }
        break

      default:
        return Array(colorCount).fill(null).map(() => generateRandomColor())
    }

    return colors
  }

  // Improve color count change handler
  const handleColorCountChange = (newCount) => {
    const oldCount = colors.length
    let newColors = [...colors]

    if (newCount > oldCount) {
      // Add new colors
      const additionalColors = Array(newCount - oldCount).fill(null).map(() => ({
        hex: generateRandomColor(),
        locked: false,
        textBg: false,
        sampleText: ''
      }))
      newColors = [...colors, ...additionalColors]
    } else {
      // Remove colors from the end, preserving locked ones
      newColors = newColors.slice(0, newCount)
    }

    setColorCount(newCount)
    setColors(newColors)
  }

  // Improve clipboard copy with better feedback
  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text)
      showToast('Copied')
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  // Improve toast display
  const showToast = (message) => {
    setToast({ message })
    setTimeout(() => setToast(null), 2000)
  }

  // Add keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key === ' ') {
        generateNewPalette()
      } else if (e.ctrlKey || e.metaKey) {
        if (e.key === 'z') {
          if (e.shiftKey) {
            handleRedo()
          } else {
            handleUndo()
          }
        }
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [history, historyIndex])

  const toggleLock = (index) => {
    const newColors = [...colors]
    newColors[index].locked = !newColors[index].locked
    setColors(newColors)
  }

  const toggleDarkMode = () => {
    setDarkMode(!darkMode)
    document.documentElement.classList.toggle('dark')
  }

  const savePalette = () => {
    setSavedPalettes([...savedPalettes, colors])
  }

  const deletePalette = (index) => {
    setSavedPalettes(savedPalettes.filter((_, i) => i !== index))
  }

  const loadPalette = (palette) => {
    setColors(palette)
    setShowSavedPalettes(false)
  }

  const getContrastRatio = (hex) => {
    const rgb = hexToRGB(hex)
    const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255
    return luminance > 0.5 ? '#000000' : '#FFFFFF'
  }

  const hexToRGB = (hex) => {
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)
    return { r, g, b }
  }

  const exportPalette = (format) => {
    let output = ''
    const colorName = generateColorName(colors[0].hex).toLowerCase().replace(/\s+/g, '-')
    
    switch (format) {
      case 'css':
        output = `:root {\n`
        // Main colors
        colors.forEach((c, i) => {
          output += `  --color-${colorName}-${i + 1}: ${c.hex};\n`
        })
        // Variations for each color
        colors.forEach((c, i) => {
          const hsl = hexToHSL(c.hex)
          output += `\n  /* Variations for color ${i + 1} */\n`
          output += `  --color-${colorName}-${i + 1}-lightest: ${HSLToHex(hsl.h, hsl.s, 90)};\n`
          output += `  --color-${colorName}-${i + 1}-light: ${HSLToHex(hsl.h, hsl.s, 70)};\n`
          output += `  --color-${colorName}-${i + 1}-dark: ${HSLToHex(hsl.h, hsl.s, 30)};\n`
          output += `  --color-${colorName}-${i + 1}-darkest: ${HSLToHex(hsl.h, hsl.s, 10)};\n`
          
          // RGB values
          const rgb = hexToRGB(c.hex)
          output += `  --color-${colorName}-${i + 1}-rgb: ${rgb.r}, ${rgb.g}, ${rgb.b};\n`
        })
        output += `}\n\n`
        // Usage examples
        output += `/* Usage examples */\n`
        output += `.element {\n`
        output += `  color: var(--color-${colorName}-1);\n`
        output += `  background-color: var(--color-${colorName}-2);\n`
        output += `  border-color: var(--color-${colorName}-3);\n`
        output += `  /* With opacity */\n`
        output += `  background-color: rgba(var(--color-${colorName}-1-rgb), 0.5);\n`
        output += `}\n`
        break

      case 'scss':
        // Main colors as variables
        colors.forEach((c, i) => {
          output += `$color-${colorName}-${i + 1}: ${c.hex};\n`
        })
        output += '\n'
        // Color variations
        colors.forEach((c, i) => {
          const hsl = hexToHSL(c.hex)
          output += `// Variations for color ${i + 1}\n`
          output += `$color-${colorName}-${i + 1}-lightest: ${HSLToHex(hsl.h, hsl.s, 90)};\n`
          output += `$color-${colorName}-${i + 1}-light: ${HSLToHex(hsl.h, hsl.s, 70)};\n`
          output += `$color-${colorName}-${i + 1}-dark: ${HSLToHex(hsl.h, hsl.s, 30)};\n`
          output += `$color-${colorName}-${i + 1}-darkest: ${HSLToHex(hsl.h, hsl.s, 10)};\n\n`
        })
        // Color map
        output += '// Color map\n'
        output += `$${colorName}-colors: (\n`
        colors.forEach((c, i) => {
          const hsl = hexToHSL(c.hex)
          output += `  '${i + 1}': (\n`
          output += `    'base': ${c.hex},\n`
          output += `    'lightest': ${HSLToHex(hsl.h, hsl.s, 90)},\n`
          output += `    'light': ${HSLToHex(hsl.h, hsl.s, 70)},\n`
          output += `    'dark': ${HSLToHex(hsl.h, hsl.s, 30)},\n`
          output += `    'darkest': ${HSLToHex(hsl.h, hsl.s, 10)}\n`
          output += `  )${i < colors.length - 1 ? ',' : ''}\n`
        })
        output += ');\n\n'
        // Mixins and functions
        output += '// Helper function to get color\n'
        output += `@function ${colorName}-color($key, $variant: 'base') {\n`
        output += `  $color: map-get($${colorName}-colors, $key);\n`
        output += '  @return map-get($color, $variant);\n'
        output += '}\n\n'
        // Usage examples
        output += '// Usage examples\n'
        output += '.element {\n'
        output += `  color: ${colorName}-color(1);\n`
        output += `  background-color: ${colorName}-color(2, 'light');\n`
        output += `  border-color: ${colorName}-color(3, 'dark');\n`
        output += '}\n'
        break

      case 'tailwind':
        output = `// tailwind.config.js\nmodule.exports = {\n  theme: {\n    extend: {\n      colors: {\n        '${colorName}': {\n`
        colors.forEach((c, i) => {
          const hsl = hexToHSL(c.hex)
          output += `          '${i + 1}': {\n`
          output += `            lightest: '${HSLToHex(hsl.h, hsl.s, 90)}',\n`
          output += `            light: '${HSLToHex(hsl.h, hsl.s, 70)}',\n`
          output += `            DEFAULT: '${c.hex}',\n`
          output += `            dark: '${HSLToHex(hsl.h, hsl.s, 30)}',\n`
          output += `            darkest: '${HSLToHex(hsl.h, hsl.s, 10)}'\n`
          output += `          }${i < colors.length - 1 ? ',' : ''}\n`
        })
        output += '        }\n      }\n    }\n  }\n}\n\n'
        // Usage examples
        output += '<!-- Usage examples -->\n'
        output += `<div class="text-${colorName}-1 bg-${colorName}-2 border-${colorName}-3">\n`
        output += `  <div class="bg-${colorName}-1-light">Light variant</div>\n`
        output += `  <div class="bg-${colorName}-1-dark">Dark variant</div>\n`
        output += '</div>\n'
        break

      case 'json':
        const jsonOutput = {
          name: colorName,
          colors: colors.map((c, i) => {
            const hsl = hexToHSL(c.hex)
            const rgb = hexToRGB(c.hex)
            return {
              id: i + 1,
              name: generateColorName(c.hex),
              hex: c.hex,
              rgb: `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`,
              hsl: `hsl(${Math.round(hsl.h)}°, ${Math.round(hsl.s)}%, ${Math.round(hsl.l)}%)`,
              variants: {
                lightest: HSLToHex(hsl.h, hsl.s, 90),
                light: HSLToHex(hsl.h, hsl.s, 70),
                dark: HSLToHex(hsl.h, hsl.s, 30),
                darkest: HSLToHex(hsl.h, hsl.s, 10)
              }
            }
          })
        }
        output = JSON.stringify(jsonOutput, null, 2)
        break
    }
    copyToClipboard(output)
    setShowExportModal(false)
  }

  const handleColorWheelSelect = (color) => {
    if (activeColorIndex !== null) {
      const newColors = [...colors]
      newColors[activeColorIndex].hex = color
      setColors(newColors)
    }
  }

  // Add to history when colors change
  useEffect(() => {
    if (colors !== history[historyIndex]) {
      const newHistory = [...history.slice(0, historyIndex + 1), colors]
      setHistory(newHistory)
      setHistoryIndex(newHistory.length - 1)
    }
  }, [colors])

  const handleUndo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1)
      setColors(history[historyIndex - 1])
    }
  }

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1)
      setColors(history[historyIndex + 1])
    }
  }

  const renderPalettePage = () => (
    <>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-white">Color Palette Generator</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setCurrentPage('image')}
            className="p-2 rounded-lg bg-white/5 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white transition-colors"
            title="Image Picker"
          >
            <EyeIcon className="h-5 w-5" />
          </button>
          <button
            onClick={() => setShowSavedPalettes(true)}
            className="p-2 rounded-lg bg-white/5 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white transition-colors"
            title="Saved Palettes"
          >
            <HeartOutlineIcon className="h-5 w-5" />
          </button>
          <button
            onClick={() => setShowExportModal(true)}
            className="p-2 rounded-lg bg-white/5 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white transition-colors"
            title="Export Palette"
          >
            <CodeBracketIcon className="h-5 w-5" />
          </button>
          <button
            onClick={toggleDarkMode}
            className="p-2 rounded-lg bg-white/5 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white transition-colors"
          >
            {darkMode ? <SunIcon className="h-5 w-5" /> : <MoonIcon className="h-5 w-5" />}
          </button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1 flex flex-wrap gap-1 bg-white dark:bg-[#161B22] p-1 rounded-lg">
          {[
            { id: 'analogous', label: 'Analogous' },
            { id: 'monochromatic', label: 'Monochromatic' },
            { id: 'triad', label: 'Triad' },
            { id: 'complementary', label: 'Complementary' },
            { id: 'shades', label: 'Shades' }
          ].map(mode => (
            <button
              key={mode.id}
              onClick={() => {
                setColorMode(mode.id)
                generateNewPalette()
              }}
              className={`px-3 py-1.5 rounded text-sm transition-all ${
                colorMode === mode.id
                  ? 'bg-[#2F81F7] text-white hover:bg-[#2871DB]'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/80'
              }`}
            >
              {mode.label}
            </button>
          ))}
        </div>
        
        <div className="flex items-center gap-2 bg-white dark:bg-[#161B22] p-1 rounded-lg">
          <span className="text-sm text-gray-700 dark:text-gray-300 px-2">Colors:</span>
          {[3, 4, 5, 6, 7].map(count => (
            <button
              key={count}
              onClick={() => handleColorCountChange(count)}
              className={`w-8 h-8 rounded flex items-center justify-center text-sm transition-all ${
                colorCount === count
                  ? 'bg-[#2F81F7] text-white hover:bg-[#2871DB]'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/80'
              }`}
            >
              {count}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-2 mb-8">
        <button
          onClick={generateNewPalette}
          className="flex-1 bg-[#2F81F7] text-white px-6 py-2 rounded-lg hover:bg-[#2871DB] transition-colors"
        >
          Generate New Palette
        </button>
        <div className="relative">
          <button
            onClick={() => setShowGradient(prev => !prev)}
            className={`px-6 py-2 rounded-lg transition-colors ${
              showGradient 
                ? 'bg-[#2F81F7] text-white hover:bg-[#2871DB]'
                : 'bg-white dark:bg-[#21262D] text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/80'
            }`}
          >
            Gradient
          </button>
        </div>
        <button
          onClick={savePalette}
          className="px-6 py-2 rounded-lg bg-white dark:bg-[#21262D] text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/80 transition-colors"
        >
          Save
        </button>
      </div>

      {showGradient && (
        <div className="mb-8 bg-white dark:bg-[#161B22] rounded-lg p-4 shadow-lg">
          <GradientGenerator colors={colors} />
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {colors.map((color, index) => (
          <div
            key={index}
            className="bg-white dark:bg-[#161B22] rounded-lg overflow-hidden shadow-lg transition-all hover:shadow-xl"
          >
            <div
              className="aspect-square relative group cursor-pointer"
              style={{ backgroundColor: color.hex }}
            >
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <input
                  type="text"
                  placeholder="Type something..."
                  className="w-3/4 bg-transparent border-none outline-none text-center placeholder-current opacity-0 group-hover:opacity-75 transition-opacity"
                  style={{
                    color: getContrastRatio(color.hex)
                  }}
                  onChange={(e) => {
                    const newColors = [...colors]
                    newColors[index] = { ...newColors[index], sampleText: e.target.value }
                    setColors(newColors)
                  }}
                  value={color.sampleText || ''}
                />
                {color.sampleText && (
                  <p 
                    className="absolute inset-0 flex items-center justify-center text-lg font-medium"
                    style={{ color: getContrastRatio(color.hex) }}
                  >
                    {color.sampleText}
                  </p>
                )}
              </div>
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 bg-black/20">
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setActiveColorIndex(index)
                      setShowColorWheel(true)
                    }}
                    className="p-2 rounded-full bg-white/90 text-gray-800 hover:bg-white transition-colors"
                    title="Open color picker"
                  >
                    <SwatchIcon className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => toggleLock(index)}
                    className="p-2 rounded-full bg-white/90 text-gray-800 hover:bg-white transition-colors"
                    title={color.locked ? "Unlock color" : "Lock color"}
                  >
                    {color.locked ? (
                      <LockClosedIcon className="h-5 w-5" />
                    ) : (
                      <LockOpenIcon className="h-5 w-5" />
                    )}
                  </button>
                  <button
                    onClick={() => copyToClipboard(color.hex)}
                    className="p-2 rounded-full bg-white/90 text-gray-800 hover:bg-white transition-colors"
                    title="Copy hex code"
                  >
                    <ClipboardIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
            <div className="p-4">
              <div className="space-y-2 mb-4">
                <div className="grid grid-cols-4 gap-1 mb-3">
                  {[
                    { l: 90, label: 'Lightest' },
                    { l: 70, label: 'Light' },
                    { l: 30, label: 'Dark' },
                    { l: 10, label: 'Darkest' }
                  ].map((variant) => {
                    const hsl = hexToHSL(color.hex)
                    const variantColor = HSLToHex(hsl.h, hsl.s, variant.l)
                    return (
                      <div
                        key={variant.l}
                        className="group relative"
                        onClick={() => copyToClipboard(variantColor)}
                      >
                        <div
                          className="h-12 rounded-lg cursor-pointer transition-transform hover:scale-105"
                          style={{ backgroundColor: variantColor }}
                          title={variant.label}
                        />
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="bg-black/50 text-white text-xs px-2 py-1 rounded backdrop-blur-sm">
                            {variantColor}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
                <div className="flex flex-col items-center gap-1">
                  <div className="flex items-center gap-2">
                    <p className="text-center font-mono text-sm select-all cursor-pointer text-gray-800 dark:text-gray-200">
                      {color.hex}
                    </p>
                    <button
                      onClick={() => copyToClipboard(color.hex)}
                      className="p-1 rounded bg-gray-100 dark:bg-gray-700/50 hover:bg-gray-200 dark:hover:bg-gray-600/50 transition-colors"
                      title="Copy HEX"
                    >
                      <ClipboardIcon className="h-3 w-3 text-gray-500 dark:text-gray-400" />
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="text-center font-mono text-sm select-all cursor-pointer text-gray-800 dark:text-gray-200">
                      {`rgb(${Object.values(hexToRGB(color.hex)).join(', ')})`}
                    </p>
                    <button
                      onClick={() => copyToClipboard(`rgb(${Object.values(hexToRGB(color.hex)).join(', ')})`)}
                      className="p-1 rounded bg-gray-100 dark:bg-gray-700/50 hover:bg-gray-200 dark:hover:bg-gray-600/50 transition-colors"
                      title="Copy RGB"
                    >
                      <ClipboardIcon className="h-3 w-3 text-gray-500 dark:text-gray-400" />
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="text-center font-mono text-sm select-all cursor-pointer text-gray-800 dark:text-gray-200">
                      {`hsl(${Math.round(hexToHSL(color.hex).h)}°, ${Math.round(hexToHSL(color.hex).s)}%, ${Math.round(hexToHSL(color.hex).l)}%)`}
                    </p>
                    <button
                      onClick={() => copyToClipboard(`hsl(${Math.round(hexToHSL(color.hex).h)}°, ${Math.round(hexToHSL(color.hex).s)}%, ${Math.round(hexToHSL(color.hex).l)}%)`)}
                      className="p-1 rounded bg-gray-100 dark:bg-gray-700/50 hover:bg-gray-200 dark:hover:bg-gray-600/50 transition-colors"
                      title="Copy HSL"
                    >
                      <ClipboardIcon className="h-3 w-3 text-gray-500 dark:text-gray-400" />
                    </button>
                  </div>
                </div>
                <p className="text-center text-xs text-gray-500 dark:text-gray-400">
                  {generateColorName(color.hex)}
                </p>
              </div>
              <div className="space-y-4">
                <ColorBlindnessSimulator color={color.hex} />
                <AccessibilityScore color={color.hex} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  )

  const renderImagePage = () => (
    <div className="min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">Image picker</h1>
          <p className="text-gray-500 dark:text-gray-400">Extract beautiful palettes from your photos.</p>
        </div>
        <button
          onClick={() => setCurrentPage('palette')}
          className="p-2 rounded-lg bg-[#21262D] text-gray-400 hover:text-white transition-colors"
        >
          Back to Palette
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left side - Palette controls */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-[#161B22] rounded-xl p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Picked palettes</h2>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Palette</p>
                <div className="flex gap-1">
                  {colors.map((color, index) => (
                    <div
                      key={index}
                      className="flex-1 h-12 first:rounded-l-md last:rounded-r-md relative group cursor-pointer"
                      style={{ backgroundColor: color.hex }}
                    >
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200">
                        <div className="flex gap-1">
                          <button
                            onClick={() => toggleLock(index)}
                            className="p-1.5 rounded-md bg-black/20 backdrop-blur-sm text-white hover:bg-black/30 transition-colors"
                          >
                            {color.locked ? (
                              <LockClosedIcon className="h-4 w-4" />
                            ) : (
                              <LockOpenIcon className="h-4 w-4" />
                            )}
                          </button>
                          <button
                            onClick={() => copyToClipboard(color.hex)}
                            className="p-1.5 rounded-md bg-black/20 backdrop-blur-sm text-white hover:bg-black/30 transition-colors"
                          >
                            <ClipboardIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage('palette')}
                  className="flex-1 bg-[#2F81F7] text-white px-4 py-2 rounded-lg hover:bg-[#2871DB] transition-colors text-sm"
                >
                  Use Palette
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right side - Image preview */}
        <div className="aspect-[4/3] relative">
          <ImageColorExtractor onColorsExtracted={setColors} />
        </div>
      </div>
    </div>
  )

  const getExportCode = (format) => {
    const colorName = generateColorName(colors[0].hex).toLowerCase().replace(/\s+/g, '-')
    
    switch (format) {
      case 'css':
        let cssOutput = `:root {\n`
        // Main colors
        colors.forEach((c, i) => {
          cssOutput += `  --color-${colorName}-${i + 1}: ${c.hex};\n`
        })
        // Variations for each color
        colors.forEach((c, i) => {
          const hsl = hexToHSL(c.hex)
          cssOutput += `\n  /* Variations for color ${i + 1} */\n`
          cssOutput += `  --color-${colorName}-${i + 1}-lightest: ${HSLToHex(hsl.h, hsl.s, 90)};\n`
          cssOutput += `  --color-${colorName}-${i + 1}-light: ${HSLToHex(hsl.h, hsl.s, 70)};\n`
          cssOutput += `  --color-${colorName}-${i + 1}-dark: ${HSLToHex(hsl.h, hsl.s, 30)};\n`
          cssOutput += `  --color-${colorName}-${i + 1}-darkest: ${HSLToHex(hsl.h, hsl.s, 10)};\n`
          
          // RGB values
          const rgb = hexToRGB(c.hex)
          cssOutput += `  --color-${colorName}-${i + 1}-rgb: ${rgb.r}, ${rgb.g}, ${rgb.b};\n`
        })
        cssOutput += `}\n\n`
        // Usage examples
        cssOutput += `/* Usage examples */\n`
        cssOutput += `.element {\n`
        cssOutput += `  color: var(--color-${colorName}-1);\n`
        cssOutput += `  background-color: var(--color-${colorName}-2);\n`
        cssOutput += `  border-color: var(--color-${colorName}-3);\n`
        cssOutput += `  /* With opacity */\n`
        cssOutput += `  background-color: rgba(var(--color-${colorName}-1-rgb), 0.5);\n`
        cssOutput += `}\n`
        return cssOutput

      case 'scss':
        let scssOutput = ''
        // Main colors as variables
        colors.forEach((c, i) => {
          scssOutput += `$color-${colorName}-${i + 1}: ${c.hex};\n`
        })
        scssOutput += '\n'
        // Color variations
        colors.forEach((c, i) => {
          const hsl = hexToHSL(c.hex)
          scssOutput += `// Variations for color ${i + 1}\n`
          scssOutput += `$color-${colorName}-${i + 1}-lightest: ${HSLToHex(hsl.h, hsl.s, 90)};\n`
          scssOutput += `$color-${colorName}-${i + 1}-light: ${HSLToHex(hsl.h, hsl.s, 70)};\n`
          scssOutput += `$color-${colorName}-${i + 1}-dark: ${HSLToHex(hsl.h, hsl.s, 30)};\n`
          scssOutput += `$color-${colorName}-${i + 1}-darkest: ${HSLToHex(hsl.h, hsl.s, 10)};\n\n`
        })
        // Color map
        scssOutput += '// Color map\n'
        scssOutput += `$${colorName}-colors: (\n`
        colors.forEach((c, i) => {
          const hsl = hexToHSL(c.hex)
          scssOutput += `  '${i + 1}': (\n`
          scssOutput += `    'base': ${c.hex},\n`
          scssOutput += `    'lightest': ${HSLToHex(hsl.h, hsl.s, 90)},\n`
          scssOutput += `    'light': ${HSLToHex(hsl.h, hsl.s, 70)},\n`
          scssOutput += `    'dark': ${HSLToHex(hsl.h, hsl.s, 30)},\n`
          scssOutput += `    'darkest': ${HSLToHex(hsl.h, hsl.s, 10)}\n`
          scssOutput += `  )${i < colors.length - 1 ? ',' : ''}\n`
        })
        scssOutput += ');\n\n'
        // Mixins and functions
        scssOutput += '// Helper function to get color\n'
        scssOutput += `@function ${colorName}-color($key, $variant: 'base') {\n`
        scssOutput += `  $color: map-get($${colorName}-colors, $key);\n`
        scssOutput += '  @return map-get($color, $variant);\n'
        scssOutput += '}\n\n'
        // Usage examples
        scssOutput += '// Usage examples\n'
        scssOutput += '.element {\n'
        scssOutput += `  color: ${colorName}-color(1);\n`
        scssOutput += `  background-color: ${colorName}-color(2, 'light');\n`
        scssOutput += `  border-color: ${colorName}-color(3, 'dark');\n`
        scssOutput += '}\n'
        return scssOutput

      case 'tailwind':
        let tailwindOutput = `// tailwind.config.js\nmodule.exports = {\n  theme: {\n    extend: {\n      colors: {\n        '${colorName}': {\n`
        colors.forEach((c, i) => {
          const hsl = hexToHSL(c.hex)
          tailwindOutput += `          '${i + 1}': {\n`
          tailwindOutput += `            lightest: '${HSLToHex(hsl.h, hsl.s, 90)}',\n`
          tailwindOutput += `            light: '${HSLToHex(hsl.h, hsl.s, 70)}',\n`
          tailwindOutput += `            DEFAULT: '${c.hex}',\n`
          tailwindOutput += `            dark: '${HSLToHex(hsl.h, hsl.s, 30)}',\n`
          tailwindOutput += `            darkest: '${HSLToHex(hsl.h, hsl.s, 10)}'\n`
          tailwindOutput += `          }${i < colors.length - 1 ? ',' : ''}\n`
        })
        tailwindOutput += '        }\n      }\n    }\n  }\n}\n\n'
        // Usage examples
        tailwindOutput += '<!-- Usage examples -->\n'
        tailwindOutput += `<div class="text-${colorName}-1 bg-${colorName}-2 border-${colorName}-3">\n`
        tailwindOutput += `  <div class="bg-${colorName}-1-light">Light variant</div>\n`
        tailwindOutput += `  <div class="bg-${colorName}-1-dark">Dark variant</div>\n`
        tailwindOutput += '</div>\n'
        return tailwindOutput

      case 'json':
        const jsonOutput = {
          name: colorName,
          colors: colors.map((c, i) => {
            const hsl = hexToHSL(c.hex)
            const rgb = hexToRGB(c.hex)
            return {
              id: i + 1,
              name: generateColorName(c.hex),
              hex: c.hex,
              rgb: `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`,
              hsl: `hsl(${Math.round(hsl.h)}°, ${Math.round(hsl.s)}%, ${Math.round(hsl.l)}%)`,
              variants: {
                lightest: HSLToHex(hsl.h, hsl.s, 90),
                light: HSLToHex(hsl.h, hsl.s, 70),
                dark: HSLToHex(hsl.h, hsl.s, 30),
                darkest: HSLToHex(hsl.h, hsl.s, 10)
              }
            }
          })
        }
        return JSON.stringify(jsonOutput, null, 2)

      default:
        return ''
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0D1117] transition-colors">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {currentPage === 'palette' ? renderPalettePage() : renderImagePage()}

        {/* Export Modal */}
        {showExportModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-[#161B22] rounded-lg p-6 max-w-4xl w-full shadow-xl">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-800 dark:text-white">Export Palette</h2>
                <button
                  onClick={() => setShowExportModal(false)}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors text-gray-500 dark:text-gray-400"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="flex border-b border-gray-200 dark:border-gray-700 mb-4">
                {['css', 'scss', 'tailwind', 'json'].map(format => (
                  <button
                    key={format}
                    onClick={() => setActiveExportTab(format)}
                    className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors relative ${
                      activeExportTab === format
                        ? 'text-[#2F81F7] border-b-2 border-[#2F81F7]'
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                    }`}
                  >
                    {format.toUpperCase()}
                  </button>
                ))}
              </div>
              <div className="relative flex flex-col h-[60vh]">
                <div className="sticky top-0 right-0 flex justify-end p-2 bg-gray-50 dark:bg-[#0D1117] rounded-t-lg border-b border-gray-200 dark:border-gray-700 z-10">
                  <button
                    onClick={() => copyToClipboard(getExportCode(activeExportTab))}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white transition-colors"
                    title="Copy code"
                  >
                    <ClipboardIcon className="h-4 w-4" />
                    <span className="text-sm">Copy</span>
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-700 scrollbar-track-transparent hover:scrollbar-thumb-gray-400 dark:hover:scrollbar-thumb-gray-600 scroll-smooth">
                  <pre className="p-4 text-sm font-mono">
                    <code className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap break-words">
                      {getExportCode(activeExportTab)}
                    </code>
                  </pre>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Saved Palettes Modal */}
        {showSavedPalettes && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-[#161B22] rounded-lg p-6 max-w-2xl w-full shadow-xl">
              <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-white">Saved Palettes</h2>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {savedPalettes.map((palette, index) => (
                  <div key={index} className="flex items-center gap-4">
                    <div className="flex-1 grid grid-cols-5 gap-2">
                      {palette.map((color, colorIndex) => (
                        <div
                          key={colorIndex}
                          className="h-8 rounded"
                          style={{ backgroundColor: color.hex }}
                        />
                      ))}
                    </div>
                    <button
                      onClick={() => loadPalette(palette)}
                      className="px-3 py-1 bg-[#2F81F7] text-white rounded hover:bg-[#2871DB] transition-colors"
                    >
                      Load
                    </button>
                    <button
                      onClick={() => deletePalette(index)}
                      className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                ))}
                {savedPalettes.length === 0 && (
                  <p className="text-gray-500 dark:text-gray-400 text-center py-4">No saved palettes yet</p>
                )}
              </div>
              <button
                onClick={() => setShowSavedPalettes(false)}
                className="mt-4 w-full px-4 py-2 bg-gray-100 dark:bg-gray-700/50 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600/50 transition-colors text-gray-800 dark:text-white"
              >
                Close
              </button>
            </div>
          </div>
        )}

        {/* Color wheel modal */}
        {showColorWheel && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-[#161B22] rounded-lg p-6 shadow-xl">
              <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-white">Color Picker</h2>
              <div className="flex items-center gap-8">
                <ColorWheel onColorSelect={handleColorWheelSelect} />
                <div className="space-y-4">
                  <div
                    className="w-32 h-32 rounded-lg shadow-lg"
                    style={{ backgroundColor: colors[activeColorIndex]?.hex }}
                  />
                  <p className="text-center text-gray-600 dark:text-gray-400">
                    {generateColorName(colors[activeColorIndex]?.hex)}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowColorWheel(false)}
                className="mt-4 w-full px-4 py-2 bg-gray-100 dark:bg-gray-700/50 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600/50 transition-colors text-gray-800 dark:text-white"
              >
                Close
              </button>
            </div>
          </div>
        )}

        {/* Toast notification */}
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}
      </div>
    </div>
  )
}

export default App 