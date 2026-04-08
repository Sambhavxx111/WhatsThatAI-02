'use client'

import { useEffect, useMemo, useState } from 'react'
import clsx from 'clsx'

const sizeClasses = {
  sm: 'h-9 w-9',
  md: 'h-11 w-11',
  lg: 'h-16 w-16',
  xl: 'h-24 w-24',
}

export default function UserAvatar({
  src = '',
  alt = 'Profile picture',
  size = 'md',
  className = '',
}) {
  const dimensionClass = sizeClasses[size] || sizeClasses.md
  const normalizedSrc = useMemo(() => String(src || '').trim(), [src])
  const [imageFailed, setImageFailed] = useState(false)

  useEffect(() => {
    setImageFailed(false)
  }, [normalizedSrc])

  if (normalizedSrc && !imageFailed) {
    return (
      <div
        className={clsx(
          'overflow-hidden rounded-full border border-slate-200 bg-slate-100 shadow-sm',
          dimensionClass,
          className
        )}
      >
        <img
          src={normalizedSrc}
          alt={alt}
          className="h-full w-full object-cover"
          onError={() => setImageFailed(true)}
        />
      </div>
    )
  }

  return (
    <div
      className={clsx(
        'flex items-center justify-center rounded-full border border-slate-200 bg-gradient-to-b from-slate-100 to-slate-200 text-slate-500 shadow-sm',
        dimensionClass,
        className
      )}
      aria-label={alt}
    >
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-[60%] w-[60%]">
        <path d="M12 12c2.761 0 5-2.686 5-6s-2.239-6-5-6-5 2.686-5 6 2.239 6 5 6Zm0 2c-4.418 0-8 2.91-8 6.5 0 .828.672 1.5 1.5 1.5h13c.828 0 1.5-.672 1.5-1.5 0-3.59-3.582-6.5-8-6.5Z" />
      </svg>
    </div>
  )
}
