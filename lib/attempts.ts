export const MAX_ATTEMPTS = 5

function getTodayKey(): string {
  const now = new Date()
  const y = now.getUTCFullYear()
  const m = String(now.getUTCMonth() + 1).padStart(2, '0')
  const d = String(now.getUTCDate()).padStart(2, '0')
  return `dtd-attempts-${y}-${m}-${d}`
}

function getLeaderboardKey(): string {
  const now = new Date()
  const y = now.getUTCFullYear()
  const m = String(now.getUTCMonth() + 1).padStart(2, '0')
  const d = String(now.getUTCDate()).padStart(2, '0')
  return `dtd-leaderboard-${y}-${m}-${d}`
}

export function getAttemptsToday(): number {
  if (typeof window === 'undefined') return 0
  const val = localStorage.getItem(getTodayKey())
  return val ? parseInt(val, 10) : 0
}

export function incrementAttempt(): void {
  if (typeof window === 'undefined') return
  const current = getAttemptsToday()
  localStorage.setItem(getTodayKey(), String(current + 1))
}

export function hasAttemptsRemaining(): boolean {
  return getAttemptsToday() < MAX_ATTEMPTS
}

export function hasViewedLeaderboardToday(): boolean {
  if (typeof window === 'undefined') return false
  return localStorage.getItem(getLeaderboardKey()) === 'true'
}

export function markLeaderboardViewed(): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(getLeaderboardKey(), 'true')
}
