import type { ReactNode } from 'react'
import { requirePagePermission } from '@/lib/page-guard'

export default async function NewSaleLayout({ children }: { children: ReactNode }) {
    await requirePagePermission('sale.edit')

    return children
}
