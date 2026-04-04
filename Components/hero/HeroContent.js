'use client'

import { motion } from 'framer-motion'
import { ArrowRight, PlayCircle, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import SearchBar from '../ui/SearchBar'

const stats = [
  { label: 'Approved tools', value: '1.4K+' },
  { label: 'Premium lookup flow', value: 'Realtime' },
  { label: 'Review-backed catalog', value: 'Human curated' },
]

export default function HeroContent() {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [detectedText, setDetectedText] = useState('')
  const [matches, setMatches] = useState([])
  const revealRef = useRef(null)

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger)

    if (!revealRef.current) return

    const elements = revealRef.current.querySelectorAll('[data-hero-reveal]')
    const statElements = revealRef.current.querySelectorAll('[data-hero-stat]')

    const tween = gsap.fromTo(
      elements,
      { y: 26, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 1,
        ease: 'power3.out',
        stagger: 0.1,
      }
    )

    const statTween = gsap.fromTo(
      statElements,
      { y: 34, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 0.9,
        ease: 'power3.out',
        stagger: 0.08,
        scrollTrigger: {
          trigger: revealRef.current,
          start: 'top 62%',
        },
      }
    )

    return () => {
      tween.kill()
      statTween.kill()
    }
  }, [])

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

    try {
      const response = await fetch('/api/identify-video', requestInit)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data?.error || 'Could not analyze this video.')
      }

      setDetectedText(data.detectedText || '')
      setMatches(Array.isArray(data.matches) ? data.matches : [])
    } catch (requestError) {
      setError(requestError.message || 'Could not analyze this video.')
    } finally {
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
    <div ref={revealRef} className="mx-auto max-w-6xl text-center z-10 relative">
      <motion.div
        data-hero-reveal
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="mx-auto mb-8 inline-flex items-center gap-2 rounded-[14px] border border-slate-200 bg-white px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500 shadow-sm"
      >
        Premium AI Discovery
      </motion.div>

      <div data-hero-reveal className="mx-auto max-w-5xl">
        <h1 className="section-title text-6xl font-semibold leading-[0.9] text-slate-900 tracking-[-0.04em] sm:text-7xl lg:text-[7.5rem]">
          Discover AI Tools <br />Instantly
        </h1>
        <p className="mx-auto mt-8 max-w-2xl text-balance text-[17px] font-medium leading-relaxed text-slate-500 sm:text-lg">
          Search, analyze, and identify tools from videos with a calmer, premium workflow designed to feel effortless from the first scroll.
        </p>
      </div>

      <div data-hero-reveal className="mt-10 flex flex-wrap items-center justify-center gap-4">
        <Link
          href="/tools"
          className="inline-flex h-[48px] items-center justify-center gap-2 rounded-[18px] bg-slate-900 px-6 text-[15px] font-semibold text-white shadow-sm transition hover:bg-slate-800"
        >
          Browse marketplace
        </Link>
        <div className="inline-flex h-[48px] items-center justify-center gap-2 rounded-[18px] border border-slate-200 bg-white px-6 text-[14px] font-medium text-slate-600 shadow-sm transition-colors">
          <PlayCircle className="h-4 w-4 text-slate-400" />
          Reel URL, upload, or direct search
        </div>
      </div>

      <div data-hero-reveal className="mx-auto mt-16 max-w-4xl">
        <SearchBar
          placeholder="Paste an Instagram Reel URL, upload a video, or search by tool name"
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

        <div className="mt-5 flex flex-wrap items-center justify-center gap-4 text-[13px] font-medium text-slate-500">
          <span>Instagram Reel analysis</span>
          <span className="hidden h-1 w-1 rounded-full bg-slate-300 sm:block" />
          <span>Local clip upload</span>
          <span className="hidden h-1 w-1 rounded-full bg-slate-300 sm:block" />
          <span>Direct marketplace search</span>
        </div>

        {error ? (
          <div className="mt-6 rounded-[24px] border border-rose-500/20 bg-rose-500/5 px-6 py-5 text-left">
            <p className="text-[14px] font-medium text-rose-300">{error}</p>
          </div>
        ) : null}

        {detectedText || matches.length > 0 ? (
          <div className="mt-8 rounded-[32px] border border-slate-200 bg-white p-8 text-left shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-slate-500">
                  Detection Result
                </p>
                <h3 className="mt-3 text-2xl font-bold tracking-tight text-slate-900">
                  {matches.length > 0
                    ? `${matches.length} possible tool match${matches.length === 1 ? '' : 'es'} found`
                    : 'No confident tool match yet'}
                </h3>
              </div>
              <Link
                href="/tools"
                className="rounded-full border border-slate-200 bg-slate-50 px-5 py-2.5 text-[14px] font-medium text-slate-600 transition hover:bg-slate-100"
              >
                Browse all
              </Link>
            </div>

            {detectedText ? (
              <p className="mt-5 text-[14px] leading-7 text-slate-500 font-medium">
                <span className="font-semibold text-slate-900">OCR text:</span> {detectedText}
              </p>
            ) : null}

            {matches.length > 0 ? (
              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                {matches.map((tool) => (
                  <Link
                    key={tool.id}
                    href={`/tools/${tool.slug || tool.name.toLowerCase().replace(/\s+/g, '-')}`}
                    className="group rounded-[24px] border border-slate-200 bg-slate-50 p-6 transition-all hover:bg-white hover:shadow-sm"
                  >
                    <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                      {tool.category || 'AI Tool'}
                    </p>
                    <h4 className="mt-3 text-[17px] font-bold tracking-tight text-slate-900 group-hover:text-blue-600">{tool.name}</h4>
                    <p className="mt-2 line-clamp-2 text-[14px] leading-relaxed text-slate-500 font-medium">
                      {tool.description || 'No description available.'}
                    </p>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="mt-6 text-[14px] font-medium leading-7 text-slate-500">
                The video was processed, but nothing in the current approved tool catalog matched the detected on-screen text closely enough yet.
              </p>
            )}
          </div>
        ) : null}
      </div>

      <div data-hero-reveal className="mx-auto mt-20 grid max-w-5xl grid-cols-1 gap-6 sm:grid-cols-3">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            data-hero-stat
            whileHover={{ y: -4, scale: 1.02 }}
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.55, delay: 0.08 * index }}
            className="flex flex-col items-center justify-center rounded-[24px] border border-slate-200 bg-white px-6 py-8 text-center shadow-sm transition-colors hover:bg-slate-50"
          >
            <p className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">{stat.value}</p>
            <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
              {stat.label}
            </p>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
