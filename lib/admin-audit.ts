import type { admin_audit_action } from '@prisma/client'
import { db } from '@/lib/db'
import { getClientIp } from '@/lib/security'

export type AdminAuditAction = admin_audit_action

export async function logAdminAction(args: {
  adminId: number
  action: AdminAuditAction
  ipAddress?: string | null
}) {
  try {
    await db.adminAuditLog.create({
      data: {
        adminId: args.adminId,
        action: args.action,
        ipAddress: args.ipAddress || null,
      },
    })
  } catch (error) {
    console.error('Admin audit logging failed:', error)
  }
}

export async function logAdminActionForRequest(args: {
  request: Request
  adminId: number
  action: AdminAuditAction
}) {
  return logAdminAction({
    adminId: args.adminId,
    action: args.action,
    ipAddress: getClientIp(args.request),
  })
}
