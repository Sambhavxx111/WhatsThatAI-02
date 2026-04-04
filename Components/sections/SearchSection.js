'use client'

import { motion, useScroll, useTransform } from 'framer-motion'
import { Link as LinkIcon, Sparkles, Upload, Video } from 'lucide-react'
import { useRef, useState } from 'react'

const actions = [
  {
    icon: Upload,
    title: 'Upload a clip',
    body: 'Drop in product demos, client references, and screen captures to uncover the stack behind the visuals.',
    detail: 'Drag and drop ready',
  },
  {
    icon: LinkIcon,
    title: 'Paste a Reel or URL',
    body: 'Instagram-first detection with a streamlined input flow that still feels premium and deliberate.',
    detail: 'Social video parsing',
  },
  {
    icon: Video,
    title: 'Review captured footage',
    body: 'Turn recordings, inspiration boards, and walkthroughs into searchable tool intelligence for your next workflow.',
    detail: 'OCR and matching',
  },
]

export default function SearchSection() {
  const ref = useRef(null)
  const [isDragging, setIsDragging] = useState(false)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })

  const introY = useTransform(scrollYProgress, [0, 1], [50, -50])
  const stageY = useTransform(scrollYProgress, [0, 1], [90, -50])
  const stageRotate = useTransform(scrollYProgress, [0, 1], [2, -2])

  const handleDragOver = (event) => {
    event.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => setIsDragging(false)

  const handleDrop = (event) => {
    event.preventDefault()
    setIsDragging(false)
  }

  return (
    <section
      ref={ref}
      className="relative overflow-hidden px-4 py-28 sm:px-6 lg:px-8 bg-[#FAFAFA]"
    >
      <div className="relative mx-auto max-w-7xl lg:grid lg:grid-cols-[0.88fr_1.12fr] lg:gap-16">
        <motion.div style={{ y: introY }} className="mb-12 lg:sticky lg:top-32 lg:mb-0 lg:self-start">
          <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.25em] text-slate-500">Video Intelligence</p>
          <h2 className="text-balance text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl lg:text-[54px] lg:leading-[1.1]">
            A premium upload flow that feels made for real work.
          </h2>
          <p className="mt-6 max-w-xl text-[17px] leading-relaxed text-slate-500">
            Instead of generic dropzones and busy widgets, the interaction here is calmer, tactile, and built to guide users naturally into analysis.
          </p>

          <div className="mt-10 space-y-3">
            {actions.map((action) => {
              const Icon = action.icon

              return (
                <div key={action.title} className="rounded-[20px] bg-white border border-slate-200 px-6 py-5 shadow-sm transition hover:bg-slate-50">
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-slate-900 text-white shadow-sm shrink-0">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">{action.title}</p>
                      <p className="mt-1.5 text-[14px] leading-relaxed text-slate-500 font-medium">{action.body}</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </motion.div>

        <motion.div style={{ y: stageY, rotateZ: stageRotate }} className="relative">
          <div
            className="relative overflow-hidden rounded-[32px] border border-slate-200 bg-white p-0 shadow-lg"
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="relative z-10 grid gap-0 lg:grid-cols-2">
              <div className="border-b border-slate-100 p-8 lg:border-b-0 lg:border-r">
                <div className="mb-8 flex items-center justify-between">
                  <div className="inline-flex items-center gap-2 rounded-full bg-slate-50 border border-slate-200 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-600">
                    <Sparkles className="h-3 w-3 text-sky-500" />
                    Feature Surface
                  </div>
                  <div className="text-[12px] font-medium text-slate-400">
                    Instagram + Upload
                  </div>
                </div>

                <div
                  className={`flex flex-col items-center justify-center rounded-[24px] border border-dashed py-12 px-6 transition-all duration-300 text-center ${
                    isDragging
                      ? 'border-sky-400 bg-sky-50 shadow-md scale-[1.02]'
                      : 'border-slate-200 bg-slate-50'
                  }`}
                >
                  <div className="flex h-14 w-14 items-center justify-center rounded-[16px] bg-white text-slate-900 border border-slate-200 shadow-sm mb-5">
                    <Upload className="h-5 w-5" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900">Drag in a video to analyze</h3>
                  <p className="mt-2 text-[14px] leading-relaxed text-slate-500 font-medium">
                    The upload zone glows softly on hover and keeps the interaction grounded.
                  </p>
                </div>

                <div className="mt-6 grid gap-2 sm:grid-cols-2">
                  <div className="rounded-[16px] bg-slate-50 border border-slate-200 px-4 py-3">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">Accepted inputs</p>
                    <p className="mt-1 text-[13px] font-bold text-slate-900">MP4, MOV, Reel</p>
                  </div>
                  <div className="rounded-[16px] bg-slate-50 border border-slate-200 px-4 py-3">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">Analysis state</p>
                    <p className="mt-1 text-[13px] font-bold text-slate-900">OCR detection</p>
                  </div>
                </div>
              </div>

              <div className="p-8 bg-slate-50">
                <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-slate-500 mb-6">Experience preview</p>
                <div className="space-y-3">
                  {actions.map((action, index) => {
                    const Icon = action.icon

                    return (
                      <motion.div
                        key={action.title}
                        initial={{ opacity: 0, y: 12 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: '-40px' }}
                        transition={{ duration: 0.4, delay: index * 0.08 }}
                        className="rounded-[18px] bg-white border border-slate-200 px-5 py-4 shadow-sm"
                      >
                        <div className="flex items-center gap-4">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-slate-900 text-white">
                            <Icon className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="font-semibold text-[14px] text-slate-900">{action.title}</p>
                            <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-slate-500 mt-0.5">
                              {action.detail}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
