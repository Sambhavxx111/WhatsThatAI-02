import type { admin_audit_action } from '@prisma/client'
import { db } from '@/lib/db'
import { getClientIp } from '@/lib/security'
import { logSecurityEvent } from '@/lib/securityLogger'

export type AdminAuditAction = admin_audit_action

const SECURITY_EVENT_BY_ACTION: Record<AdminAuditAction, string> = {
  admin_login: 'ADMIN_LOGIN',
  tool_approval: 'ADMIN_TOOL_APPROVAL',
  tool_rejection: 'ADMIN_TOOL_REJECTION',
  tool_deletion: 'ADMIN_TOOL_DELETION',
}

export async function logAdminAction(args: {
  adminId: number
  action: AdminAuditAction
  ipAddress?: string | null
  request?: Request
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

  await logSecurityEvent({
    userId: args.adminId,
    event: SECURITY_EVENT_BY_ACTION[args.action],
    req: args.request,
    status: 200,
    metadata: {
      adminAction: args.action,
    },
  })
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
    request: args.request,
  })
}
