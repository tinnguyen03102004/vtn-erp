'use client'
import ModuleError from '@/components/shared/ModuleError'
export default function TimesheetsError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
    return <ModuleError error={error} reset={reset} moduleName="Chấm công" />
}
