import { Inter, Manrope } from 'next/font/google'
import './globals.css'
import SessionHeartbeat from '@/components/auth/SessionHeartbeat'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import SmoothScroll from '@/components/layout/SmoothScroll'
import GuideMascotLauncher from '@/components/assistant/GuideMascotLauncher'

const ENABLE_GUIDE_MASCOT = false

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-manrope',
  display: 'swap',
})

export const metadata = {
  title: 'WhatsThatAI - Discover AI Tools from Video',
  description: 'Find any AI tool from a video in seconds. Upload, search, discover.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${inter.variable} ${manrope.variable}`}>
      <body className="bg-[#FAFAFA] font-sans text-slate-900 antialiased overflow-x-hidden selection:bg-slate-200">
        <SmoothScroll />
        <SessionHeartbeat />
        {ENABLE_GUIDE_MASCOT ? <GuideMascotLauncher /> : null}
        <div className="relative min-h-screen">
          <div className="pointer-events-none fixed inset-0 -z-10 opacity-90" />
          <Navbar />
          <main>{children}</main>
          <Footer />
        </div>
      </body>
    </html>
  )
}
