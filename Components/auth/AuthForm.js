'use client'

import clsx from 'clsx'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowRight, Eye, EyeOff, ShieldCheck, Sparkles } from 'lucide-react'

export default function AuthForm({ mode = 'login' }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [mfaCode, setMfaCode] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [requiresMfa, setRequiresMfa] = useState(false)

  const isSignup = mode === 'signup'
  const nextPath = searchParams.get('redirect') || searchParams.get('next') || '/tools'

  async function handleSubmit(event) {
    event.preventDefault()
    setSubmitting(true)
    setError('')
    setMessage('')

    try {
      if (requiresMfa) {
        const verifyResponse = await fetch('/api/auth/admin-mfa/verify', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            code: mfaCode,
          }),
        })

        const verifyData = await verifyResponse.json()

        if (!verifyResponse.ok) {
          throw new Error(verifyData.error || 'Verification failed.')
        }

        window.dispatchEvent(new Event('auth-changed'))
        window.dispatchEvent(new Event('auth-state-changed'))
        router.push(nextPath)
        router.refresh()
        return
      }

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

      if (data.verificationRequired) {
        setMessage(data.message || 'Check your email to verify your account.')
        setName('')
        setPassword('')
        return
      }

      if (data.requiresMfa) {
        setRequiresMfa(true)
        setMessage(data.message || 'Enter your verification code to continue.')
        return
      }

      window.dispatchEvent(new Event('auth-changed'))
      window.dispatchEvent(new Event('auth-state-changed'))
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
          {requiresMfa ? 'Verify admin sign-in' : isSignup ? 'Join WhatsThatAI' : 'Log in to continue'}
        </h1>
        <p className="mt-4 max-w-lg text-[15px] leading-relaxed text-slate-500 font-medium">
          {requiresMfa
            ? 'Enter the 6-digit verification code we sent to your admin email to complete sign-in.'
            : isSignup
            ? 'Create your account to rate tools, save your collection, and build a more personalized discovery flow.'
            : 'Access your account to review tools, track activity, and jump back into your saved collection.'}
        </p>

        <div className="mt-8 grid gap-5">
          {!requiresMfa && isSignup ? (
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

          {!requiresMfa ? (
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
          ) : null}

          {!requiresMfa ? (
          <div>
            <label className="mb-2.5 block text-[13px] font-bold uppercase tracking-[0.1em] text-slate-500">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                minLength={6}
                className="w-full rounded-[16px] border border-slate-200 bg-slate-50 px-4 py-3.5 pr-14 text-[15px] font-semibold text-slate-900 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100 placeholder:text-slate-400"
                placeholder="Minimum 6 characters"
              />
              <button
                type="button"
                onClick={() => setShowPassword((current) => !current)}
                className="absolute inset-y-0 right-0 inline-flex items-center justify-center px-4 text-slate-400 transition hover:text-slate-700"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>
          ) : null}

          {requiresMfa ? (
            <div>
              <label className="mb-2.5 block text-[13px] font-bold uppercase tracking-[0.1em] text-slate-500">
                Verification Code
              </label>
              <input
                type="text"
                value={mfaCode}
                onChange={(event) => setMfaCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
                required
                inputMode="numeric"
                className="w-full rounded-[16px] border border-slate-200 bg-slate-50 px-4 py-3.5 text-[15px] font-semibold tracking-[0.3em] text-slate-900 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100 placeholder:text-slate-400"
                placeholder="123456"
              />
            </div>
          ) : null}
        </div>

        {message ? (
          <p className="mt-5 rounded-[12px] border border-blue-500/20 bg-blue-50 px-4 py-3 text-[14px] font-bold text-blue-600">
            {message}
          </p>
        ) : null}

        {error ? (
          <p className="mt-5 rounded-[12px] border border-rose-500/20 bg-rose-50 px-4 py-3 text-[14px] font-bold text-rose-600">
            {error}
          </p>
        ) : null}

        <div className="mt-10 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          {!requiresMfa ? (
            <p className="text-[14px] font-medium text-slate-500">
              {isSignup ? 'Already have an account?' : 'New here?'}{' '}
              <a
                href={isSignup ? '/login' : '/signup'}
                className="font-bold text-blue-600 transition hover:text-blue-500 hover:underline"
              >
                {isSignup ? 'Log in' : 'Create one'}
              </a>
            </p>
          ) : (
            <button
              type="button"
              onClick={() => {
                setRequiresMfa(false)
                setMfaCode('')
                setMessage('')
              }}
              className="text-[14px] font-bold text-blue-600 transition hover:text-blue-500 hover:underline"
            >
              Use a different account
            </button>
          )}

          <button
            type="submit"
            disabled={submitting}
            className={clsx(
              'inline-flex items-center justify-center gap-2 rounded-[18px] bg-slate-900 px-6 py-3.5 text-[14px] font-bold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60',
              submitting && 'scale-[0.99] hover:scale-[0.99]'
            )}
          >
            {submitting ? 'Please wait...' : requiresMfa ? 'Verify code' : isSignup ? 'Create Account' : 'Log In'}
            {!submitting ? <ArrowRight className="h-4 w-4" /> : null}
          </button>
        </div>
      </div>
    </motion.form>
  )
}
