import dns from 'node:dns/promises'
import net from 'node:net'

const ALLOWED_HOSTS = new Set(['instagram.com', 'www.instagram.com'])
const BLOCKED_HOSTS = new Set(['localhost', '127.0.0.1', '0.0.0.0'])
const BLOCKED_SUFFIXES = ['.internal', '.local', '.localhost']

function isPrivateIpv4(ip: string): boolean {
  const parts = ip.split('.').map(Number)

  if (parts.length !== 4 || parts.some((part) => Number.isNaN(part))) {
    return false
  }

  if (parts[0] === 10) return true
  if (parts[0] === 127) return true
  if (parts[0] === 0) return true
  if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true
  if (parts[0] === 192 && parts[1] === 168) return true

  return false
}

function isPrivateIpv6(ip: string): boolean {
  const normalized = ip.toLowerCase()

  return (
    normalized === '::1' ||
    normalized.startsWith('fc') ||
    normalized.startsWith('fd') ||
    normalized.startsWith('fe80:') ||
    normalized.startsWith('::ffff:127.') ||
    normalized.startsWith('::ffff:10.') ||
    normalized.startsWith('::ffff:172.16.') ||
    normalized.startsWith('::ffff:172.17.') ||
    normalized.startsWith('::ffff:172.18.') ||
    normalized.startsWith('::ffff:172.19.') ||
    normalized.startsWith('::ffff:172.2') ||
    normalized.startsWith('::ffff:172.30.') ||
    normalized.startsWith('::ffff:172.31.') ||
    normalized.startsWith('::ffff:192.168.')
  )
}

function isBlockedIpAddress(input: string): boolean {
  const family = net.isIP(input)

  if (family === 4) {
    return isPrivateIpv4(input)
  }

  if (family === 6) {
    return isPrivateIpv6(input)
  }

  return false
}

export async function validateSafeInstagramUrl(input: string): Promise<URL> {
  const parsed = new URL(String(input || '').trim())

  if (!['http:', 'https:'].includes(parsed.protocol)) {
    throw new Error('Only http and https URLs are allowed.')
  }

  const hostname = parsed.hostname.trim().toLowerCase()

  if (!ALLOWED_HOSTS.has(hostname)) {
    throw new Error('Only instagram.com URLs are allowed.')
  }

  if (BLOCKED_HOSTS.has(hostname) || BLOCKED_SUFFIXES.some((suffix) => hostname.endsWith(suffix))) {
    throw new Error('Internal or local URLs are not allowed.')
  }

  if (isBlockedIpAddress(hostname)) {
    throw new Error('Internal network URLs are not allowed.')
  }

  const records = await dns.lookup(hostname, { all: true })

  if (!records.length) {
    throw new Error('Could not resolve URL host.')
  }

  if (records.some((record) => isBlockedIpAddress(record.address))) {
    throw new Error('Resolved URL points to an internal network address.')
  }

  return parsed
}
