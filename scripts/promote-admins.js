import { db } from '@/lib/db'

async function main() {
  const emails = String(process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean)

  if (!emails.length) {
    console.log('No ADMIN_EMAILS configured. Skipping admin promotion.')
    return
  }

  const result = await db.user.updateMany({
    where: {
      email: {
        in: emails,
      },
    },
    data: {
      role: 'admin',
    },
  })

  console.log(`Promoted ${result.count} user(s) to admin.`)
}

main()
  .catch((error) => {
    console.error('Failed to promote admins:', error)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
