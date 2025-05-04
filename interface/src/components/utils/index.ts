import type { Point, TokenRef, TokenGroup } from "../types"

// Get the center point of a token element
export const getTokenCenter = (element: HTMLElement | null): Point => {
  if (!element) return { x: 0, y: 0 }
  const rect = element.getBoundingClientRect()
  return {
    x: rect.left + rect.width / 2,
    y: rect.top + rect.height / 2,
  }
}

// Get the center point of a token group
export const getGroupCenter = (tokens: TokenRef[], indices: number[]): Point => {
  if (indices.length === 0 || !tokens.length) return { x: 0, y: 0 }

  // Find the leftmost and rightmost tokens in the group
  const validTokens = indices.map((index) => tokens[index]).filter((token) => token !== null) as HTMLElement[]

  if (validTokens.length === 0) return { x: 0, y: 0 }

  // If there's only one token, return its center
  if (validTokens.length === 1) return getTokenCenter(validTokens[0])

  // Find the bounding box of all tokens in the group
  let left = Number.POSITIVE_INFINITY
  let right = Number.NEGATIVE_INFINITY
  let top = Number.POSITIVE_INFINITY
  let bottom = Number.NEGATIVE_INFINITY

  validTokens.forEach((token) => {
    const rect = token.getBoundingClientRect()
    left = Math.min(left, rect.left)
    right = Math.max(right, rect.right)
    top = Math.min(top, rect.top)
    bottom = Math.max(bottom, rect.bottom)
  })

  // Return the center of the bounding box
  return {
    x: left + (right - left) / 2,
    y: top + (bottom - top) / 2,
  }
}

// Generate Bezier curve path between two points
export const generatePath = (start: Point, end: Point): string => {
  if (!start || !end) return ""

  // Calculate the vertical distance to determine curve intensity
  const verticalDistance = Math.abs(end.y - start.y)

  // Control points for the Bezier curve
  // Adjust control points based on the vertical distance for a more natural curve
  const controlPointOffset = Math.min(Math.max(verticalDistance * 0.5, 50), 150)

  const controlPoint1 = {
    x: start.x,
    y: start.y + (end.y > start.y ? controlPointOffset : -controlPointOffset),
  }

  const controlPoint2 = {
    x: end.x,
    y: end.y + (start.y > end.y ? controlPointOffset : -controlPointOffset),
  }

  return `
    M ${start.x},${start.y}
    C ${controlPoint1.x},${controlPoint1.y}
      ${controlPoint2.x},${controlPoint2.y}
      ${end.x},${end.y}
  `
}

// Calculate selection box dimensions
export const getSelectionBoxStyle = (selectionBox: { start: Point; end: Point } | null) => {
  if (!selectionBox) return {}

  const minX = Math.min(selectionBox.start.x, selectionBox.end.x)
  const maxX = Math.max(selectionBox.start.x, selectionBox.end.x)
  const minY = Math.min(selectionBox.start.y, selectionBox.end.y)
  const maxY = Math.max(selectionBox.start.y, selectionBox.end.y)

  return {
    left: `${minX}px`,
    top: `${minY}px`,
    width: `${maxX - minX}px`,
    height: `${maxY - minY}px`,
  }
}

// Tokenize text into words and punctuation
export const tokenizeText = (text: string): string[] => {
  return text.split(/(\s+|[.,!?;:()[\]{}'"—–-])/g).filter((token) => token.trim() !== "")
}

// Find consecutive groups of tokens
export const findTokenGroups = (selectedTokens: number[]): TokenGroup[] => {
  if (selectedTokens.length === 0) return []

  // Sort the selected tokens
  const sorted = [...selectedTokens].sort((a, b) => a - b)

  const groups: TokenGroup[] = []
  let currentGroup: TokenGroup = {
    startIndex: sorted[0],
    endIndex: sorted[0],
    tokens: [sorted[0]],
  }

  for (let i = 1; i < sorted.length; i++) {
    // If this token is consecutive with the previous one
    if (sorted[i] === sorted[i - 1] + 1) {
      currentGroup.tokens.push(sorted[i])
      currentGroup.endIndex = sorted[i]
    } else {
      // Start a new group
      groups.push({ ...currentGroup })
      currentGroup = {
        startIndex: sorted[i],
        endIndex: sorted[i],
        tokens: [sorted[i]],
      }
    }
  }

  // Add the last group
  groups.push(currentGroup)

  return groups
}
