'use client'

import Link from 'next/link'

export default function Footer() {
  return (
    <footer id="footer" className="relative border-t border-slate-200 px-4 py-20 sm:px-6 lg:px-8 bg-[#FAFAFA]">
      <div className="relative mx-auto max-w-7xl">
        <div className="grid gap-12 md:grid-cols-4">
          <div className="md:col-span-2 pr-8">
            <Link href="/" className="flex items-center gap-3 w-fit">
              <div className="flex h-10 w-10 items-center justify-center rounded-[14px] bg-slate-900 text-sm font-bold text-white shadow-sm">
                AI
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-slate-500 font-semibold">WhatsThatAI</p>
                <p className="text-sm font-bold text-slate-900">Discover better tools, faster.</p>
              </div>
            </Link>
            <p className="mt-6 max-w-sm text-sm leading-6 text-slate-500 font-medium">
              A calmer, more premium way to identify AI products from videos, references, and creative workflows without losing the speed of your current product.
            </p>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-900">Product</h4>
            <ul className="mt-6 space-y-4 text-sm font-medium text-slate-500">
              <li><Link href="/tools" className="transition hover:text-blue-600">All Tools</Link></li>
              <li><Link href="/categories" className="transition hover:text-blue-600">Categories</Link></li>
              <li><Link href="/pricing" className="transition hover:text-blue-600">Pricing</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-900">Company</h4>
            <ul className="mt-6 space-y-4 text-sm font-medium text-slate-500">
              <li><Link href="/about" className="transition hover:text-blue-600">About</Link></li>
              <li><Link href="/blog" className="transition hover:text-blue-600">Blog</Link></li>
              <li><Link href="/contact" className="transition hover:text-blue-600">Contact</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-20 flex flex-col gap-6 border-t border-slate-200 pt-8 text-xs font-medium text-slate-500 md:flex-row md:items-center md:justify-between">
          <p>&copy; {new Date().getFullYear()} WhatsThatAI. All rights reserved.</p>
          <div className="flex gap-6">
            <a href="#" className="transition hover:text-slate-900">Twitter</a>
            <a href="#" className="transition hover:text-slate-900">GitHub</a>
            <a href="#" className="transition hover:text-slate-900">Discord</a>
          </div>
        </div>
      </div>
    </footer>
  )
}
