'use client'

import { motion } from 'framer-motion'
import ToolCard from '@/components/ui/ToolCard'
import SearchBar from '@/components/ui/SearchBar'
import { useState, useEffect } from 'react'

export default function ToolsPage() {
  const [tools, setTools] = useState([])
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    fetch('/api/tools')
      .then((res) => res.json())
      .then((data) => setTools(data))
  }, [])

  const filteredTools = tools.filter(
    (tool) =>
      tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tool.category.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-slate-950 pt-24 pb-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-4">
            All AI Tools
          </h1>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">Browse our curated collection of AI tools</p>
        </motion.div>

        <div className="max-w-2xl mx-auto mb-12">
          <SearchBar value={searchQuery} onChange={setSearchQuery} placeholder="Search tools..." />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTools.map((tool, index) => (
            <ToolCard key={tool.id} tool={tool} index={index} />
          ))}
        </div>
      </div>
    </div>
  )
}
