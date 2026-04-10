import { Suspense } from 'react'
import OnboardingClient from './OnboardingClient'

export const dynamic = 'force-dynamic'

export default function OnboardingPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#FAFAFA] px-4 pb-24 pt-32 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <div className="mx-auto max-w-4xl rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm">
              <p className="text-sm font-medium text-slate-500">Loading your onboarding flow...</p>
            </div>
          </div>
        </div>
      }
    >
      <OnboardingClient />
    </Suspense>
  )
}
