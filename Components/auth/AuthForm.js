'use client'

import clsx from 'clsx'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowRight, ShieldCheck, Sparkles } from 'lucide-react'

export default function AuthForm({ mode = 'login' }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const isSignup = mode === 'signup'
  const nextPath = searchParams.get('next') || '/tools'

  async function handleSubmit(event) {
    event.preventDefault()
    setSubmitting(true)
    setError('')

    try {
      const response = await fetch(`/api/auth/${isSignup ? 'signup' : 'login'}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          email,
          password,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Authentication failed.')
      }

      window.dispatchEvent(new Event('auth-changed'))
      router.push(nextPath)
      router.refresh()
    } catch (authError) {
      setError(authError.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <motion.form
      onSubmit={handleSubmit}
      initial={{ opacity: 0, y: 24, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className="relative overflow-hidden rounded-[32px] border border-slate-200 bg-white p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] sm:p-12"
    >
      <div className="relative z-10">
        <div className="mb-10 flex flex-wrap items-center justify-between gap-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-600">
            <Sparkles className="h-3 w-3 text-blue-500" />
            {isSignup ? 'Create Account' : 'Welcome Back'}
          </div>
          <div className="inline-flex items-center gap-1.5 px-2 py-2 text-[12px] font-medium text-slate-400">
            <ShieldCheck className="h-4 w-4" />
            Secure
          </div>
        </div>

        <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-[40px] sm:leading-[1.1]">
          {isSignup ? 'Join WhatsThatAI' : 'Log in to continue'}
        </h1>
        <p className="mt-4 max-w-lg text-[15px] leading-relaxed text-slate-500 font-medium">
          {isSignup
            ? 'Create your account to rate tools, save your collection, and build a more personalized discovery flow.'
            : 'Access your account to review tools, track activity, and jump back into your saved collection.'}
        </p>

        <div className="mt-8 grid gap-5">
          {isSignup ? (
            <div>
              <label className="mb-2.5 block text-[13px] font-bold uppercase tracking-[0.1em] text-slate-500">Name</label>
              <input
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
                className="w-full rounded-[16px] border border-slate-200 bg-slate-50 px-4 py-3.5 text-[15px] font-semibold text-slate-900 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100 placeholder:text-slate-400"
                placeholder="Your name"
              />
            </div>
          ) : null}

          <div>
            <label className="mb-2.5 block text-[13px] font-bold uppercase tracking-[0.1em] text-slate-500">Email</label>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              className="w-full rounded-[16px] border border-slate-200 bg-slate-50 px-4 py-3.5 text-[15px] font-semibold text-slate-900 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100 placeholder:text-slate-400"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="mb-2.5 block text-[13px] font-bold uppercase tracking-[0.1em] text-slate-500">Password</label>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              minLength={6}
              className="w-full rounded-[16px] border border-slate-200 bg-slate-50 px-4 py-3.5 text-[15px] font-semibold text-slate-900 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100 placeholder:text-slate-400"
              placeholder="Minimum 6 characters"
            />
          </div>
        </div>

        {error ? (
          <p className="mt-5 rounded-[12px] border border-rose-500/20 bg-rose-50 px-4 py-3 text-[14px] font-bold text-rose-600">
            {error}
          </p>
        ) : null}

        <div className="mt-10 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[14px] font-medium text-slate-500">
            {isSignup ? 'Already have an account?' : 'New here?'}{' '}
            <a
              href={isSignup ? '/login' : '/signup'}
              
              className="font-bold text-blue-600 transition hover:text-blue-500 hover:underline"
            >
              {isSignup ? 'Log in' : 'Create one'}
            </a>
          </p>

          <button
            type="submit"
            disabled={submitting}
            className={clsx(
              'inline-flex items-center justify-center gap-2 rounded-[18px] bg-slate-900 px-6 py-3.5 text-[14px] font-bold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60',
              submitting && 'scale-[0.99] hover:scale-[0.99]'
            )}
          >
            {submitting ? 'Please wait...' : isSignup ? 'Create Account' : 'Log In'}
            {!submitting ? <ArrowRight className="h-4 w-4" /> : null}
          </button>
        </div>
      </div>
    </motion.form>
  )
}
