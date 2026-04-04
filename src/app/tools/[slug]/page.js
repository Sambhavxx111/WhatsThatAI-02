'use client'

import { useParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import GlassCard from '@/components/ui/GlassCard'
import Button from '@/components/ui/Button'

export default function ToolPage() {
  const params = useParams()
  const slug = params.slug
  const [tool, setTool] = useState(null)

  useEffect(() => {
    if (!slug) return

    fetch(`/api/tools?slug=${slug}`)
      .then((res) => res.json())
      .then((data) => setTool(data))
  }, [slug])

  if (!tool) {
    return <div className="min-h-screen bg-slate-950 pt-24 text-center text-white">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-slate-950 pt-24 pb-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <GlassCard className="p-8 md:p-12">
            <div className="flex items-center gap-4 mb-6">
              <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${tool.color} flex items-center justify-center text-lg font-semibold`}>
                {tool.icon}
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">{tool.name}</h1>
                <span className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-sm">
                  {tool.category}
                </span>
              </div>
            </div>

            <p className="text-slate-300 text-lg mb-8 leading-relaxed">{tool.description}</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700">
                <h3 className="text-white font-semibold mb-2">Pricing</h3>
                <p className="text-slate-400">{tool.pricing}</p>
              </div>
              <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700">
                <h3 className="text-white font-semibold mb-2">Rating</h3>
                <p className="text-slate-400">{tool.rating ? `Rating: ${tool.rating}/5.0` : 'Rating not available'}</p>
              </div>
            </div>

            <div className="flex gap-4">
              <a href={tool.websiteUrl || '#'} target="_blank" rel="noreferrer" className="flex-1">
                <Button variant="primary" className="w-full">
                  Visit Website
                </Button>
              </a>
              <Button variant="secondary" className="flex-1">
                Save to Collection
              </Button>
            </div>
          </GlassCard>
        </motion.div>
      </div>
    </div>
  )
}
