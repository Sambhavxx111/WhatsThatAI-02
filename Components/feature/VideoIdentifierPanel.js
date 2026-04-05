'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import SearchBar from '@/components/ui/SearchBar'

export default function VideoIdentifierPanel() {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [detectedText, setDetectedText] = useState('')
  const [matches, setMatches] = useState([])

  const REQUEST_TIMEOUT_MS = 45000

  function resetResults() {
    setError('')
    setDetectedText('')
    setMatches([])
  }

  function looksLikeUrl(value) {
    return /^https?:\/\//i.test(value) || value.includes('instagram.com')
  }

  async function runDetection(requestInit) {
    setLoading(true)
    setError('')
    setDetectedText('')
    setMatches([])

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

    try {
      const response = await fetch('/api/identify-video', {
        ...requestInit,
        signal: controller.signal,
      })
      const data = await response.json()

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Please log in to use Reel analysis.')
        }

        if (response.status === 429) {
          throw new Error(data?.error || 'Too many analysis requests. Please try again shortly.')
        }

        throw new Error(data?.error || 'Could not analyze this video.')
      }

      setDetectedText(data.detectedText || '')
      setMatches(Array.isArray(data.matches) ? data.matches : [])
    } catch (requestError) {
      if (requestError?.name === 'AbortError') {
        setError('Analysis is taking too long right now. Please try again in a moment or upload a shorter clip.')
      } else {
        setError(requestError.message || 'Could not analyze this video.')
      }
    } finally {
      clearTimeout(timeoutId)
      setLoading(false)
    }
  }

  async function handleSubmit() {
    const trimmedQuery = query.trim()

    if (!trimmedQuery || loading) {
      return
    }

    if (!looksLikeUrl(trimmedQuery)) {
      router.push(`/tools?q=${encodeURIComponent(trimmedQuery)}`)
      return
    }

    await runDetection({
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url: trimmedQuery }),
    })
  }

  async function handleUpload(file) {
    if (!file || loading) {
      return
    }

    resetResults()

    const formData = new FormData()
    formData.append('file', file)

    await runDetection({
      method: 'POST',
      body: formData,
    })
  }

  return (
    <div className="mx-auto w-full max-w-5xl">
      <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.06)] sm:p-8">
        <div className="max-w-2xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">
            Tool Finder
          </p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-slate-900 sm:text-[50px] sm:leading-[1.02]">
            Paste a Reel URL or upload a clip.
          </h1>
          <p className="mt-5 text-[16px] font-medium leading-8 text-slate-500">
            We will scan the video, extract visible text, and match it against your approved
            AI tool catalog.
          </p>
        </div>

        <div className="mt-10">
          <SearchBar
            placeholder="Paste an Instagram Reel URL, upload a clip, or type a tool name"
            size="large"
            value={query}
            onChange={(value) => {
              setQuery(value)

              if (!value.trim()) {
                resetResults()
              } else {
                setError('')
              }
            }}
            onSubmit={handleSubmit}
            onUpload={handleUpload}
            isLoading={loading}
          />
        </div>

        <div className="mt-5 flex flex-wrap gap-x-4 gap-y-2 text-[13px] font-medium text-slate-500">
          <span>Instagram Reel analysis</span>
          <span>Local video upload</span>
          <span>Direct catalog lookup</span>
        </div>

        {error ? (
          <div className="mt-6 rounded-[24px] border border-rose-500/20 bg-rose-500/5 px-6 py-5 text-left">
            <p className="text-[14px] font-medium text-rose-400">{error}</p>
          </div>
        ) : null}

        {detectedText || matches.length > 0 ? (
          <div className="mt-8 rounded-[28px] border border-slate-200 bg-slate-50 p-6 sm:p-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">
                  Detection Result
                </p>
                <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-900">
                  {matches.length > 0
                    ? `${matches.length} possible tool match${matches.length === 1 ? '' : 'es'} found`
                    : 'No confident tool match yet'}
                </h2>
              </div>
              <Link
                href="/tools"
                className="inline-flex items-center justify-center rounded-[16px] border border-slate-200 bg-white px-5 py-2.5 text-[14px] font-semibold text-slate-700 transition hover:bg-slate-100"
              >
                Browse tools
              </Link>
            </div>

            {detectedText ? (
              <p className="mt-5 text-[14px] font-medium leading-7 text-slate-500">
                <span className="font-semibold text-slate-900">OCR text:</span> {detectedText}
              </p>
            ) : null}

            {matches.length > 0 ? (
              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                {matches.map((tool) => (
                  <Link
                    key={tool.id}
                    href={`/tools/${tool.slug || tool.name.toLowerCase().replace(/\s+/g, '-')}`}
                    className="rounded-[22px] border border-slate-200 bg-white p-5 transition hover:-translate-y-0.5 hover:shadow-sm"
                  >
                    <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                      {tool.category || 'AI Tool'}
                    </p>
                    <h3 className="mt-3 text-[17px] font-semibold tracking-tight text-slate-900">
                      {tool.name}
                    </h3>
                    <p className="mt-2 line-clamp-2 text-[14px] font-medium leading-7 text-slate-500">
                      {tool.description || 'No description available.'}
                    </p>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="mt-6 text-[14px] font-medium leading-7 text-slate-500">
                The video was processed, but nothing in the current approved catalog matched
                the detected on-screen text closely enough yet.
              </p>
            )}
          </div>
        ) : null}
      </div>
    </div>
  )
}
