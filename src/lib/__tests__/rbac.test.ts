import { describe, it, expect } from 'vitest'
import { hasPermission, getPermissions, canAccess, type Permission } from '@/lib/rbac'

// ================================================================
// RBAC Permission Matrix Tests
// Verifies role → permission mapping for all 5 roles & edge cases
// ================================================================

describe('RBAC — hasPermission', () => {
    describe('DIRECTOR (superadmin)', () => {
        const role = 'DIRECTOR'

        it('has ALL permissions', () => {
            const allPerms: Permission[] = [
                'crm.view', 'crm.edit', 'sale.view', 'sale.edit', 'sale.approve',
                'project.view', 'project.edit', 'finance.view', 'finance.edit',
                'hr.view', 'hr.edit', 'settings.view', 'settings.edit', 'users.manage',
            ]
            for (const perm of allPerms) {
                expect(hasPermission(role, perm)).toBe(true)
            }
        })
    })

    describe('PROJECT_MANAGER', () => {
        const role = 'PROJECT_MANAGER'

        it('can view and edit CRM', () => {
            expect(hasPermission(role, 'crm.view')).toBe(true)
            expect(hasPermission(role, 'crm.edit')).toBe(true)
        })

        it('can view and edit sales but NOT approve', () => {
            expect(hasPermission(role, 'sale.view')).toBe(true)
            expect(hasPermission(role, 'sale.edit')).toBe(true)
            expect(hasPermission(role, 'sale.approve')).toBe(false)
        })

        it('can view and edit projects', () => {
            expect(hasPermission(role, 'project.view')).toBe(true)
            expect(hasPermission(role, 'project.edit')).toBe(true)
        })

        it('CANNOT access finance', () => {
            expect(hasPermission(role, 'finance.view')).toBe(false)
            expect(hasPermission(role, 'finance.edit')).toBe(false)
        })

        it('CANNOT manage users or settings', () => {
            expect(hasPermission(role, 'users.manage')).toBe(false)
            expect(hasPermission(role, 'settings.edit')).toBe(false)
        })
    })

    describe('ARCHITECT', () => {
        const role = 'ARCHITECT'

        it('can only view projects and HR', () => {
            expect(hasPermission(role, 'project.view')).toBe(true)
            expect(hasPermission(role, 'hr.view')).toBe(true)
        })

        it('CANNOT edit projects', () => {
            expect(hasPermission(role, 'project.edit')).toBe(false)
        })

        it('CANNOT access CRM or sales', () => {
            expect(hasPermission(role, 'crm.view')).toBe(false)
            expect(hasPermission(role, 'sale.view')).toBe(false)
        })
    })

    describe('FINANCE', () => {
        const role = 'FINANCE'

        it('can view and edit finance', () => {
            expect(hasPermission(role, 'finance.view')).toBe(true)
            expect(hasPermission(role, 'finance.edit')).toBe(true)
        })

        it('can view sales but NOT edit', () => {
            expect(hasPermission(role, 'sale.view')).toBe(true)
            expect(hasPermission(role, 'sale.edit')).toBe(false)
        })

        it('CANNOT access CRM or projects', () => {
            expect(hasPermission(role, 'crm.view')).toBe(false)
            expect(hasPermission(role, 'project.view')).toBe(false)
        })
    })

    describe('SALES', () => {
        const role = 'SALES'

        it('can view and edit CRM + sales', () => {
            expect(hasPermission(role, 'crm.view')).toBe(true)
            expect(hasPermission(role, 'crm.edit')).toBe(true)
            expect(hasPermission(role, 'sale.view')).toBe(true)
            expect(hasPermission(role, 'sale.edit')).toBe(true)
        })

        it('CANNOT approve sales', () => {
            expect(hasPermission(role, 'sale.approve')).toBe(false)
        })

        it('CANNOT access finance or projects', () => {
            expect(hasPermission(role, 'finance.view')).toBe(false)
            expect(hasPermission(role, 'project.view')).toBe(false)
        })
    })

    describe('Edge cases', () => {
        it('returns false for undefined role', () => {
            expect(hasPermission(undefined, 'crm.view')).toBe(false)
        })

        it('returns false for unknown role', () => {
            expect(hasPermission('INTERN', 'crm.view')).toBe(false)
        })

        it('returns false for empty string role', () => {
            expect(hasPermission('', 'crm.view')).toBe(false)
        })
    })
})

describe('RBAC — getPermissions', () => {
    it('returns all permissions for DIRECTOR', () => {
        const perms = getPermissions('DIRECTOR')
        expect(perms).toHaveLength(14)
        expect(perms).toContain('users.manage')
    })

    it('returns limited permissions for ARCHITECT', () => {
        const perms = getPermissions('ARCHITECT')
        expect(perms).toHaveLength(2)
        expect(perms).toContain('project.view')
        expect(perms).toContain('hr.view')
    })

    it('returns empty array for undefined', () => {
        expect(getPermissions(undefined)).toEqual([])
    })

    it('returns empty array for unknown role', () => {
        expect(getPermissions('GHOST')).toEqual([])
    })
})

describe('RBAC — canAccess (module-level)', () => {
    it('DIRECTOR can access all modules', () => {
        expect(canAccess('DIRECTOR', 'crm')).toBe(true)
        expect(canAccess('DIRECTOR', 'sale')).toBe(true)
        expect(canAccess('DIRECTOR', 'project')).toBe(true)
        expect(canAccess('DIRECTOR', 'finance')).toBe(true)
        expect(canAccess('DIRECTOR', 'hr')).toBe(true)
        expect(canAccess('DIRECTOR', 'settings')).toBe(true)
    })

    it('ARCHITECT can only access project and hr', () => {
        expect(canAccess('ARCHITECT', 'project')).toBe(true)
        expect(canAccess('ARCHITECT', 'hr')).toBe(true)
        expect(canAccess('ARCHITECT', 'crm')).toBe(false)
        expect(canAccess('ARCHITECT', 'sale')).toBe(false)
        expect(canAccess('ARCHITECT', 'finance')).toBe(false)
    })

    it('FINANCE cannot access CRM', () => {
        expect(canAccess('FINANCE', 'crm')).toBe(false)
    })

    it('returns false for undefined role', () => {
        expect(canAccess(undefined, 'crm')).toBe(false)
    })

    it('returns false for non-existent module', () => {
        expect(canAccess('DIRECTOR', 'nonexistent')).toBe(false)
    })
})
