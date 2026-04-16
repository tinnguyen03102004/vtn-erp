// ================================================================
// Server Action Result Pattern — Standardized response for all actions
// ================================================================

/**
 * Standard result wrapper for server actions.
 * Replaces throw/catch with explicit success/error returns.
 */
export type ActionResult<T = void> =
    | { success: true; data: T }
    | { success: false; error: string; fieldErrors?: Record<string, string> }

export function ok<T>(data: T): ActionResult<T> {
    return { success: true, data }
}

export function fail(error: string, fieldErrors?: Record<string, string>): ActionResult<never> {
    return { success: false, error, fieldErrors }
}
