'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useState } from 'react'

export default function AdminDashboard() {
  const [tools, setTools] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeId, setActiveId] = useState(null)

  useEffect(() => {
    let mounted = true

    async function loadTools() {
      try {
        const response = await fetch('/api/admin/pending', {
          credentials: 'include',
        })

        if (!response.ok) {
          throw new Error('Unauthorized')
        }

        const data = await response.json()

        if (mounted) {
          setTools(Array.isArray(data) ? data : [])
        }
      } catch {
        if (mounted) {
          setTools([])
        }
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    loadTools()

    return () => {
      mounted = false
    }
  }, [])

  async function updateStatus(id, status) {
    const previousTools = tools
    setActiveId(id)
    setTools((current) => current.filter((tool) => tool.id !== id))

    try {
      const response = await fetch('/api/admin/update-status', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id, status }),
      })

      if (!response.ok) {
        throw new Error('Failed to update status')
      }
    } catch {
      setTools(previousTools)
    } finally {
      setActiveId(null)
    }
  }

  return (
    <div className="min-h-screen bg-[#080808] px-4 py-24 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-14 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.28em] text-neutral-500">
              Team Portal
            </p>
            <h1 className="text-4xl font-semibold tracking-tight sm:text-[44px]">
              Review Pending AI Tools
            </h1>
            <p className="mt-4 max-w-2xl text-[17px] font-medium text-neutral-400">
              Private moderation workspace for your team. Approve or reject submitted tools
              without exposing the queue to public users.
            </p>
          </div>

          <div className="min-w-[148px] rounded-[20px] border border-white/6 bg-white/[0.04] px-6 py-5 shadow-[0_20px_60px_rgba(0,0,0,0.35)] backdrop-blur-xl">
            <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-neutral-500">
              Pending
            </p>
            <p className="mt-2 text-3xl font-semibold text-white">{tools.length}</p>
          </div>
        </div>

        {loading ? (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {[...Array(6)].map((_, index) => (
              <div
                key={index}
                className="h-64 animate-pulse rounded-[24px] border border-white/6 bg-white/[0.04]"
              />
            ))}
          </div>
        ) : tools.length === 0 ? (
          <div className="rounded-[32px] border border-white/6 bg-white/[0.04] px-8 py-24 text-center shadow-[0_20px_60px_rgba(0,0,0,0.35)] backdrop-blur-xl">
            <h2 className="text-2xl font-semibold text-white">No pending tools</h2>
            <p className="mt-3 text-[15px] font-medium text-neutral-400">
              Everything is reviewed for now.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            <AnimatePresence>
              {tools.map((tool) => (
                <motion.div
                  key={tool.id}
                  layout
                  initial={{ opacity: 0, y: 24, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -18, scale: 0.96 }}
                  transition={{ duration: 0.25 }}
                  className="group flex flex-col rounded-[24px] border border-white/6 bg-white/[0.04] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.35)] backdrop-blur-xl transition-colors hover:border-white/12 hover:bg-white/[0.05]"
                >
                  <div className="mb-6 flex-1 space-y-4">
                    <h2 className="text-xl font-semibold tracking-tight text-white">{tool.name}</h2>

                    <p className="text-[14px] font-medium leading-relaxed text-neutral-300">
                      {tool.description || 'No description provided.'}
                    </p>

                    <div className="rounded-[16px] border border-white/6 bg-black/20 p-4">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-neutral-500">
                        Website
                      </p>
                      {tool.websiteUrl ? (
                        <a
                          href={tool.websiteUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-2 block break-all text-[13px] font-medium leading-6 text-neutral-200 transition hover:text-white"
                        >
                          {tool.websiteUrl}
                        </a>
                      ) : (
                        <p className="mt-2 text-[13px] font-medium text-neutral-500">
                          No website URL provided.
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="mt-auto flex gap-3">
                    <button
                      type="button"
                      onClick={() => updateStatus(tool.id, 'approved')}
                      disabled={activeId === tool.id}
                      className="flex-1 rounded-[16px] bg-white px-4 py-3 text-[14px] font-semibold text-black transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      onClick={() => updateStatus(tool.id, 'rejected')}
                      disabled={activeId === tool.id}
                      className="flex-1 rounded-[16px] border border-white/10 bg-transparent px-4 py-3 text-[14px] font-semibold text-white transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Reject
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  )
}
