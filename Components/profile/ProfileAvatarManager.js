'use client'

import { useEffect, useRef, useState } from 'react'
import UserAvatar from '@/components/ui/UserAvatar'

export default function ProfileAvatarManager() {
  const fileInputRef = useRef(null)
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [avatarRefreshKey, setAvatarRefreshKey] = useState(Date.now())

  async function loadUser() {
    try {
      const response = await fetch('/api/auth/me', {
        cache: 'no-store',
        credentials: 'include',
      })
      const data = await response.json()
      setUser(data.user || null)
    } catch {
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadUser()
  }, [])

  async function handleFileChange(event) {
    const file = event.target.files?.[0]

    if (!file) {
      return
    }

    setUploading(true)
    setError('')
    setMessage('')

    try {
      const formData = new FormData()
      formData.append('avatar', file)

      const response = await fetch('/api/profile/avatar', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Could not upload profile picture.')
      }

      setUser((current) =>
        current
          ? {
              ...current,
              profileImageUrl: data.profileImageUrl,
            }
          : current
      )
      setAvatarRefreshKey(Date.now())
      setMessage('Profile picture updated.')
      window.dispatchEvent(new Event('auth-changed'))
      window.dispatchEvent(new Event('auth-state-changed'))
    } catch (uploadError) {
      setError(uploadError.message)
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  async function handleDelete() {
    setUploading(true)
    setError('')
    setMessage('')

    try {
      const response = await fetch('/api/profile/avatar', {
        method: 'DELETE',
        credentials: 'include',
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Could not remove profile picture.')
      }

      setUser((current) =>
        current
          ? {
              ...current,
              profileImageUrl: null,
            }
          : current
      )
      setAvatarRefreshKey(Date.now())
      setMessage('Profile picture removed.')
      window.dispatchEvent(new Event('auth-changed'))
      window.dispatchEvent(new Event('auth-state-changed'))
    } catch (deleteError) {
      setError(deleteError.message)
    } finally {
      setUploading(false)
    }
  }

  if (loading) {
    return (
      <div className="rounded-[28px] border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-sm font-medium text-slate-500">Loading your profile...</p>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="rounded-[28px] border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-sm font-medium text-slate-500">
          Please sign in to manage your profile picture.
        </p>
      </div>
    )
  }

  const avatarSrc = user?.profileImageUrl
    ? `${user.profileImageUrl}${user.profileImageUrl.includes('?') ? '&' : '?'}v=${avatarRefreshKey}`
    : ''

  return (
    <div className="rounded-[28px] border border-slate-200 bg-white p-8 shadow-sm">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <UserAvatar
            src={avatarSrc}
            alt={`${user.name || user.email} profile picture`}
            size="xl"
            className="shrink-0"
          />
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-sky-600">
              Profile Picture
            </p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
              {user.name || user.email}
            </h1>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Add a profile picture to make your account feel more real and recognizable across the marketplace.
            </p>
          </div>
        </div>
      </div>

      <div className="mt-8 flex flex-wrap items-center gap-3">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          onChange={handleFileChange}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="inline-flex h-[46px] items-center justify-center rounded-[16px] bg-slate-900 px-5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {uploading ? 'Please wait...' : user.profileImageUrl ? 'Update picture' : 'Add picture'}
        </button>
        <button
          type="button"
          onClick={handleDelete}
          disabled={uploading || !user.profileImageUrl}
          className="inline-flex h-[46px] items-center justify-center rounded-[16px] border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Remove picture
        </button>
      </div>

      <p className="mt-4 text-xs font-medium text-slate-400">
        Supports PNG, JPG, and WEBP up to 5MB.
      </p>

      {message ? (
        <p className="mt-4 rounded-[14px] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
          {message}
        </p>
      ) : null}

      {error ? (
        <p className="mt-4 rounded-[14px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
          {error}
        </p>
      ) : null}
    </div>
  )
}
