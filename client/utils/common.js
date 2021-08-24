/**
 * Insert common items here
 */
import toscalogoColor from 'Assets/toscalogo_color.svg'
import toscalogoGrayscale from 'Assets/toscalogo_grayscale.svg'

export const images = {
  toska_color: toscalogoColor,
  toska_grayscale: toscalogoGrayscale
}

export const colors = {}

export const sortedItems = (items, sorter, reverse) => {
  if (!items) return []
  if (!sorter) return items
  const sorted = items.sort((a, b) => {
    if (typeof a[sorter] === 'string' && !reverse) return a[sorter].localeCompare(b[sorter])
    if (typeof a[sorter] === 'string' && reverse) return b[sorter].localeCompare(a[sorter])
    if (!reverse) return a[sorter] - b[sorter]
    if (reverse) return b[sorter] - a[sorter]
  })
  return sorted
}


export * from 'Root/utils/common'
