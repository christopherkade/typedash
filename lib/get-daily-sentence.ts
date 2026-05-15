import sentences from '@/data/sentences.json'

export type DailySentence = {
  id: string
  content: string
}

export function getDailySentence(): DailySentence {
  const epoch = Date.UTC(1970, 0, 1)
  const now = new Date()
  const utcToday = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  const daysSinceEpoch = Math.floor((utcToday - epoch) / (1000 * 60 * 60 * 24))
  const index = daysSinceEpoch % sentences.length
  return {
    id: String(index),
    content: sentences[index],
  }
}
