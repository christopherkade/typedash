export function calculateWPM(charCount: number, timeMs: number): number {
  if (timeMs <= 0) return 0
  return Math.round((charCount / 5) / (timeMs / 60000))
}

export function calculateAccuracy(
  correctKeystrokes: number,
  totalKeystrokes: number,
): number {
  if (totalKeystrokes <= 0) return 100
  return Math.round((correctKeystrokes / totalKeystrokes) * 100)
}

export function formatTime(timeMs: number): string {
  return Math.round(timeMs / 1000).toString()
}
