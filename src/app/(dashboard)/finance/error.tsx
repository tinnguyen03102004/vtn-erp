'use client'
import ModuleError from '@/components/shared/ModuleError'
export default function FinanceError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
    return <ModuleError error={error} reset={reset} moduleName="Tài chính" />
}
