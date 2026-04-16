// RBAC permission map
// Roles: DIRECTOR, PROJECT_MANAGER, ARCHITECT, FINANCE, SALES

export type Permission = 'crm.view' | 'crm.edit' | 'sale.view' | 'sale.edit' | 'sale.approve'
    | 'project.view' | 'project.edit' | 'finance.view' | 'finance.edit'
    | 'hr.view' | 'hr.edit' | 'settings.view' | 'settings.edit' | 'users.manage'

const rolePermissions: Record<string, Permission[]> = {
    DIRECTOR: [
        'crm.view', 'crm.edit', 'sale.view', 'sale.edit', 'sale.approve',
        'project.view', 'project.edit', 'finance.view', 'finance.edit',
        'hr.view', 'hr.edit', 'settings.view', 'settings.edit', 'users.manage',
    ],
    PROJECT_MANAGER: [
        'crm.view', 'crm.edit', 'sale.view', 'sale.edit',
        'project.view', 'project.edit',
        'hr.view', 'settings.view',
    ],
    ARCHITECT: [
        'project.view',
        'hr.view',
    ],
    FINANCE: [
        'sale.view', 'finance.view', 'finance.edit',
        'hr.view', 'settings.view',
    ],
    SALES: [
        'crm.view', 'crm.edit', 'sale.view', 'sale.edit',
        'hr.view',
    ],
}

export function hasPermission(role: string | undefined, permission: Permission): boolean {
    if (!role) return false
    return rolePermissions[role]?.includes(permission) ?? false
}

export function getPermissions(role: string | undefined): Permission[] {
    if (!role) return []
    return rolePermissions[role] ?? []
}

export function canAccess(role: string | undefined, module: string): boolean {
    if (!role) return false
    return rolePermissions[role]?.some(p => p.startsWith(module + '.')) ?? false
}
