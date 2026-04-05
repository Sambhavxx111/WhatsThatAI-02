import Link from 'next/link'
import {
  ArrowUpRight,
  BriefcaseBusiness,
  FileText,
  Layers3,
  ScanSearch,
  Sparkles,
} from 'lucide-react'

const originalFeatures = [
  {
    title: 'Resume Builder',
    description:
      'Create cleaner, sharper resumes with a guided writing workflow built for speed and clarity.',
    Icon: FileText,
  },
  {
    title: 'ATS Optimizer',
    description:
      'Improve resume structure and keyword alignment so applications are more likely to pass screening systems.',
    Icon: Sparkles,
  },
  {
    title: 'JD Matcher',
    description:
      'Compare a resume against a job description and identify where stronger alignment is needed.',
    Icon: ScanSearch,
  },
  {
    title: 'Career Guidance',
    description:
      'Get practical guidance that helps users position their profile better for the roles they want.',
    Icon: BriefcaseBusiness,
  },
]

export const dynamic = 'force-dynamic'

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#FAFAFA] px-4 pb-24 pt-32 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <section className="mx-auto max-w-5xl text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">
            About WhatsThatAI
          </p>
          <h1 className="mt-6 text-balance text-5xl font-semibold tracking-[-0.04em] text-slate-900 sm:text-6xl">
            Building a clearer discovery layer for the AI economy.
          </h1>
          <p className="mx-auto mt-8 max-w-3xl text-[17px] font-medium leading-8 text-slate-500">
            WhatsThatAI is an AI tools marketplace designed to make discovery feel simpler,
            more trustworthy, and more useful for real people. Instead of forcing users to
            dig through noisy directories and scattered recommendations, we are building a
            cleaner way to search, evaluate, save, and understand AI products in one place.
          </p>
        </section>

        <section className="mx-auto mt-16 grid max-w-6xl gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm sm:p-10">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
              What We Are Building
            </p>
            <div className="mt-6 space-y-6 text-[16px] font-medium leading-8 text-slate-600">
              <p>
                The AI ecosystem is growing fast, but discovery is still fragmented. People
                often come across tools through short-form videos, creators, communities, and
                demos, yet there is usually no reliable way to identify what they saw, compare
                alternatives, or come back to it later with confidence.
              </p>
              <p>
                WhatsThatAI solves that by combining a curated AI tools marketplace with more
                practical discovery workflows. Users can browse tools, explore categories, read
                reviews, save products into their own collection, and even analyze videos or
                Instagram Reels to identify which tools may be featured on screen.
              </p>
              <p>
                Our goal is to become more than a directory. We are building a trust layer for
                AI tool discovery, where users can move faster with confidence and where strong
                products can stand out for the right reasons.
              </p>
            </div>
          </div>

          <div className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm sm:p-10">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
              Platform Focus
            </p>
            <div className="mt-8 space-y-4">
              {[
                'Curated marketplace for AI tools',
                'Video and Reel-based tool discovery',
                'Reviews, ratings, and personal collections',
                'Moderation and quality control for submissions',
              ].map((item) => (
                <div
                  key={item}
                  className="flex items-start gap-3 rounded-[20px] border border-slate-200 bg-slate-50 px-4 py-4"
                >
                  <span className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 text-[11px] font-bold text-white">
                    AI
                  </span>
                  <p className="text-[15px] font-semibold leading-6 text-slate-700">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-20 rounded-[36px] border border-slate-200 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 p-8 text-white shadow-[0_20px_60px_rgba(15,23,42,0.16)] sm:p-10 lg:p-12">
          <div className="max-w-4xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-sky-300">
              WhatsThatAI Originals
            </p>
            <h2 className="mt-5 text-4xl font-semibold tracking-[-0.03em] sm:text-5xl">
              Products we build ourselves.
            </h2>
            <p className="mt-6 max-w-3xl text-[16px] font-medium leading-8 text-slate-300">
              WhatsThatAI Originals represents tools built by our own team. Just like a trusted
              in-house label, these products reflect how we think about practical AI experiences:
              focused, useful, and designed around real workflows instead of noise.
            </p>
          </div>

          <div className="mt-12 grid gap-8 lg:grid-cols-[0.85fr_1.15fr]">
            <div className="rounded-[28px] border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
              <div className="flex items-start gap-4">
                <div className="flex h-20 w-20 items-center justify-center rounded-[24px] border border-sky-400/20 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 shadow-[inset_0_0_0_1px_rgba(56,189,248,0.12)]">
                  <div className="flex h-14 w-14 items-center justify-center rounded-[18px] border border-sky-400/20 bg-slate-950 text-[28px] font-bold text-sky-400">
                    R
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-3">
                    <h3 className="text-2xl font-semibold tracking-tight text-white">
                      Resume Engine
                    </h3>
                    <span className="rounded-full border border-sky-400/20 bg-sky-400/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-sky-300">
                      WhatsThatAI Original
                    </span>
                  </div>
                  <p className="mt-3 text-[15px] font-medium leading-7 text-slate-300">
                    Resume Engine is our free career-focused product built to help users improve
                    resumes faster, align them with real job opportunities, and make better
                    progress in their application journey.
                  </p>
                </div>
              </div>

              <div className="mt-6 rounded-[22px] border border-white/10 bg-black/10 p-4">
                <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                  Visit Product
                </p>
                <Link
                  href="https://resume-engine-unified.vercel.app/"
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 inline-flex items-center gap-2 text-[15px] font-semibold text-sky-300 transition hover:text-sky-200"
                >
                  resume-engine-unified.vercel.app
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {originalFeatures.map(({ title, description, Icon }) => (
                <div
                  key={title}
                  className="rounded-[24px] border border-white/10 bg-white/5 p-5 backdrop-blur-sm"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-[16px] border border-sky-400/20 bg-sky-400/10 text-sky-300">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-5 text-lg font-semibold text-white">{title}</h3>
                  <p className="mt-3 text-[14px] font-medium leading-7 text-slate-300">
                    {description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto mt-20 max-w-5xl rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm sm:p-10">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div className="max-w-3xl">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
                Looking Ahead
              </p>
              <h2 className="mt-4 text-3xl font-semibold tracking-tight text-slate-900">
                A marketplace that gets more useful over time.
              </h2>
              <p className="mt-5 text-[16px] font-medium leading-8 text-slate-500">
                As WhatsThatAI grows, the platform will continue to evolve beyond simple tool
                listings into a stronger discovery, trust, and utility layer for AI products.
                That includes better search, clearer validation, original products, and a more
                reliable way for people to discover what is actually worth using.
              </p>
            </div>

            <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-5 sm:min-w-[230px]">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-slate-900 text-white">
                  <Layers3 className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Originals
                  </p>
                  <p className="mt-1 text-[18px] font-semibold text-slate-900">Resume Engine</p>
                </div>
              </div>
              <p className="mt-4 text-[14px] font-medium leading-7 text-slate-500">
                The first product in our WhatsThatAI Originals line, built for real career
                outcomes and practical AI-assisted workflows.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
