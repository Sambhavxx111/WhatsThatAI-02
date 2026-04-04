import Link from 'next/link'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { AUTH_COOKIE_NAME, isAdminUser, sanitizeUser, verifyAuthToken } from '@/lib/auth'

async function getPortalUser() {
  const cookieStore = await cookies()
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value

  if (!token) {
    return null
  }

  const payload = verifyAuthToken(token)

  if (!payload?.userId) {
    return null
  }

  const user = await db.user.findUnique({
    where: {
      id: payload.userId,
    },
  })

  return sanitizeUser(user)
}

export default async function PortalPage({ searchParams }) {
  const user = await getPortalUser()
  const denied = searchParams?.denied === '1'

  if (user && isAdminUser(user)) {
    redirect('/portal/admin')
  }

  return (
    <div className="min-h-screen bg-[#080808] px-4 py-24 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl rounded-[36px] border border-white/6 bg-white/[0.04] p-8 shadow-[0_30px_90px_rgba(0,0,0,0.45)] backdrop-blur-2xl sm:p-12">
        <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-neutral-500">
          Private Portal
        </p>
        <h1 className="mt-5 text-4xl font-semibold tracking-tight sm:text-[48px]">
          Team admin access lives here now.
        </h1>
        <p className="mt-5 max-w-2xl text-[17px] font-medium leading-8 text-neutral-300">
          The public marketplace no longer exposes moderation controls. Only approved team
          members can enter the admin portal and review submissions from this private access
          point.
        </p>

        <div className="mt-10 flex flex-col gap-4 sm:flex-row">
          <Link
            href="/login?next=/portal/admin"
            className="inline-flex items-center justify-center rounded-[18px] bg-white px-6 py-3 text-[15px] font-semibold text-black transition hover:scale-[1.01]"
          >
            Sign in as team member
          </Link>
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-[18px] border border-white/10 px-6 py-3 text-[15px] font-semibold text-white transition hover:bg-white/5"
          >
            Return to marketplace
          </Link>
        </div>

        {denied ? (
          <div className="mt-8 rounded-[24px] border border-amber-400/20 bg-amber-400/10 p-5">
            <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-amber-200">
              Access restricted
            </p>
            <p className="mt-3 text-[15px] font-medium leading-7 text-neutral-200">
              This portal is only available to accounts that were explicitly promoted to the
              admin role. Sign in with your internal account, and if you still cannot enter,
              promote the account server-side before retrying.
            </p>
          </div>
        ) : null}

        <div className="mt-10 rounded-[24px] border border-white/6 bg-black/20 p-5">
          <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-neutral-500">
            Access note
          </p>
          <p className="mt-3 text-[15px] font-medium leading-7 text-neutral-300">
            Admin access is no longer granted purely by email allowlists. Team members must have
            a stored admin role in the database.
          </p>
        </div>
      </div>
    </div>
  )
}
