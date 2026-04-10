'use client'

import { useEffect, useMemo, useState } from 'react'
import { ONBOARDING_CATEGORIES } from '@/lib/onboarding-catalog'

const emptyForm = {
  id: null,
  title: '',
  slug: '',
  description: '',
  summary: '',
  type: 'starter',
  active: true,
  categories: [],
  toolIdsText: '',
}

function slugify(value) {
  return String(value || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export default function CuratedCollectionsManager() {
  const [collections, setCollections] = useState([])
  const [availableTools, setAvailableTools] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  async function loadCollections() {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/curated-collections', {
        credentials: 'include',
        cache: 'no-store',
      })
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'Could not load curated collections.')
      }

      setCollections(Array.isArray(data.collections) ? data.collections : [])
      setAvailableTools(Array.isArray(data.availableTools) ? data.availableTools : [])
    } catch (loadError) {
      setError(loadError.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCollections()
  }, [])

  const availableToolMap = useMemo(
    () => new Map(availableTools.map((tool) => [tool.id, tool])),
    [availableTools]
  )

  function resetForm() {
    setForm(emptyForm)
  }

  function populateForm(collection) {
    setForm({
      id: collection.id,
      title: collection.title,
      slug: collection.slug,
      description: collection.description || '',
      summary: collection.summary || '',
      type: collection.type,
      active: Boolean(collection.active),
      categories: Array.isArray(collection.categories) ? collection.categories : [],
      toolIdsText: collection.items.map((item) => item.tool.id).join(', '),
    })
    setMessage('')
    setError('')
  }

  function toggleCategory(categoryId) {
    setForm((current) => ({
      ...current,
      categories: current.categories.includes(categoryId)
        ? current.categories.filter((item) => item !== categoryId)
        : [...current.categories, categoryId].slice(0, 5),
    }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setSaving(true)
    setMessage('')
    setError('')

    try {
      const toolIds = Array.from(
        new Set(
          form.toolIdsText
            .split(',')
            .map((value) => Number(value.trim()))
            .filter((value) => Number.isFinite(value) && value > 0)
        )
      )

      const payload = {
        title: form.title,
        slug: form.slug || slugify(form.title),
        description: form.description,
        summary: form.summary,
        type: form.type,
        active: form.active,
        categories: form.categories,
        toolIds,
      }

      const endpoint = form.id
        ? `/api/admin/curated-collections/${form.id}`
        : '/api/admin/curated-collections'
      const method = form.id ? 'PATCH' : 'POST'

      const response = await fetch(endpoint, {
        method,
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'Could not save curated collection.')
      }

      setMessage(form.id ? 'Collection updated.' : 'Collection created.')
      resetForm()
      await loadCollections()
    } catch (saveError) {
      setError(saveError.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(collectionId) {
    setSaving(true)
    setMessage('')
    setError('')

    try {
      const response = await fetch(`/api/admin/curated-collections/${collectionId}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'Could not delete collection.')
      }

      setMessage('Collection deleted.')
      if (form.id === collectionId) {
        resetForm()
      }
      await loadCollections()
    } catch (deleteError) {
      setError(deleteError.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#080808] px-4 py-24 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-12">
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-neutral-500">Curated collections</p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight">Build starter and trending stacks</h1>
          <p className="mt-4 max-w-3xl text-[16px] leading-7 text-neutral-400">
            Only admins can edit these collections. They power onboarding suggestions and give users ready-made tool stacks.
          </p>
        </div>

        <div className="grid gap-8 xl:grid-cols-[0.95fr_1.05fr]">
          <form onSubmit={handleSubmit} className="rounded-[28px] border border-white/8 bg-white/[0.04] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
            <div className="mb-6 flex items-center justify-between gap-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-neutral-500">Editor</p>
                <h2 className="mt-2 text-2xl font-semibold text-white">
                  {form.id ? 'Update collection' : 'Create collection'}
                </h2>
              </div>
              {form.id ? (
                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded-full border border-white/10 px-4 py-2 text-sm font-semibold text-neutral-300 transition hover:bg-white/5 hover:text-white"
                >
                  New collection
                </button>
              ) : null}
            </div>

            <div className="grid gap-4">
              <input
                value={form.title}
                onChange={(event) => setForm((current) => ({ ...current, title: event.target.value, slug: current.id ? current.slug : slugify(event.target.value) }))}
                placeholder="Collection title"
                className="rounded-[18px] border border-white/10 bg-black/20 px-4 py-3 text-sm font-medium text-white outline-none transition focus:border-white/20"
              />
              <input
                value={form.slug}
                onChange={(event) => setForm((current) => ({ ...current, slug: slugify(event.target.value) }))}
                placeholder="collection-slug"
                className="rounded-[18px] border border-white/10 bg-black/20 px-4 py-3 text-sm font-medium text-white outline-none transition focus:border-white/20"
              />
              <textarea
                value={form.description}
                onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                rows={3}
                placeholder="Short description"
                className="rounded-[18px] border border-white/10 bg-black/20 px-4 py-3 text-sm font-medium text-white outline-none transition focus:border-white/20"
              />
              <textarea
                value={form.summary}
                onChange={(event) => setForm((current) => ({ ...current, summary: event.target.value }))}
                rows={3}
                placeholder="Internal summary / why this collection exists"
                className="rounded-[18px] border border-white/10 bg-black/20 px-4 py-3 text-sm font-medium text-white outline-none transition focus:border-white/20"
              />

              <div className="grid gap-4 md:grid-cols-2">
                <select
                  value={form.type}
                  onChange={(event) => setForm((current) => ({ ...current, type: event.target.value }))}
                  className="rounded-[18px] border border-white/10 bg-black/20 px-4 py-3 text-sm font-medium text-white outline-none transition focus:border-white/20"
                >
                  <option value="starter">Starter</option>
                  <option value="trending">Trending</option>
                  <option value="custom">Custom</option>
                </select>
                <label className="flex items-center gap-3 rounded-[18px] border border-white/10 bg-black/20 px-4 py-3 text-sm font-medium text-neutral-300">
                  <input
                    type="checkbox"
                    checked={form.active}
                    onChange={(event) => setForm((current) => ({ ...current, active: event.target.checked }))}
                  />
                  Active collection
                </label>
              </div>

              <div>
                <p className="mb-3 text-sm font-semibold text-white">Audience categories</p>
                <div className="flex flex-wrap gap-2">
                  {ONBOARDING_CATEGORIES.map((category) => {
                    const active = form.categories.includes(category.id)
                    return (
                      <button
                        key={category.id}
                        type="button"
                        onClick={() => toggleCategory(category.id)}
                        className={`rounded-full border px-3 py-2 text-xs font-semibold transition ${
                          active
                            ? 'border-white bg-white text-black'
                            : 'border-white/10 bg-black/20 text-neutral-300 hover:border-white/20 hover:text-white'
                        }`}
                      >
                        {category.label}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div>
                <p className="mb-2 text-sm font-semibold text-white">Tool IDs in display order</p>
                <textarea
                  value={form.toolIdsText}
                  onChange={(event) => setForm((current) => ({ ...current, toolIdsText: event.target.value }))}
                  rows={4}
                  placeholder="Example: 2400, 52, 118"
                  className="rounded-[18px] border border-white/10 bg-black/20 px-4 py-3 text-sm font-medium text-white outline-none transition focus:border-white/20"
                />
                <p className="mt-2 text-xs font-medium text-neutral-500">
                  Use comma-separated tool IDs. This makes the setup easy to undo or reorder later.
                </p>
              </div>
            </div>

            {message ? <p className="mt-5 text-sm font-medium text-emerald-400">{message}</p> : null}
            {error ? <p className="mt-5 text-sm font-medium text-rose-400">{error}</p> : null}

            <button
              type="submit"
              disabled={saving}
              className="mt-6 inline-flex h-[48px] items-center justify-center rounded-[18px] bg-white px-6 text-sm font-semibold text-black transition hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? 'Saving...' : form.id ? 'Update collection' : 'Create collection'}
            </button>
          </form>

          <div className="space-y-6">
            <div className="rounded-[28px] border border-white/8 bg-white/[0.04] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-neutral-500">Available tools</p>
              <div className="mt-4 max-h-[280px] overflow-y-auto space-y-3 pr-2">
                {availableTools.map((tool) => (
                  <div key={tool.id} className="rounded-[16px] border border-white/8 bg-black/20 px-4 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-white">{tool.name}</p>
                        <p className="mt-1 text-xs text-neutral-500">{tool.category || 'AI Tools'}</p>
                      </div>
                      <span className="rounded-full border border-white/10 px-3 py-1 text-xs font-semibold text-neutral-300">
                        #{tool.id}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[28px] border border-white/8 bg-white/[0.04] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-neutral-500">Existing collections</p>
              {loading ? (
                <p className="mt-4 text-sm font-medium text-neutral-500">Loading collections...</p>
              ) : collections.length ? (
                <div className="mt-4 space-y-4">
                  {collections.map((collection) => (
                    <div key={collection.id} className="rounded-[20px] border border-white/8 bg-black/20 p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-base font-semibold text-white">{collection.title}</p>
                            <span className="rounded-full border border-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-neutral-400">
                              {collection.type}
                            </span>
                          </div>
                          <p className="mt-2 text-sm leading-6 text-neutral-400">{collection.description || collection.summary || 'No description.'}</p>
                          <div className="mt-3 flex flex-wrap gap-2">
                            {(collection.categories || []).map((category) => (
                              <span key={category} className="rounded-full border border-white/10 px-3 py-1 text-xs font-medium text-neutral-300">
                                {category}
                              </span>
                            ))}
                          </div>
                          {collection.items?.length ? (
                            <div className="mt-4 flex flex-wrap gap-2">
                              {collection.items.slice(0, 4).map((item) => (
                                <span key={item.id} className="rounded-full bg-white/5 px-3 py-1 text-xs font-medium text-neutral-300">
                                  {item.tool?.name || availableToolMap.get(item.tool?.id)?.name || `Tool #${item.tool?.id}`}
                                </span>
                              ))}
                            </div>
                          ) : null}
                        </div>
                        <div className="flex flex-col gap-2">
                          <button
                            type="button"
                            onClick={() => populateForm(collection)}
                            className="rounded-full border border-white/10 px-4 py-2 text-xs font-semibold text-white transition hover:bg-white/5"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(collection.id)}
                            className="rounded-full border border-rose-400/20 px-4 py-2 text-xs font-semibold text-rose-300 transition hover:bg-rose-500/10"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-4 text-sm font-medium text-neutral-500">No curated collections yet.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
