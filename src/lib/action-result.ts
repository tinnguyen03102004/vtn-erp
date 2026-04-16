// ================================================================
// Bridge: Re-export from @vtn/errors package
// Existing imports like `import { ok, fail } from '@/lib/action-result'` continue to work.
// New code should import directly from '@vtn/errors'.
// ================================================================
export type { ActionResult } from '@vtn/errors'
export { ok, fail } from '@vtn/errors'
