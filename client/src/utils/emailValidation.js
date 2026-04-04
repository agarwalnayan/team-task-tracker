/** Practical email check (aligned with server). */
export function isValidEmail(value) {
  const s = String(value || '').trim()
  if (!s) return false
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(s)
}

export function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase()
}
