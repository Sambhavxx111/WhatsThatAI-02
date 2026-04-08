import ProfileAvatarManager from '@/components/profile/ProfileAvatarManager'

export default function ProfilePage() {
  return (
    <div className="min-h-screen bg-[#FAFAFA] px-4 pb-24 pt-32 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-10">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-sky-600">
            Your Profile
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-900">
            Manage your identity
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-8 text-slate-500">
            Keep your account looking polished with a profile picture you can upload, update, or remove anytime.
          </p>
        </div>

        <ProfileAvatarManager />
      </div>
    </div>
  )
}
