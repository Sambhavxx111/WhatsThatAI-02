'use client'

import clsx from 'clsx'
import { motion } from 'framer-motion'
import { ArrowUpRight, Loader2, Search, Upload } from 'lucide-react'
import { useRef, useState } from 'react'

export default function SearchBar({
  placeholder = 'Search...',
  size = 'medium',
  value,
  onChange,
  onSubmit,
  onUpload,
  isLoading = false,
}) {
  const [isFocused, setIsFocused] = useState(false)
  const fileInputRef = useRef(null)

  const sizeStyles = {
    medium: 'min-h-[64px] rounded-[24px]',
    large: 'min-h-[80px] rounded-[32px]',
  }

  function handleSubmit(event) {
    event.preventDefault()
    onSubmit?.()
  }

  function handleFileChange(event) {
    const file = event.target.files?.[0]

    if (file) {
      onUpload?.(file)
    }

    event.target.value = ''
  }

  return (
    <motion.form
      onSubmit={handleSubmit}
      className={clsx(
        'group relative flex w-full items-center overflow-hidden border bg-white transition-all duration-300',
        sizeStyles[size],
        isFocused ? 'border-sky-300 shadow-[0_8px_30px_rgb(0,0,0,0.08)] ring-4 ring-sky-100' : 'border-slate-200 shadow-sm'
      )}
      animate={{ scale: isFocused ? 1.01 : 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
    >
      <div className="flex h-full w-full flex-col gap-2 p-2 sm:flex-row sm:items-center sm:gap-4">
        <div className="flex h-full flex-1 items-center rounded-full px-4 sm:px-6">
          <Search className="mr-3 h-5 w-5 flex-shrink-0 text-slate-400 transition-colors group-focus-within:text-sky-500" />
          <input
            type="text"
            value={value}
            onChange={(event) => onChange?.(event.target.value)}
            placeholder={placeholder}
            className="min-w-0 flex-1 bg-transparent text-slate-900 placeholder:text-slate-400 outline-none text-[15px] font-medium"
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
          />
        </div>

        <div className="flex items-center justify-end gap-2 px-2 pb-2 sm:px-0 sm:pb-0 sm:pr-2">
          {onUpload ? (
            <>
              <input
                ref={fileInputRef}
                type="file"
                accept="video/*"
                className="hidden"
                onChange={handleFileChange}
              />
              <motion.button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex h-10 sm:h-[48px] items-center justify-center gap-2 rounded-[18px] bg-slate-50 border border-slate-200 px-4 text-[13px] font-semibold text-slate-600 shadow-sm transition hover:bg-slate-100 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                disabled={isLoading}
              >
                <Upload className="h-4 w-4" />
                Upload
              </motion.button>
            </>
          ) : null}

          {onSubmit ? (
            <motion.button
              type="submit"
              className="inline-flex h-10 sm:h-[48px] min-w-[120px] items-center justify-center gap-2 rounded-[18px] bg-sky-500 px-5 text-[14px] font-semibold text-white shadow-sm transition hover:bg-sky-600 disabled:cursor-not-allowed disabled:opacity-50"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  Analyze
                  <ArrowUpRight className="h-4 w-4" />
                </>
              )}
            </motion.button>
          ) : null}
        </div>
      </div>
    </motion.form>
  )
}
