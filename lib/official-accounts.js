const DEFAULT_OFFICIAL_EMAILS = ['whatsthatai@gmail.com']

function getOfficialEmails() {
  const configured = String(process.env.WHATSTHATAI_OFFICIAL_EMAILS || '')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean)

  return configured.length > 0 ? configured : DEFAULT_OFFICIAL_EMAILS
}

export function isWhatsThatAIOfficialEmail(email) {
  const normalizedEmail = String(email || '').trim().toLowerCase()

  if (!normalizedEmail) {
    return false
  }

  return getOfficialEmails().includes(normalizedEmail)
}
