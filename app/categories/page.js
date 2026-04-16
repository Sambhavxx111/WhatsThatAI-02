import Link from 'next/link'
import {
  Briefcase,
  Code2,
  Headphones,
  Image as ImageIcon,
  Megaphone,
  MessagesSquare,
  Sparkles,
  Video,
  Settings,
  Database,
  PenTool,
  Workflow
} from 'lucide-react'
import { getCategories } from '@/lib/queries'

function categoryVisual(name) {
  const normalized = String(name || '').toLowerCase()

  if (normalized.includes('chat') || normalized.includes('message') || normalized.includes('convers')) {
    return { 
      Icon: MessagesSquare, 
      badge: 'Conversation',
      accentHover: 'hover:border-emerald-200 hover:shadow-emerald-500/10',
      iconTheme: 'bg-emerald-100 text-emerald-600',
      badgeTheme: 'border-emerald-200 bg-emerald-50 text-emerald-600',
      titleHover: 'group-hover:text-emerald-600',
      Decorative: () => (
        <div className="absolute right-4 bottom-4 flex items-end gap-2 px-2 opacity-30 group-hover:opacity-100 transition-all duration-700 pointer-events-none">
          <div className="w-3 h-3 bg-emerald-300 rounded-full group-hover:animate-[bounce_1s_infinite_0ms]" />
          <div className="w-3 h-3 bg-emerald-400 rounded-full group-hover:animate-[bounce_1s_infinite_200ms]" />
          <div className="w-3 h-3 bg-emerald-500 rounded-full group-hover:animate-[bounce_1s_infinite_400ms]" />
        </div>
      )
    }
  }

  if (normalized.includes('image') || normalized.includes('design') || normalized.includes('art') || normalized.includes('visual')) {
    return { 
      Icon: ImageIcon, 
      badge: 'Visual',
      accentHover: 'hover:border-fuchsia-200 hover:shadow-fuchsia-500/10',
      iconTheme: 'bg-fuchsia-100 text-fuchsia-600',
      badgeTheme: 'border-fuchsia-200 bg-fuchsia-50 text-fuchsia-600',
      titleHover: 'group-hover:text-fuchsia-600',
      Decorative: () => (
        <div className="absolute right-4 bottom-4 flex items-end opacity-30 group-hover:opacity-100 transition-all duration-700 pointer-events-none">
          <div className="w-8 h-8 rounded-lg border-2 border-fuchsia-300 transform rotate-12 group-hover:rotate-45 group-hover:scale-110 transition-all duration-500 translate-x-3" />
          <div className="w-10 h-10 rounded-full border-2 border-fuchsia-400 transform -rotate-12 group-hover:-rotate-45 group-hover:scale-110 transition-all duration-500 -translate-x-1 bg-fuchsia-50" />
        </div>
      )
    }
  }

  if (normalized.includes('video') || normalized.includes('motion') || normalized.includes('film')) {
    return { 
      Icon: Video, 
      badge: 'Motion',
      accentHover: 'hover:border-rose-200 hover:shadow-rose-500/10',
      iconTheme: 'bg-rose-100 text-rose-600',
      badgeTheme: 'border-rose-200 bg-rose-50 text-rose-600',
      titleHover: 'group-hover:text-rose-600',
      Decorative: () => (
        <div className="absolute right-5 bottom-5 flex items-center gap-1 opacity-30 group-hover:opacity-100 transition-all duration-700 pointer-events-none">
          {[1,2,3,4].map(i => (
            <div key={i} className="w-3 h-8 bg-rose-200 rounded-sm border border-rose-300 overflow-hidden flex flex-col justify-between py-1 group-hover:-translate-y-1 transition-transform duration-500" style={{ transitionDelay: `${i * 100}ms` }}>
               <div className="w-1 h-1 bg-white rounded-full mx-auto" />
               <div className="w-1 h-1 bg-white rounded-full mx-auto" />
            </div>
          ))}
        </div>
      )
    }
  }

  if (normalized.includes('voice') || normalized.includes('audio') || normalized.includes('music') || normalized.includes('sound')) {
    return { 
      Icon: Headphones, 
      badge: 'Audio',
      accentHover: 'hover:border-sky-200 hover:shadow-sky-500/10',
      iconTheme: 'bg-sky-100 text-sky-600',
      badgeTheme: 'border-sky-200 bg-sky-50 text-sky-600',
      titleHover: 'group-hover:text-sky-600',
      Decorative: () => (
        <div className="absolute right-0 bottom-4 flex items-end gap-1.5 px-6 opacity-30 group-hover:opacity-100 transition-all duration-700 pointer-events-none">
          <div className="w-2 h-6 bg-sky-200 rounded-t-full group-hover:animate-[bounce_1s_infinite_0ms]" />
          <div className="w-2 h-14 bg-sky-300 rounded-t-full group-hover:animate-[bounce_1s_infinite_100ms]" />
          <div className="w-2 h-8 bg-sky-200 rounded-t-full group-hover:animate-[bounce_1s_infinite_200ms]" />
          <div className="w-2 h-16 bg-sky-400 rounded-t-full group-hover:animate-[bounce_1s_infinite_300ms]" />
          <div className="w-2 h-10 bg-sky-300 rounded-t-full group-hover:animate-[bounce_1s_infinite_400ms]" />
          <div className="w-2 h-5 bg-sky-200 rounded-t-full group-hover:animate-[bounce_1s_infinite_500ms]" />
        </div>
      )
    }
  }

  if (normalized.includes('code') || normalized.includes('dev') || normalized.includes('programm')) {
    return { 
      Icon: Code2, 
      badge: 'Developer',
      accentHover: 'hover:border-amber-200 hover:shadow-amber-500/10',
      iconTheme: 'bg-amber-100 text-amber-600',
      badgeTheme: 'border-amber-200 bg-amber-50 text-amber-600',
      titleHover: 'group-hover:text-amber-600',
      Decorative: () => (
        <div className="absolute right-5 bottom-5 flex flex-col items-end gap-1.5 opacity-30 group-hover:opacity-100 transition-all duration-700 pointer-events-none">
          <div className="h-2 w-16 bg-amber-200 rounded-full group-hover:-translate-x-2 transition-transform duration-500" />
          <div className="h-2 w-10 bg-amber-300 rounded-full group-hover:-translate-x-4 transition-transform duration-500 delay-75" />
          <div className="h-2 w-14 bg-amber-400 rounded-full group-hover:-translate-x-1 transition-transform duration-500 delay-150" />
        </div>
      )
    }
  }

  if (normalized.includes('product') || normalized.includes('workflow') || normalized.includes('business')) {
    return { 
      Icon: Workflow, 
      badge: 'Workflow',
      accentHover: 'hover:border-indigo-200 hover:shadow-indigo-500/10',
      iconTheme: 'bg-indigo-100 text-indigo-600',
      badgeTheme: 'border-indigo-200 bg-indigo-50 text-indigo-600',
      titleHover: 'group-hover:text-indigo-600',
      Decorative: () => (
        <div className="absolute right-5 bottom-5 flex items-center gap-1.5 opacity-30 group-hover:opacity-100 transition-all duration-700 pointer-events-none">
          <div className="w-4 h-4 rounded bg-indigo-200 group-hover:rotate-180 transition-transform duration-700" />
          <div className="w-4 h-1 bg-indigo-300 group-hover:scale-x-150 transition-transform duration-500" />
          <div className="w-4 h-4 rounded-full bg-indigo-400 group-hover:scale-125 transition-transform duration-500 delay-100" />
          <div className="w-4 h-1 bg-indigo-300 group-hover:scale-x-150 transition-transform duration-500 delay-100" />
          <div className="w-4 h-4 rounded bg-indigo-500 group-hover:rotate-90 transition-transform duration-700 delay-200" />
        </div>
      )
    }
  }

  if (normalized.includes('market') || normalized.includes('growth') || normalized.includes('seo') || normalized.includes('sales')) {
    return { 
      Icon: Megaphone, 
      badge: 'Marketing',
      accentHover: 'hover:border-blue-200 hover:shadow-blue-500/10',
      iconTheme: 'bg-blue-100 text-blue-600',
      badgeTheme: 'border-blue-200 bg-blue-50 text-blue-600',
      titleHover: 'group-hover:text-blue-600',
      Decorative: () => (
        <div className="absolute right-5 bottom-4 flex items-end gap-1.5 opacity-30 group-hover:opacity-100 transition-all duration-700 pointer-events-none">
           <div className="w-3 bg-blue-200 rounded-t-sm h-4 group-hover:h-8 transition-all duration-500" />
           <div className="w-3 bg-blue-300 rounded-t-sm h-6 group-hover:h-12 transition-all duration-500 delay-75" />
           <div className="w-3 bg-blue-400 rounded-t-sm h-10 group-hover:h-16 transition-all duration-500 delay-150" />
           <div className="w-3 bg-blue-500 rounded-t-sm h-14 group-hover:h-20 transition-all duration-500 delay-200" />
        </div>
      )
    }
  }

  if (normalized.includes('career') || normalized.includes('job') || normalized.includes('hr') || normalized.includes('resume')) {
    return { 
      Icon: Briefcase, 
      badge: 'Career',
      accentHover: 'hover:border-teal-200 hover:shadow-teal-500/10',
      iconTheme: 'bg-teal-100 text-teal-600',
      badgeTheme: 'border-teal-200 bg-teal-50 text-teal-600',
      titleHover: 'group-hover:text-teal-600',
      Decorative: () => (
        <div className="absolute right-5 bottom-4 flex items-end opacity-30 group-hover:opacity-100 transition-all duration-700 pointer-events-none">
          <div className="w-6 h-8 border-2 border-teal-300 rounded overflow-hidden flex flex-col gap-1 p-1 group-hover:-translate-y-2 group-hover:rotate-6 transition-all duration-500 z-10 bg-white">
             <div className="w-full h-1 bg-teal-200 rounded-full" />
             <div className="w-3/4 h-1 bg-teal-200 rounded-full" />
          </div>
          <div className="w-6 h-8 border-2 border-teal-400 rounded overflow-hidden flex flex-col gap-1 p-1 group-hover:-translate-y-4 group-hover:-rotate-6 transition-all duration-500 delay-75 bg-teal-50 -ml-2">
             <div className="w-full h-1 bg-teal-300 rounded-full" />
             <div className="w-3/4 h-1 bg-teal-300 rounded-full" />
             <div className="w-1/2 h-1 bg-teal-300 rounded-full" />
          </div>
        </div>
      )
    }
  }

  if (normalized.includes('automation') || normalized.includes('bot') || normalized.includes('agent')) {
    return { 
      Icon: Settings, 
      badge: 'Automation',
      accentHover: 'hover:border-violet-200 hover:shadow-violet-500/10',
      iconTheme: 'bg-violet-100 text-violet-600',
      badgeTheme: 'border-violet-200 bg-violet-50 text-violet-600',
      titleHover: 'group-hover:text-violet-600',
      Decorative: () => (
        <div className="absolute right-5 bottom-4 flex items-center justify-center opacity-30 group-hover:opacity-100 transition-all duration-700 pointer-events-none">
          <div className="relative w-10 h-10 flex items-center justify-center">
             <div className="absolute inset-0 border-2 border-violet-300 rounded-full border-t-transparent animate-[spin_3s_linear_infinite]" />
             <div className="absolute inset-1.5 border-2 border-violet-400 rounded-full border-b-transparent animate-[spin_2s_linear_infinite_reverse]" />
             <div className="w-2 h-2 bg-violet-500 rounded-full group-hover:scale-150 transition-transform duration-500" />
          </div>
        </div>
      )
    }
  }

  if (normalized.includes('data') || normalized.includes('research') || normalized.includes('search') || normalized.includes('analyt')) {
    return { 
      Icon: Database, 
      badge: 'Data',
      accentHover: 'hover:border-cyan-200 hover:shadow-cyan-500/10',
      iconTheme: 'bg-cyan-100 text-cyan-600',
      badgeTheme: 'border-cyan-200 bg-cyan-50 text-cyan-600',
      titleHover: 'group-hover:text-cyan-600',
      Decorative: () => (
        <div className="absolute right-4 bottom-5 flex flex-col gap-1 opacity-30 group-hover:opacity-100 transition-all duration-700 pointer-events-none">
           <div className="w-10 h-2.5 rounded-full border border-cyan-300 bg-cyan-100 group-hover:-translate-y-1 transition-transform duration-500" />
           <div className="w-10 h-2.5 rounded-full border border-cyan-400 bg-cyan-200 group-hover:-translate-y-2 transition-transform duration-500 delay-75" />
           <div className="w-10 h-2.5 rounded-full border border-cyan-500 bg-cyan-300 group-hover:-translate-y-3 transition-transform duration-500 delay-150" />
        </div>
      )
    }
  }

  if (normalized.includes('write') || normalized.includes('text') || normalized.includes('copy') || normalized.includes('content') || normalized.includes('blog')) {
    return { 
      Icon: PenTool, 
      badge: 'Content',
      accentHover: 'hover:border-orange-200 hover:shadow-orange-500/10',
      iconTheme: 'bg-orange-100 text-orange-600',
      badgeTheme: 'border-orange-200 bg-orange-50 text-orange-600',
      titleHover: 'group-hover:text-orange-600',
      Decorative: () => (
        <div className="absolute right-5 bottom-5 flex flex-col gap-1.5 opacity-30 group-hover:opacity-100 transition-all duration-700 pointer-events-none items-end">
           <div className="w-14 h-1.5 bg-orange-200 rounded-full group-hover:w-16 transition-all duration-500" />
           <div className="w-10 h-1.5 bg-orange-300 rounded-full group-hover:w-12 transition-all duration-500 delay-75" />
           <div className="w-6 h-1.5 bg-orange-400 rounded-full group-hover:w-8 transition-all duration-500 delay-150" />
        </div>
      )
    }
  }

  // Default AI/General
  return { 
    Icon: Sparkles, 
    badge: 'AI Toolkit',
    accentHover: 'hover:border-slate-300 hover:shadow-slate-500/5',
    iconTheme: 'bg-slate-900 text-white',
    badgeTheme: 'border-slate-200 bg-slate-50 text-slate-500',
    titleHover: 'group-hover:text-slate-900',
    Decorative: () => (
        <div className="absolute right-5 bottom-5 flex gap-1.5 opacity-30 group-hover:opacity-100 transition-all duration-700 pointer-events-none items-center justify-center">
           <div className="w-1.5 h-1.5 rounded-full bg-slate-400 group-hover:scale-150 transition-all duration-500" />
           <div className="w-2 h-2 rounded-full bg-slate-600 group-hover:scale-150 transition-all duration-500 delay-75" />
           <div className="w-2.5 h-2.5 rounded-full bg-slate-800 group-hover:scale-150 transition-all duration-500 delay-150" />
           <div className="w-1.5 h-1.5 rounded-full bg-slate-400 group-hover:scale-150 transition-all duration-500 delay-200" />
        </div>
    )
  }
}

