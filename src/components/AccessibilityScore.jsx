import { CheckCircleIcon, ExclamationCircleIcon } from '@heroicons/react/24/solid'

const AccessibilityScore = ({ color }) => {
  const hexToRGB = (hex) => {
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)
    return { r, g, b }
  }

  const getLuminance = (r, g, b) => {
    const [rs, gs, bs] = [r, g, b].map(c => {
      c = c / 255
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
    })
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs
  }

  const getContrastRatio = (l1, l2) => {
    const lighter = Math.max(l1, l2)
    const darker = Math.min(l1, l2)
    return (lighter + 0.05) / (darker + 0.05)
  }

  const analyzeColor = () => {
    const rgb = hexToRGB(color)
    const luminance = getLuminance(rgb.r, rgb.g, rgb.b)
    const whiteContrast = getContrastRatio(1, luminance)
    const blackContrast = getContrastRatio(luminance, 0)

    return {
      wcag: {
        AAA: {
          largeText: whiteContrast >= 4.5 || blackContrast >= 4.5,
          normalText: whiteContrast >= 7 || blackContrast >= 7
        },
        AA: {
          largeText: whiteContrast >= 3 || blackContrast >= 3,
          normalText: whiteContrast >= 4.5 || blackContrast >= 4.5
        }
      },
      bestContrast: whiteContrast > blackContrast ? '#FFFFFF' : '#000000',
      contrastRatio: Math.max(whiteContrast, blackContrast).toFixed(2)
    }
  }

  const analysis = analyzeColor()

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-600 dark:text-gray-400">Contrast ratio:</span>
        <span className="font-mono text-sm">{analysis.contrastRatio}:1</span>
      </div>
      
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-600 dark:text-gray-400">WCAG AAA:</span>
          <div className="flex gap-1">
            {analysis.wcag.AAA.normalText ? (
              <CheckCircleIcon className="h-4 w-4 text-green-500" />
            ) : (
              <ExclamationCircleIcon className="h-4 w-4 text-red-500" />
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-600 dark:text-gray-400">WCAG AA:</span>
          <div className="flex gap-1">
            {analysis.wcag.AA.normalText ? (
              <CheckCircleIcon className="h-4 w-4 text-green-500" />
            ) : (
              <ExclamationCircleIcon className="h-4 w-4 text-red-500" />
            )}
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        <div
          className="flex-1 h-8 rounded flex items-center justify-center text-sm"
          style={{
            backgroundColor: color,
            color: analysis.bestContrast
          }}
        >
          Sample Text
        </div>
      </div>
    </div>
  )
}

export default AccessibilityScore 