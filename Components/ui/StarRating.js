'use client'

import { Star } from 'lucide-react'

export default function StarRating({ rating = 0, totalReviews = 0, size = 'sm', interactive = false, value = 0, onChange }) {
  const activeRating = interactive ? value : Number(rating || 0)
  const starSize = size === 'lg' ? 'h-5 w-5' : 'h-4 w-4'

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => {
          const filled = activeRating >= star

          if (interactive) {
            return (
              <button
                key={star}
                type="button"
                onClick={() => onChange?.(star)}
                className="transition-transform hover:scale-110"
                aria-label={`Rate ${star} stars`}
              >
                <Star className={`${starSize} ${filled ? 'fill-amber-400 text-amber-400' : 'text-slate-500'}`} />
              </button>
            )
          }

          return (
            <Star
              key={star}
              className={`${starSize} ${filled ? 'fill-amber-400 text-amber-400' : 'text-slate-500'}`}
            />
          )
        })}
      </div>

      {!interactive ? (
        <span className="text-sm text-slate-300">
          {rating ? `${Number(rating).toFixed(1)}${totalReviews ? ` (${totalReviews})` : ''}` : 'No reviews yet'}
        </span>
      ) : null}
    </div>
  )
}
