import { hasPermission, type Permission } from '@/lib/rbac'

type AttachmentEntityConfig = {
    canonical: string
    aliases: string[]
    viewPermission: Permission
    editPermission: Permission
}

const ENTITY_CONFIGS: AttachmentEntityConfig[] = [
    {
        canonical: 'lead',
        aliases: ['lead'],
        viewPermission: 'crm.view',
        editPermission: 'crm.edit',
    },
    {
        canonical: 'project',
        aliases: ['project'],
        viewPermission: 'project.view',
        editPermission: 'project.edit',
    },
    {
        canonical: 'invoice',
        aliases: ['invoice'],
        viewPermission: 'finance.view',
        editPermission: 'finance.edit',
    },
    {
        canonical: 'employee',
        aliases: ['employee'],
        viewPermission: 'hr.view',
        editPermission: 'hr.edit',
    },
    {
        canonical: 'sale_order',
        aliases: ['sale_order', 'order', 'quotation', 'contract'],
        viewPermission: 'sale.view',
        editPermission: 'sale.edit',
    },
]

function findEntityConfig(entityType: string) {
    return ENTITY_CONFIGS.find((config) => config.aliases.includes(entityType))
}

export function normalizeAttachmentEntityType(entityType: string): string | null {
    return findEntityConfig(entityType)?.canonical ?? null
}

export function getAttachmentEntityTypesForRead(entityType: string): string[] {
    const config = findEntityConfig(entityType)
    return config ? config.aliases : [entityType]
}

export function getAttachmentPermission(entityType: string, mode: 'view' | 'edit'): Permission | null {
    const config = findEntityConfig(entityType)
    if (!config) return null

    return mode === 'view' ? config.viewPermission : config.editPermission
}

export function canAccessAttachmentEntity(role: string | undefined, entityType: string, mode: 'view' | 'edit') {
    const permission = getAttachmentPermission(entityType, mode)
    return permission ? hasPermission(role, permission) : false
}
