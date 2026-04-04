import Link from 'next/link'
import {
  Bot,
  Brain,
  Briefcase,
  Code2,
  Headphones,
  Image as ImageIcon,
  Megaphone,
  MessagesSquare,
  Search,
  Sparkles,
  Video,
  Wand2,
} from 'lucide-react'
import { getCategories } from '@/lib/queries'

function categoryVisual(name) {
  const normalized = String(name || '').toLowerCase()

  if (normalized.includes('chat') || normalized.includes('message')) {
    return { 
      Icon: MessagesSquare, 
      badge: 'Conversation',
      accentHover: 'hover:border-emerald-200 hover:shadow-emerald-500/10',
      iconTheme: 'bg-emerald-100 text-emerald-600',
      badgeTheme: 'border-emerald-200 bg-emerald-50 text-emerald-600',
      titleHover: 'group-hover:text-emerald-600',
      Decorative: () => (
        <div className="absolute -right-4 -bottom-4 opacity-[0.03] group-hover:opacity-[0.08] transition-all duration-700 group-hover:-translate-y-2 group-hover:-translate-x-2">
          <MessagesSquare className="w-48 h-48 text-emerald-600" />
        </div>
      )
    }
  }

  if (normalized.includes('image') || normalized.includes('design') || normalized.includes('art')) {
    return { 
      Icon: ImageIcon, 
      badge: 'Visual',
      accentHover: 'hover:border-fuchsia-200 hover:shadow-fuchsia-500/10',
      iconTheme: 'bg-fuchsia-100 text-fuchsia-600',
      badgeTheme: 'border-fuchsia-200 bg-fuchsia-50 text-fuchsia-600',
      titleHover: 'group-hover:text-fuchsia-600',
      Decorative: () => (
        <div className="absolute -right-8 -bottom-8 opacity-20 group-hover:opacity-40 transition-all duration-700 group-hover:-rotate-6 group-hover:scale-110 pointer-events-none">
          <div className="relative w-40 h-40">
            <div className="absolute inset-0 bg-gradient-to-tr from-fuchsia-500 to-pink-500 rounded-2xl transform rotate-12 scale-90 opacity-20" />
            <div className="absolute inset-0 bg-white border border-fuchsia-100 rounded-2xl transform -rotate-6 p-2 shadow-sm">
              <div className="w-full h-full bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-center">
                 <ImageIcon className="w-12 h-12 text-slate-200" />
              </div>
            </div>
          </div>
        </div>
      )
    }
  }

  if (normalized.includes('video') || normalized.includes('motion')) {
    return { 
      Icon: Video, 
      badge: 'Motion',
      accentHover: 'hover:border-rose-200 hover:shadow-rose-500/10',
      iconTheme: 'bg-rose-100 text-rose-600',
      badgeTheme: 'border-rose-200 bg-rose-50 text-rose-600',
      titleHover: 'group-hover:text-rose-600',
      Decorative: () => (
        <div className="absolute -right-6 top-1/2 -translate-y-1/2 opacity-20 group-hover:opacity-40 transition-all duration-700 group-hover:-translate-x-4 pointer-events-none">
          <div className="w-48 h-32 bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col overflow-hidden transform rotate-6">
            <div className="h-4 bg-slate-50 border-b border-slate-100 flex items-center px-2 gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-slate-200" />
              <div className="w-1.5 h-1.5 rounded-full bg-slate-200" />
            </div>
            <div className="flex-1 border-4 border-white bg-slate-50 relative flex items-center justify-center">
               <div className="w-0 h-0 border-t-[6px] border-b-[6px] border-l-[10px] border-t-transparent border-b-transparent border-l-rose-300 ml-1" />
            </div>
          </div>
        </div>
      )
    }
  }

  if (normalized.includes('voice') || normalized.includes('audio') || normalized.includes('music')) {
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

  if (normalized.includes('code') || normalized.includes('dev')) {
    return { 
      Icon: Code2, 
      badge: 'Developer',
      accentHover: 'hover:border-amber-200 hover:shadow-amber-500/10',
      iconTheme: 'bg-amber-100 text-amber-600',
      badgeTheme: 'border-amber-200 bg-amber-50 text-amber-600',
      titleHover: 'group-hover:text-amber-600',
      Decorative: () => (
        <div className="absolute -right-12 top-1/2 -translate-y-1/2 w-64 h-40 rounded-xl bg-slate-900 border border-slate-700 shadow-xl opacity-[0.03] group-hover:opacity-10 transition-all duration-700 group-hover:-translate-x-8 pointer-events-none transform -rotate-3 p-4 font-mono text-[10px] text-amber-400 leading-relaxed overflow-hidden">
          <div className="flex gap-1.5 mb-3">
            <div className="w-2 h-2 rounded-full bg-rose-500/50"></div>
            <div className="w-2 h-2 rounded-full bg-amber-500/50"></div>
            <div className="w-2 h-2 rounded-full bg-emerald-500/50"></div>
          </div>
          <p className="text-pink-400">export function <span className="text-amber-400">render</span>() {'{'}</p>
          <p className="pl-4 text-emerald-400">const <span className="text-slate-300">ui</span> = new Core();</p>
          <p className="pl-4 text-slate-300">return ui.mount();</p>
          <p className="text-pink-400">{'}'}</p>
          <p className="mt-2 text-slate-500">// Processing AI models</p>
        </div>
      )
    }
  }

  if (normalized.includes('product') || normalized.includes('workflow')) {
    return { 
      Icon: Briefcase, 
      badge: 'Workflow',
      accentHover: 'hover:border-indigo-200 hover:shadow-indigo-500/10',
      iconTheme: 'bg-indigo-100 text-indigo-600',
      badgeTheme: 'border-indigo-200 bg-indigo-50 text-indigo-600',
      titleHover: 'group-hover:text-indigo-600',
      Decorative: () => (
        <div className="absolute -right-4 bottom-4 w-40 h-32 opacity-10 group-hover:opacity-30 transition-all duration-700 pointer-events-none">
           <div className="absolute top-0 right-10 w-20 h-8 rounded-md bg-indigo-200 border border-indigo-300 group-hover:-translate-y-2 transition-transform duration-500" />
           <div className="absolute top-10 right-0 w-24 h-8 rounded-md bg-indigo-100 border border-indigo-200 group-hover:translate-x-2 transition-transform duration-500 delay-75" />
           <div className="absolute top-20 right-4 w-28 h-8 rounded-md bg-indigo-50 border border-indigo-100 group-hover:translate-x-1 group-hover:translate-y-1 transition-transform duration-500 delay-150" />
           {/* Connecting lines */}
           <div className="absolute top-8 right-16 w-0.5 h-6 bg-slate-300" />
        </div>
      )
    }
  }

  if (normalized.includes('market') || normalized.includes('growth')) {
    return { 
      Icon: Megaphone, 
      badge: 'Growth',
      accentHover: 'hover:border-blue-200 hover:shadow-blue-500/10',
      iconTheme: 'bg-blue-100 text-blue-600',
      badgeTheme: 'border-blue-200 bg-blue-50 text-blue-600',
      titleHover: 'group-hover:text-blue-600',
      Decorative: () => (
        <div className="absolute right-6 bottom-6 flex items-end gap-2 opacity-20 group-hover:opacity-40 transition-all duration-700 pointer-events-none">
           <div className="w-6 bg-blue-100 rounded-t-sm h-8 group-hover:h-12 border-x border-t border-blue-200 transition-all duration-500" />
           <div className="w-6 bg-blue-200 rounded-t-sm h-14 group-hover:h-20 border-x border-t border-blue-300 transition-all duration-500 delay-75" />
           <div className="w-6 bg-blue-400 rounded-t-sm h-20 group-hover:h-32 border-x border-t border-blue-500 transition-all duration-500 delay-150 relative">
             <div className="absolute -top-4 -right-2 text-blue-600 animate-pulse">✦</div>
           </div>
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
       <div className="absolute right-0 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-[0.03] transition-opacity duration-700 pointer-events-none translate-x-1/4">
          <div className="w-64 h-64 rounded-full border-2 border-dashed border-slate-900 animate-[spin_20s_linear_infinite]" />
          <div className="absolute inset-8 rounded-full border-2 border-slate-600 animate-[spin_15s_linear_infinite_reverse]" />
          <div className="absolute inset-16 rounded-full border-2 border-dashed border-slate-400 animate-[spin_10s_linear_infinite]" />
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
