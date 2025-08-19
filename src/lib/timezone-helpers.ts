// Minimal, dependency-free helpers

export function isoDateInTZ(sourceISO: string | Date, tz: string): string {
  const d = typeof sourceISO === 'string' ? new Date(sourceISO) : sourceISO
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit'
  }).formatToParts(d)
  const y = parts.find(p => p.type === 'year')!.value
  const m = parts.find(p => p.type === 'month')!.value
  const day = parts.find(p => p.type === 'day')!.value
  return `${y}-${m}-${day}` // YYYY-MM-DD
}

export function nowISOInTZ(tz: string): string {
  // current local date-time string in tz (YYYY-MM-DDTHH:mm:ss)
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
  }).formatToParts(new Date())

  const get = (t: string) => parts.find(p => p.type === t)!.value
  return `${get('year')}-${get('month')}-${get('day')}T${get('hour')}:${get('minute')}:${get('second')}`
}
