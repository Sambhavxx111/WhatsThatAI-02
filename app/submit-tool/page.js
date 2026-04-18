import SubmitTool from '@/components/SubmitTool'

export default function SubmitToolPage() {
  return (
    <div className="relative min-h-screen overflow-hidden px-4 pt-32 sm:px-6 lg:px-8 bg-[#0A0A0A]">
      <div className="relative z-10 mx-auto max-w-7xl pb-20">
        <div className="mb-14 max-w-3xl">
          <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.25em] text-neutral-500">
            Community Submission
          </p>
          <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-6xl sm:leading-[1.1]">
            Submit a real AI tool with enough signal to earn review.
          </h1>
          <p className="mt-6 max-w-2xl text-[17px] leading-relaxed text-neutral-400">
            This intake page is designed for thoughtful submissions. If the tool is legitimate, clearly described, and linked to its official site, it goes into the review queue cleanly.
          </p>
        </div>

        <SubmitTool />
      </div>
    </div>
  )
}
