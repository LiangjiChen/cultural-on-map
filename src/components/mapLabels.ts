interface LabelRegion {
  id: string
  name: string
  center: [number, number]
}

interface Rect {
  left: number
  right: number
  top: number
  bottom: number
}

interface Candidate {
  x: number
  y: number
  width: number
  height: number
  level: number
  preference: number
}

export interface PositionedMapLabel {
  id: string
  name: string
  x: number
  y: number
  leader?: {
    x1: number
    y1: number
    x2: number
    y2: number
  }
}

export function markerRadius(count: number, maxCount: number) {
  return 11 + Math.sqrt(count / Math.max(1, maxCount)) * 10
}

function rectsOverlap(a: Rect, b: Rect, gap = 5) {
  return a.left < b.right + gap && a.right + gap > b.left && a.top < b.bottom + gap && a.bottom + gap > b.top
}

function rectIntersectsCircle(rect: Rect, x: number, y: number, radius: number) {
  const nearestX = Math.max(rect.left, Math.min(x, rect.right))
  const nearestY = Math.max(rect.top, Math.min(y, rect.bottom))
  return (nearestX - x) ** 2 + (nearestY - y) ** 2 < (radius + 9) ** 2
}

const directions: [number, number, number][] = [
  [0, -1, 0],
  [0, 1, 2],
  [1, 0, 4],
  [-1, 0, 4],
  [0.45, -1, 1],
  [-0.45, -1, 1],
  [0.45, 1, 3],
  [-0.45, 1, 3],
  [1, -0.45, 5],
  [-1, -0.45, 5],
  [1, 0.45, 5],
  [-1, 0.45, 5],
]

export function layoutMapLabels(
  regions: LabelRegion[],
  counts: Record<string, number>,
  maxCount: number,
): PositionedMapLabel[] {
  const visible = regions.filter(region => (counts[region.id] ?? 0) > 0)
  const empty = regions.filter(region => (counts[region.id] ?? 0) === 0)
  const markers = visible.map(region => ({
    id: region.id,
    x: region.center[0],
    y: region.center[1],
    radius: markerRadius(counts[region.id] ?? 0, maxCount),
  }))
  const crowding = new Map(markers.map(marker => [
    marker.id,
    markers.filter(other => other.id !== marker.id && Math.hypot(other.x - marker.x, other.y - marker.y) < 145).length,
  ]))
  const ordered = [...visible].sort((a, b) =>
    (crowding.get(b.id) ?? 0) - (crowding.get(a.id) ?? 0)
    || (counts[b.id] ?? 0) - (counts[a.id] ?? 0)
    || a.id.localeCompare(b.id)
  )
  const placed: { rect: Rect }[] = []
  const result = new Map<string, PositionedMapLabel>()

  for (const region of empty) {
    const width = region.name.length * 15 + Math.max(0, region.name.length - 1)
    const height = 21
    const y = region.center[1] - 15
    placed.push({
      rect: {
        left: region.center[0] - width / 2,
        right: region.center[0] + width / 2,
        top: y - height / 2,
        bottom: y + height / 2,
      },
    })
    result.set(region.id, {
      id: region.id,
      name: region.name,
      x: region.center[0],
      y,
    })
  }

  for (const region of ordered) {
    const marker = markers.find(item => item.id === region.id)!
    const width = region.name.length * 15 + Math.max(0, region.name.length - 1)
    const height = 21
    const candidates: Candidate[] = []

    for (let level = 0; level < 9; level += 1) {
      for (const [rawX, rawY, preference] of directions) {
        const length = Math.hypot(rawX, rawY)
        const x = rawX / length
        const y = rawY / length
        const distance = marker.radius + 13 + Math.abs(x) * width / 2 + Math.abs(y) * height / 2 + level * 24
        candidates.push({
          x: marker.x + x * distance,
          y: marker.y + y * distance,
          width,
          height,
          level,
          preference,
        })
      }
    }

    candidates.sort((a, b) => a.level - b.level || a.preference - b.preference)
    let fallback: { candidate: Candidate; rect: Rect; collisions: number } | null = null
    let chosen: { candidate: Candidate; rect: Rect } | null = null

    for (const candidate of candidates) {
      const rect = {
        left: candidate.x - width / 2,
        right: candidate.x + width / 2,
        top: candidate.y - height / 2,
        bottom: candidate.y + height / 2,
      }
      if (rect.left < 20 || rect.right > 1080 || rect.top < 34 || rect.bottom > 746) continue
      const labelCollisions = placed.filter(item => rectsOverlap(rect, item.rect)).length
      const markerCollisions = markers.filter(item => rectIntersectsCircle(rect, item.x, item.y, item.radius)).length
      const collisions = labelCollisions + markerCollisions
      if (collisions === 0) {
        chosen = { candidate, rect }
        break
      }
      if (!fallback || collisions < fallback.collisions) fallback = { candidate, rect, collisions }
    }

    const selection = chosen ?? fallback
    if (!selection) continue
    const { candidate, rect } = selection
    placed.push({ rect })

    const dx = candidate.x - marker.x
    const dy = candidate.y - marker.y
    const distance = Math.hypot(dx, dy)
    const unitX = dx / distance
    const unitY = dy / distance
    const labelEdge = Math.min(
      Math.abs(unitX) > 0.001 ? width / 2 / Math.abs(unitX) : Infinity,
      Math.abs(unitY) > 0.001 ? height / 2 / Math.abs(unitY) : Infinity,
    )
    const start = marker.radius + 4
    const end = distance - labelEdge - 3
    const leader = end - start > 9 ? {
      x1: marker.x + unitX * start,
      y1: marker.y + unitY * start,
      x2: marker.x + unitX * end,
      y2: marker.y + unitY * end,
    } : undefined

    result.set(region.id, {
      id: region.id,
      name: region.name,
      x: candidate.x,
      y: candidate.y,
      leader,
    })
  }

  return regions.map(region => result.get(region.id)).filter((label): label is PositionedMapLabel => Boolean(label))
}
