export function getAdminAppUrl(): string | null {
  const value = String(process.env.ADMIN_APP_URL || process.env.NEXT_PUBLIC_ADMIN_APP_URL || '').trim()
  return value || null
}

export function getAdminHost(): string | null {
  const appUrl = getAdminAppUrl()

  if (!appUrl) {
    return null
  }

  try {
    return new URL(appUrl).host
  } catch {
    return null
  }
}

export function isAdminHost(host: string | null | undefined): boolean {
  const expectedHost = getAdminHost()

  if (!expectedHost) {
    return true
  }

  return String(host || '').trim().toLowerCase() === expectedHost.toLowerCase()
}
