'use client'

import { motion } from 'framer-motion'
import { useEffect, useMemo, useState } from 'react'

const initialForm = {
  name: '',
  description: '',
  category: '',
  tags: '',
  pricing: '',
  url: '',
}

const categoryOptions = [
  'Writing',
  'Coding',
  'Image',
  'Video',
  'Audio',
  'Research',
  'Productivity',
  'Design',
  'Marketing',
  'Automation',
  'Other',
]

const pricingOptions = ['free', 'freemium', 'paid', 'enterprise']
const cooldownKey = 'submit-tool-last-submission-at'

function isValidUrl(value) {
  try {
    const url = new URL(value)
    return url.protocol === 'https:' || url.protocol === 'http:'
  } catch {
    return false
  }
}

export default function SubmitTool() {
  const [form, setForm] = useState(initialForm)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [humanCheck, setHumanCheck] = useState(false)
  const [qualityCheck, setQualityCheck] = useState(false)
  const [honeypot, setHoneypot] = useState('')
  const [cooldownUntil, setCooldownUntil] = useState(0)

  useEffect(() => {
    const lastSubmissionAt = Number(window.localStorage.getItem(cooldownKey) || 0)

    if (lastSubmissionAt) {
      setCooldownUntil(lastSubmissionAt + 60 * 1000)
    }
  }, [])

  const descriptionLength = form.description.trim().length
  const websiteLooksValid = isValidUrl(form.url)
  const nameLooksValid = form.name.trim().length >= 3
  const readyToSubmit =
    humanCheck &&
    qualityCheck &&
    !honeypot &&
    nameLooksValid &&
    descriptionLength >= 60 &&
    websiteLooksValid &&
    Date.now() >= cooldownUntil

  const cooldownLabel = useMemo(() => {
    if (!cooldownUntil || Date.now() >= cooldownUntil) {
      return ''
    }

    const secondsLeft = Math.max(1, Math.ceil((cooldownUntil - Date.now()) / 1000))
    return `Please wait ${secondsLeft}s before sending another submission.`
  }, [cooldownUntil, submitting])

  function handleChange(event) {
    const { name, value } = event.target
    setForm((current) => ({
      ...current,
      [name]: value,
    }))
    setError('')
  }

  async function handleSubmit(event) {
    event.preventDefault()

    if (!readyToSubmit) {
      setError('Please complete the verification checks and fill in a real tool profile before submitting.')
      return
    }

    if (honeypot) {
      setError('Submission blocked.')
      return
    }

    setSubmitting(true)
    setSuccess(false)
    setError('')

    try {
      const response = await fetch('/api/submit-tool', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(form),
      })

      if (!response.ok) {
        throw new Error('Submission failed')
      }

      const now = Date.now()
      window.localStorage.setItem(cooldownKey, String(now))
      setCooldownUntil(now + 60 * 1000)
      setForm(initialForm)
      setHumanCheck(false)
      setQualityCheck(false)
      setSuccess(true)
    } catch {
      setError('We could not submit this tool right now. Please try again in a moment.')
      setSuccess(false)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto w-full max-w-6xl">
      <div className="grid gap-8 lg:grid-cols-[0.95fr,1.2fr]">
        <motion.div
          initial={{ opacity: 0, x: -24 }}
          animate={{ opacity: 1, x: 0 }}
          className="rounded-[32px] border border-white/5 bg-[#111111] p-8 shadow-elevated sm:p-12"
        >
          <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-neutral-500">
            Curated Intake
          </p>
          <h2 className="text-[32px] font-semibold tracking-tight text-white sm:leading-[1.1]">
            Built for serious submissions, not drive-by spam
          </h2>
          <p className="mt-4 text-[15px] leading-relaxed text-neutral-400 font-medium">
            We want real tools with clear value, a working site, and enough context for review. This page intentionally asks for stronger signals before anything goes into the queue.
          </p>

          <div className="mt-10 space-y-4">
            {[
              "Use the tool's real public name, not a keyword-stuffed variation.",
              'Write a specific description that explains what the product actually does.',
              'Share the official website, not an affiliate or redirect URL.',
              'Only submit tools you have personally used, reviewed, or verified.',
            ].map((item) => (
               <div
                key={item}
                className="rounded-[20px] border border-white/5 bg-[#141414] px-5 py-4 text-[14px] font-medium leading-relaxed text-neutral-300"
              >
                {item}
              </div>
            ))}
          </div>

          <div className="mt-8 rounded-[20px] border border-amber-500/10 bg-amber-500/5 p-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-amber-500/70">
              Review Note
            </p>
            <p className="mt-3 text-[14px] leading-relaxed font-medium text-amber-100/70">
              Low-effort, duplicate, fake, or unclear submissions are easy to reject. A well-written entry gets reviewed much faster.
            </p>
          </div>
        </motion.div>

        <motion.form
          onSubmit={handleSubmit}
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-[32px] border border-white/5 bg-[#111111] p-8 shadow-elevated sm:p-12"
        >
          <div className="mb-10">
            <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-neutral-500">
              Submit Tool
            </p>
            <h2 className="text-[32px] font-semibold tracking-tight text-white sm:leading-[1.1]">
              Add a Genuine AI Tool
            </h2>
            <p className="mt-4 text-[15px] leading-relaxed text-neutral-400 font-medium">
              Share a verified tool with the catalog. Every submission goes into manual review before it becomes public.
            </p>
          </div>

          <div className="grid gap-6">
            <div>
              <label className="mb-2.5 block text-[13px] font-semibold uppercase tracking-[0.1em] text-neutral-500">
                Name
              </label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                required
                minLength={3}
                className="w-full rounded-[16px] border border-white/10 bg-[#141414] px-4 py-3.5 text-[15px] font-medium text-white outline-none transition focus:border-white/20 focus:bg-[#1a1a1a]"
                placeholder="e.g. Perplexity"
              />
            </div>

            <div>
              <label className="mb-2.5 block text-[13px] font-semibold uppercase tracking-[0.1em] text-neutral-500">
                Description
              </label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                required
                rows={5}
                minLength={60}
                className="w-full rounded-[16px] border border-white/10 bg-[#141414] px-4 py-3.5 text-[15px] font-medium text-white outline-none transition focus:border-white/20 focus:bg-[#1a1a1a]"
                placeholder="Explain what the tool does, who it helps, and why it is worth listing."
              />
              <div className="mt-3 flex items-center justify-between text-[12px] font-medium">
                <span className="text-neutral-500">Minimum 60 characters so the review queue gets real context.</span>
                <span className={descriptionLength >= 60 ? 'text-white' : 'text-neutral-500'}>
                  {descriptionLength}/60
                </span>
              </div>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <label className="mb-2.5 block text-[13px] font-semibold uppercase tracking-[0.1em] text-neutral-500">
                  Category
                </label>
                <select
                  name="category"
                  value={form.category}
                  onChange={handleChange}
                  required
                  className="w-full rounded-[16px] border border-white/10 bg-[#141414] px-4 py-3.5 text-[15px] font-medium text-white outline-none transition focus:border-white/20 focus:bg-[#1a1a1a]"
                >
                  <option value="" className="text-neutral-500">
                    Select a category
                  </option>
                  {categoryOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2.5 block text-[13px] font-semibold uppercase tracking-[0.1em] text-neutral-500">
                  Pricing
                </label>
                <select
                  name="pricing"
                  value={form.pricing}
                  onChange={handleChange}
                  required
                  className="w-full rounded-[16px] border border-white/10 bg-[#141414] px-4 py-3.5 text-[15px] font-medium text-white outline-none transition focus:border-white/20 focus:bg-[#1a1a1a]"
                >
                  <option value="" className="text-neutral-500">
                    Select pricing
                  </option>
                  {pricingOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="mb-2.5 block text-[13px] font-semibold uppercase tracking-[0.1em] text-neutral-500">
                Tags
              </label>
              <input
                type="text"
                name="tags"
                value={form.tags}
                onChange={handleChange}
                className="w-full rounded-[16px] border border-white/10 bg-[#141414] px-4 py-3.5 text-[15px] font-medium text-white outline-none transition focus:border-white/20 focus:bg-[#1a1a1a]"
                placeholder="e.g. Writing, Coding, Research"
              />
              <p className="mt-3 text-[13px] font-medium text-neutral-500">
                Add a few specific tags separated by commas so the tool is easier to discover.
              </p>
            </div>

            <div>
              <label className="mb-2.5 block text-[13px] font-semibold uppercase tracking-[0.1em] text-neutral-500">
                Website URL
              </label>
              <input
                type="url"
                name="url"
                value={form.url}
                onChange={handleChange}
                required
                className="w-full rounded-[16px] border border-white/10 bg-[#141414] px-4 py-3.5 text-[15px] font-medium text-white outline-none transition focus:border-white/20 focus:bg-[#1a1a1a]"
                placeholder="https://official-tool-site.com"
              />
              <p className={`mt-3 text-[13px] font-medium ${websiteLooksValid || !form.url ? 'text-neutral-500' : 'text-rose-400'}`}>
                Use the official product URL so the listing can be verified quickly.
              </p>
            </div>

            <div className="hidden">
              <label htmlFor="company-site">Company site</label>
              <input
                id="company-site"
                type="text"
                name="company_site"
                value={honeypot}
                onChange={(event) => setHoneypot(event.target.value)}
                autoComplete="off"
                tabIndex={-1}
              />
            </div>
          </div>

          <div className="mt-8 space-y-4 rounded-[20px] border border-white/5 bg-[#141414] p-6">
            <label className="flex items-start gap-4 text-[14px] leading-relaxed font-medium text-neutral-300">
              <input
                type="checkbox"
                checked={humanCheck}
                onChange={(event) => setHumanCheck(event.target.checked)}
                className="mt-1 h-4 w-4 rounded border-white/20 bg-transparent text-white focus:ring-white"
              />
              <span>I'm a real person and this is a genuine AI tool submission.</span>
            </label>

            <label className="flex items-start gap-4 text-[14px] leading-relaxed font-medium text-neutral-300">
              <input
                type="checkbox"
                checked={qualityCheck}
                onChange={(event) => setQualityCheck(event.target.checked)}
                className="mt-1 h-4 w-4 rounded border-white/20 bg-transparent text-white focus:ring-white"
              />
              <span>I've personally checked the tool and the website works, matches the name, and deserves review.</span>
            </label>
          </div>

          <div className="mt-10 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            {success ? (
              <p className="text-[14px] font-medium text-white">
                Tool submitted successfully and sent for review.
              </p>
            ) : error ? (
              <p className="text-[14px] font-medium text-rose-400">{error}</p>
            ) : cooldownLabel ? (
              <p className="text-[14px] font-medium text-amber-500/70">{cooldownLabel}</p>
            ) : (
              <p className="text-[14px] font-medium text-neutral-500 max-w-[280px]">
                Only high-quality, reviewable submissions move smoothly through the queue.
              </p>
            )}

            <motion.button
              type="submit"
              disabled={submitting || !readyToSubmit}
              whileTap={{ scale: 0.97 }}
              className="rounded-[18px] bg-white px-8 py-4 text-[15px] font-semibold text-black shadow-sm transition hover:scale-105 disabled:cursor-not-allowed disabled:opacity-60 whitespace-nowrap"
            >
              {submitting ? 'Submitting...' : 'Submit Tool'}
            </motion.button>
          </div>
        </motion.form>
      </div>
    </div>
  )
}
