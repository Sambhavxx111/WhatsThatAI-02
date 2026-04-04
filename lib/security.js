import dns from 'node:dns/promises'
import net from 'node:net'

const BLOCKED_HOSTNAMES = new Set(['localhost'])
const BLOCKED_SUFFIXES = ['.internal', '.local', '.localhost']
const ALLOWED_REMOTE_VIDEO_HOSTS = new Set(['instagram.com', 'www.instagram.com'])
const MAX_VIDEO_SIZE_BYTES = 25 * 1024 * 1024

function isPrivateIpv4(ip) {
  const parts = ip.split('.').map(Number)

  if (parts.length !== 4 || parts.some((part) => Number.isNaN(part))) {
    return false
  }

  if (parts[0] === 10) return true
  if (parts[0] === 127) return true
  if (parts[0] === 169 && parts[1] === 254) return true
  if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true
  if (parts[0] === 192 && parts[1] === 168) return true
  if (parts[0] === 0) return true

  return false
}

function isPrivateIpv6(ip) {
  const normalized = ip.toLowerCase()

  return (
    normalized === '::1' ||
    normalized.startsWith('fc') ||
    normalized.startsWith('fd') ||
    normalized.startsWith('fe80:') ||
    normalized.startsWith('::ffff:127.') ||
    normalized.startsWith('::ffff:10.') ||
    normalized.startsWith('::ffff:192.168.')
  )
}

function isBlockedIp(ip) {
  const family = net.isIP(ip)

  if (family === 4) {
    return isPrivateIpv4(ip)
  }

  if (family === 6) {
    return isPrivateIpv6(ip)
  }

  return false
}

function validateHostname(hostname) {
  const normalized = String(hostname || '').trim().toLowerCase()

  if (!normalized) {
    throw new Error('Invalid URL host')
  }

  if (BLOCKED_HOSTNAMES.has(normalized)) {
    throw new Error('Blocked host')
  }

  if (BLOCKED_SUFFIXES.some((suffix) => normalized.endsWith(suffix))) {
    throw new Error('Blocked host')
  }

  if (isBlockedIp(normalized)) {
    throw new Error('Blocked host')
  }

  return normalized
}

export function getClientIp(request) {
  const forwardedFor = request.headers.get('x-forwarded-for')

  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim()
  }

  return request.headers.get('x-real-ip') || 'unknown'
}

export async function assertPublicHttpUrl(input, options = {}) {
  const url = new URL(String(input || '').trim())

  if (!['http:', 'https:'].includes(url.protocol)) {
    throw new Error('Only http and https URLs are allowed')
  }

  const hostname = validateHostname(url.hostname)

  if (options.allowedHosts && options.allowedHosts.size > 0 && !options.allowedHosts.has(hostname)) {
    throw new Error('Host is not allowed')
  }

  const records = await dns.lookup(hostname, { all: true })

  if (!records.length) {
    throw new Error('Could not resolve host')
  }

  if (records.some((record) => isBlockedIp(record.address))) {
    throw new Error('Blocked host')
  }

  return url
}

export async function assertPublicWebsiteUrl(input) {
  return assertPublicHttpUrl(input)
}

export async function assertAllowedRemoteVideoUrl(input) {
  return assertPublicHttpUrl(input, { allowedHosts: ALLOWED_REMOTE_VIDEO_HOSTS })
}

export function assertVideoUpload(file) {
  const size = Number(file?.size || 0)
  const type = String(file?.type || '')

  if (!size || size > MAX_VIDEO_SIZE_BYTES) {
    throw new Error('Video file is too large')
  }

  if (!type.startsWith('video/')) {
    throw new Error('Unsupported file type')
  }
}

export function assertRemoteVideoResponse(response) {
  const contentType = String(response.headers.get('content-type') || '')
  const contentLength = Number(response.headers.get('content-length') || 0)

  if (contentType && !contentType.toLowerCase().startsWith('video/')) {
    throw new Error('Remote URL did not return a video')
  }

  if (contentLength && contentLength > MAX_VIDEO_SIZE_BYTES) {
    throw new Error('Remote video is too large')
  }
}

export { MAX_VIDEO_SIZE_BYTES }
