import VideoIdentifierPanel from '@/components/feature/VideoIdentifierPanel'

export default function IdentifyPage() {
  return (
    <div className="min-h-screen bg-[#FAFAFA] px-4 pb-24 pt-32 sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-[4%] top-[10%] h-[20rem] w-[20rem] rounded-full bg-sky-100/60 blur-3xl" />
        <div className="absolute right-[6%] top-[14%] h-[22rem] w-[22rem] rounded-full bg-violet-100/50 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-6xl">
        <VideoIdentifierPanel />
      </div>
    </div>
  )
}