export const dynamic = 'force-dynamic'

export default async function CategoriesPage() {
  const categories = await getCategories()

  return (
    <div className="relative min-h-screen overflow-hidden px-4 pb-24 pt-32 sm:px-6 lg:px-8 bg-[#FAFAFA]">
      <div className="relative mx-auto max-w-7xl">
        <div className="mx-auto mb-16 max-w-4xl text-center">
          <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.25em] text-slate-500">
            Structured Discovery
          </p>
          <h1 className="text-balance text-5xl font-bold tracking-tight text-slate-900 sm:text-6xl">
            Explore AI tools by category.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-[17px] leading-relaxed text-slate-500">
            Browse the catalog in clearer lanes and jump straight into the kinds of tools you want to explore.
          </p>
        </div>

        <div className="mb-10 text-center">
          <p className="text-[14px] font-medium text-slate-500">
            Showing <span className="font-bold text-slate-900">{categories.length}</span> categories
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {categories.map((category, index) => {
            const { Icon, badge, accentHover, iconTheme, badgeTheme, titleHover, Decorative } = categoryVisual(category.name)

            return (
              <div
                key={category.name}
                className={index % 3 === 1 ? 'xl:translate-y-6' : index % 3 === 2 ? 'xl:translate-y-12' : ''}
              >
                <Link href={`/tools?q=${encodeURIComponent(category.name)}`} className="group block h-full">
                  <div className={`relative h-full overflow-hidden rounded-[28px] border border-slate-200 bg-white p-8 shadow-sm transition-all duration-500 bg-gradient-to-br from-white to-white hover:to-slate-50 ${accentHover}`}>
                    <Decorative />
                    
                    <div className="relative z-10 flex h-full flex-col pointer-events-none">
                      <div className="mb-8 flex items-start justify-between gap-4">
                        <div className={`flex h-14 w-14 items-center justify-center rounded-[16px] shadow-sm transition-transform duration-500 group-hover:scale-110 group-hover:-rotate-3 ${iconTheme}`}>
                          <Icon className="h-6 w-6" strokeWidth={2} />
                        </div>
                        <span className={`rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-[0.1em] transition-colors duration-500 ${badgeTheme}`}>
                          {badge}
                        </span>
                      </div>

                      <div className="mb-8 space-y-3">
                        <h2 className={`max-w-[80%] text-[24px] font-bold tracking-tight text-slate-900 transition-colors duration-500 ${titleHover}`}>
                          {category.name}
                        </h2>
                        <p className="max-w-[85%] text-[14px] leading-relaxed text-slate-500 font-medium transition-colors duration-500 group-hover:text-slate-600">
                          Discover tools in {category.name.toLowerCase()} and jump straight into focused results.
                        </p>
                      </div>

                      <div className="mt-auto flex items-center justify-between border-t border-slate-100 pt-6 text-[13px] font-bold text-slate-500 transition-colors duration-500 group-hover:border-slate-200">
                        <span>{category.count} tools</span>
                        <span className={`transition-transform duration-500 group-hover:translate-x-1 ${titleHover}`}>
                          Browse &rarr;
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
