'use client'

import Hero3D from '@/components/hero/Hero3D'
import HeroContent from '@/components/hero/HeroContent'
import FloatingCards from '@/components/hero/FloatingCards'
import SearchSection from '@/components/sections/SearchSection'
import TrendingTools from '@/components/sections/TrendingTools'
import Categories from '@/components/sections/Categories'
import CTASection from '@/components/sections/CTASection'

export default function Home() {
  return (
    <div className="relative">
      {/* Hero Section with 3D Background */}
      <section className="relative h-screen w-full overflow-hidden">
        <Hero3D />
        <div className="absolute inset-0 z-10 pointer-events-none">
          <FloatingCards />
        </div>
        <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
          <div className="pointer-events-auto w-full max-w-6xl px-4">
            <HeroContent />
          </div>
        </div>
      </section>

      {/* Search Section */}
      <SearchSection />

      {/* Trending Tools */}
      <TrendingTools />

      {/* Categories */}
      <Categories />

      {/* CTA Section */}
      <CTASection />
    </div>
  )
}