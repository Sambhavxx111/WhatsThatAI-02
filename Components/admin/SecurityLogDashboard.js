'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'

const EVENT_OPTIONS = [
  '',
  'LOGIN_SUCCESS',
  'LOGIN_FAILED',
  'LOGOUT',
  'TOKEN_REFRESH',
  'UNAUTHORIZED_ACCESS',
  'RATE_LIMIT_HIT',
  'ADMIN_LOGIN',
  'ADMIN_TOOL_APPROVAL',
  'ADMIN_TOOL_REJECTION',
  'ADMIN_TOOL_DELETION',
  'ADMIN_MFA_SUCCESS',
  'ADMIN_MFA_FAILED',
  'SIGNUP_SUCCESS',
]

function formatTimestamp(value) {
  if (!value) {
    return 'N/A'
  }

  try {
    return new Intl.DateTimeFormat('en-IN', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(value))
  } catch {
    return value
  }
}

function prettyJson(value) {
  try {
    return JSON.stringify(value ?? {}, null, 2)
  } catch {
    return '{}'
  }
}

export default function SecurityLogDashboard() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [eventFilter, setEventFilter] = useState('')

  useEffect(() => {
    let mounted = true
    const timeoutId = setTimeout(async () => {
      setLoading(true)

      try {
        const params = new URLSearchParams()

        if (query.trim()) {
          params.set('query', query.trim())
        }

        if (eventFilter) {
          params.set('event', eventFilter)
        }

        const response = await fetch(`/api/admin/security-logs?${params.toString()}`, {
          credentials: 'include',
        })

        if (!response.ok) {
          throw new Error('Failed to load security logs')
        }

        const data = await response.json()

        if (mounted) {
          setLogs(Array.isArray(data.logs) ? data.logs : [])
        }
      } catch {
        if (mounted) {
          setLogs([])
        }
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }, 250)

    return () => {
      mounted = false
      clearTimeout(timeoutId)
    }
  }, [eventFilter, query])

  const stats = useMemo(() => {
    const failedLogins = logs.filter((log) => log.event === 'LOGIN_FAILED').length
    const unauthorized = logs.filter((log) => log.event === 'UNAUTHORIZED_ACCESS').length
    const suspicious = logs.filter((log) => log.suspicious).length

    return { failedLogins, unauthorized, suspicious }
  }, [logs])

  return (
    <div className="min-h-screen bg-[#080808] px-4 py-24 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.28em] text-neutral-500">
              Team Portal
            </p>
            <h1 className="text-4xl font-semibold tracking-tight sm:text-[44px]">Security activity logs</h1>
            <p className="mt-4 max-w-3xl text-[17px] font-medium text-neutral-400">
              Review auth activity, suspicious access attempts, admin actions, and rate-limit hits in one protected dashboard.
            </p>
          </div>

          <Link
            href="/portal/admin"
            className="inline-flex h-12 items-center justify-center rounded-[18px] border border-white/10 bg-white/[0.04] px-5 text-[14px] font-semibold text-white transition hover:bg-white/[0.08]"
          >
            Back to moderation
          </Link>
        </div>

        <div className="mb-8 grid gap-4 md:grid-cols-3">
          <div className="rounded-[24px] border border-white/6 bg-white/[0.04] p-5 backdrop-blur-xl">
            <p className="text-[11px] uppercase tracking-[0.22em] text-neutral-500">Failed logins</p>
            <p className="mt-3 text-3xl font-semibold text-white">{stats.failedLogins}</p>
          </div>
          <div className="rounded-[24px] border border-white/6 bg-white/[0.04] p-5 backdrop-blur-xl">
            <p className="text-[11px] uppercase tracking-[0.22em] text-neutral-500">Unauthorized hits</p>
            <p className="mt-3 text-3xl font-semibold text-white">{stats.unauthorized}</p>
          </div>
          <div className="rounded-[24px] border border-white/6 bg-white/[0.04] p-5 backdrop-blur-xl">
            <p className="text-[11px] uppercase tracking-[0.22em] text-neutral-500">Suspicious rows</p>
            <p className="mt-3 text-3xl font-semibold text-white">{stats.suspicious}</p>
          </div>
        </div>

        <div className="mb-6 flex flex-col gap-4 rounded-[24px] border border-white/6 bg-white/[0.04] p-5 backdrop-blur-xl lg:flex-row lg:items-center">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by IP or user ID"
            className="h-12 flex-1 rounded-[16px] border border-white/10 bg-black/20 px-4 text-[14px] text-white outline-none placeholder:text-neutral-500"
          />
          <select
            value={eventFilter}
            onChange={(event) => setEventFilter(event.target.value)}
            className="h-12 rounded-[16px] border border-white/10 bg-black/20 px-4 text-[14px] text-white outline-none"
          >
            {EVENT_OPTIONS.map((eventName) => (
              <option key={eventName || 'all'} value={eventName} className="bg-[#101010] text-white">
                {eventName || 'All events'}
              </option>
            ))}
          </select>
        </div>

        <div className="overflow-hidden rounded-[28px] border border-white/6 bg-white/[0.04] shadow-[0_20px_60px_rgba(0,0,0,0.35)] backdrop-blur-xl">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-white/6 text-left">
              <thead className="bg-black/20">
                <tr>
                  {['Event', 'User ID', 'IP', 'Path', 'Status', 'Timestamp'].map((column) => (
                    <th
                      key={column}
                      className="px-4 py-4 text-[11px] font-semibold uppercase tracking-[0.22em] text-neutral-500"
                    >
                      {column}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/6">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-neutral-400">
                      Loading security logs...
                    </td>
                  </tr>
                ) : logs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-neutral-400">
                      No matching security logs found.
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id} className="align-top">
                      <td className="px-4 py-4">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-[12px] font-semibold text-white">
                            {log.event}
                          </span>
                          {log.suspicious ? (
                            <span className="rounded-full border border-amber-400/20 bg-amber-400/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-amber-300">
                              Suspicious{log.suspiciousCount ? ` (${log.suspiciousCount})` : ''}
                            </span>
                          ) : null}
                        </div>
                        {log.metadata ? (
                          <details className="mt-3 rounded-[16px] border border-white/6 bg-black/20 p-3 text-[12px] text-neutral-300">
                            <summary className="cursor-pointer font-medium text-neutral-200">Metadata</summary>
                            <pre className="mt-3 overflow-x-auto whitespace-pre-wrap break-words text-[11px] leading-5 text-neutral-400">
                              {prettyJson(log.metadata)}
                            </pre>
                          </details>
                        ) : null}
                      </td>
                      <td className="px-4 py-4 text-[14px] text-neutral-200">
                        <div>{log.userId ?? 'Guest'}</div>
                        {log.user?.email ? (
                          <div className="mt-1 text-[12px] text-neutral-500">{log.user.email}</div>
                        ) : null}
                      </td>
                      <td className="px-4 py-4 text-[14px] text-neutral-200">{log.ip || 'unknown'}</td>
                      <td className="px-4 py-4 text-[14px] text-neutral-200">
                        <div>{log.path || '-'}</div>
                        {log.method ? <div className="mt-1 text-[12px] text-neutral-500">{log.method}</div> : null}
                      </td>
                      <td className="px-4 py-4 text-[14px] text-neutral-200">{log.status ?? '-'}</td>
                      <td className="px-4 py-4 text-[14px] text-neutral-200">{formatTimestamp(log.createdAt)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
