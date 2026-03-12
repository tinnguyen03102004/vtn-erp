'use client'
import ModuleError from '@/components/shared/ModuleError'
export default function SaleError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
    return <ModuleError error={error} reset={reset} moduleName="Bán hàng" />
}
