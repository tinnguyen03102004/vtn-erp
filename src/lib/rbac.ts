// ================================================================
// Bridge: Re-export from @vtn/auth/rbac package
// Existing imports like `import { hasPermission } from '@/lib/rbac'` continue to work.
// New code should import directly from '@vtn/auth' or '@vtn/auth/rbac'.
// ================================================================
export type { Permission } from '@vtn/auth'
export { hasPermission, getPermissions, canAccess } from '@vtn/auth'
