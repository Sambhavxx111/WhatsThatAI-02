'use client'

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'

export default function ChatbotWidget({
  isOpen,
  setIsOpen,
  scrollContainerRef,
  user,
  isAuthLoading,
  goal,
  setGoal,
  quickPrompts,
  goToSuggestedTools,
  isLoading,
  message,
  recommendedTools,
  openToolDetails,
  savedToolIds,
  addToCollection,
  router,
  authRedirect,
}) {
  return (
    <AnimatePresence>
      {isOpen ? (
        <motion.div
          initial={{ opacity: 0, y: 12, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.98 }}
          className="absolute bottom-[5.5rem] right-0 flex h-[min(78vh,760px)] w-[calc(100vw-2rem)] sm:w-[380px] origin-bottom-right flex-col overflow-hidden rounded-[28px] border border-slate-200 bg-white/95 shadow-[0_22px_60px_rgba(15,23,42,0.18)] backdrop-blur-2xl"
          onWheelCapture={(event) => event.stopPropagation()}
          onTouchMoveCapture={(event) => event.stopPropagation()}
        >
          <div
            ref={scrollContainerRef}
            className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-5 pt-5 touch-pan-y"
            style={{ WebkitOverflowScrolling: 'touch' }}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-sky-600">
                  WhatsThatAI Guide
                </p>
                <h2 className="mt-2 text-xl font-semibold tracking-tight text-slate-900">
                  What are you trying to do?
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                aria-label="Close guide panel"
              >
                <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                  <path
                    fillRule="evenodd"
                    d="M4.47 4.47a.75.75 0 0 1 1.06 0L10 8.94l4.47-4.47a.75.75 0 1 1 1.06 1.06L11.06 10l4.47 4.47a.75.75 0 0 1-1.06 1.06L10 11.06l-4.47 4.47a.75.75 0 0 1-1.06-1.06L8.94 10 4.47 5.53a.75.75 0 0 1 0-1.06Z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>

            <p className="mt-3 text-sm leading-6 text-slate-500">
              Share a project, workflow, or task. I&apos;ll use our guide model to understand the goal and suggest a few strong fits from the marketplace.
            </p>

            {!isAuthLoading && !user ? (
              <div className="mt-4 rounded-[22px] border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-medium leading-6 text-slate-700">
                  Sign in or sign up to use chatbot recommendations, open guided tool matches, and save tools directly to your collection.
                </p>
                <div className="mt-4 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => router.push(`/login?redirect=${authRedirect}`)}
                    className="inline-flex h-[42px] items-center justify-center rounded-[14px] bg-slate-900 px-4 text-sm font-semibold text-white transition hover:bg-slate-800"
                  >
                    Sign in
                  </button>
                  <button
                    type="button"
                    onClick={() => router.push(`/signup?redirect=${authRedirect}`)}
                    className="inline-flex h-[42px] items-center justify-center rounded-[14px] border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
                  >
                    Sign up
                  </button>
                </div>
              </div>
            ) : (
              <>
                <textarea
                  value={goal}
                  onChange={(event) => setGoal(event.target.value)}
                  placeholder="Example: I need tools for ATS resume optimization and job matching."
                  className="mt-4 h-28 w-full resize-none rounded-[20px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-sky-300 focus:bg-white focus:ring-4 focus:ring-sky-100"
                />

                <div className="mt-4 flex flex-wrap gap-2">
                  {quickPrompts.map((prompt) => (
                    <button
                      key={prompt}
                      type="button"
                      onClick={() => setGoal(prompt)}
                      className="rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-500 transition hover:border-slate-300 hover:text-slate-700"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>

                <div className="mt-5 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => void goToSuggestedTools()}
                    className="inline-flex h-[46px] items-center justify-center rounded-[16px] bg-slate-900 px-5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                    disabled={!goal.trim() || isLoading}
                  >
                    {isLoading ? 'Finding tools...' : 'Show matching tools'}
                  </button>
                  <button
                    type="button"
                    onClick={() => router.push('/tools?source=whatsthatai-original')}
                    className="inline-flex h-[46px] items-center justify-center rounded-[16px] border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
                  >
                    Browse Originals
                  </button>
                </div>
              </>
            )}

            {message ? (
              <p className="mt-4 text-sm font-medium leading-6 text-slate-500">
                {message}
              </p>
            ) : null}

            {recommendedTools.length > 0 ? (
              <div className="mt-4 space-y-3">
                {recommendedTools.map((tool) => (
                  <button
                    key={tool.id}
                    type="button"
                    onClick={() => openToolDetails(tool.slug)}
                    className="block w-full rounded-[20px] border border-slate-200 bg-slate-50 p-4 text-left transition hover:border-slate-300 hover:bg-white"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-sm font-semibold text-slate-900">
                            {tool.name}
                          </h3>
                          <span className="rounded-full border border-slate-200 bg-white px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                            {tool.category}
                          </span>
                        </div>
                        <p className="mt-2 line-clamp-2 text-xs leading-6 text-slate-500">
                          {tool.description}
                        </p>
                        {tool.reason ? (
                          <p className="mt-2 text-[11px] font-medium leading-5 text-sky-700">
                            {tool.reason}
                          </p>
                        ) : null}
                      </div>
                    </div>

                    <div className="mt-4 flex items-center gap-2">
                      <Link
                        href={`/tools/${tool.slug}`}
                        onClick={(event) => event.stopPropagation()}
                        className="inline-flex h-9 items-center justify-center rounded-[12px] bg-slate-900 px-3 text-xs font-semibold text-white transition hover:bg-slate-800"
                      >
                        Open tool
                      </Link>
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation()
                          void addToCollection(tool.id)
                        }}
                        className="inline-flex h-9 items-center justify-center rounded-[12px] border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
                      >
                        {savedToolIds.includes(tool.id) ? 'Saved' : 'Add to Collection'}
                      </button>
                    </div>
                  </button>
                ))}

                <button
                  type="button"
                  onClick={() => router.push('/tools')}
                  className="w-full rounded-[14px] border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
                >
                  See all matching tools
                </button>
              </div>
            ) : null}
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}
