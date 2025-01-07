// Color names from https://github.com/meodai/color-names
const colorNames = {
  '#FF0000': 'Red',
  '#00FF00': 'Green',
  '#0000FF': 'Blue',
  '#FFFF00': 'Yellow',
  '#FF00FF': 'Magenta',
  '#00FFFF': 'Cyan',
  '#000000': 'Black',
  '#FFFFFF': 'White',
  '#808080': 'Gray',
  '#800000': 'Maroon',
  '#808000': 'Olive',
  '#008000': 'Dark Green',
  '#800080': 'Purple',
  '#008080': 'Teal',
  '#000080': 'Navy',
  // Add more color names as needed
}

export const findClosestColorName = (hex) => {
  const r1 = parseInt(hex.slice(1, 3), 16)
  const g1 = parseInt(hex.slice(3, 5), 16)
  const b1 = parseInt(hex.slice(5, 7), 16)

  let minDistance = Infinity
  let closestName = 'Custom Color'

  Object.entries(colorNames).forEach(([colorHex, name]) => {
    const r2 = parseInt(colorHex.slice(1, 3), 16)
    const g2 = parseInt(colorHex.slice(3, 5), 16)
    const b2 = parseInt(colorHex.slice(5, 7), 16)

    // Calculate color distance using Delta E (simplified)
    const distance = Math.sqrt(
      Math.pow(r2 - r1, 2) +
      Math.pow(g2 - g1, 2) +
      Math.pow(b2 - b1, 2)
    )

    if (distance < minDistance) {
      minDistance = distance
      closestName = name
    }
  })

  return closestName
}

export const generateColorName = (hex) => {
  const name = findClosestColorName(hex)
  return `${name} (${hex})`
} 