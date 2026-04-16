// ================================================================
// @vtn/logger — Structured Logging for Server Actions
//
// Lightweight structured logger that outputs JSON in production
// and pretty-prints in development. Zero external dependencies.
// ================================================================

export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

const LOG_LEVELS: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
}

interface LogEntry {
    level: LogLevel
    msg: string
    module?: string
    userId?: string
    action?: string
    duration?: number
    error?: string
    stack?: string
    [key: string]: unknown
}

interface LoggerOptions {
    /** Log level threshold. Default: 'debug' in dev, 'info' in production */
    level?: LogLevel
    /** Module name for scoping logs */
    module?: string
    /** Whether to output JSON (production) or pretty (dev) */
    json?: boolean
}

function getMinLevel(): LogLevel {
    const env = process.env.LOG_LEVEL as LogLevel | undefined
    if (env && LOG_LEVELS[env] !== undefined) return env
    return process.env.NODE_ENV === 'production' ? 'info' : 'debug'
}

function shouldLog(level: LogLevel, minLevel: LogLevel): boolean {
    return LOG_LEVELS[level] >= LOG_LEVELS[minLevel]
}

function formatPretty(entry: LogEntry): string {
    const time = new Date().toISOString().slice(11, 23)
    const level = entry.level.toUpperCase().padEnd(5)
    const mod = entry.module ? `[${entry.module}]` : ''
    const duration = entry.duration !== undefined ? ` (${entry.duration}ms)` : ''
    const extra: string[] = []

    if (entry.userId) extra.push(`user=${entry.userId}`)
    if (entry.action) extra.push(`action=${entry.action}`)
    if (entry.error) extra.push(`error="${entry.error}"`)

    const extraStr = extra.length > 0 ? ` | ${extra.join(' ')}` : ''
    return `${time} ${level} ${mod} ${entry.msg}${duration}${extraStr}`
}

function output(entry: LogEntry, useJson: boolean) {
    const line = useJson
        ? JSON.stringify({ ...entry, timestamp: new Date().toISOString() })
        : formatPretty(entry)

    switch (entry.level) {
        case 'error':
            console.error(line)
            if (!useJson && entry.stack) console.error(entry.stack)
            break
        case 'warn':
            console.warn(line)
            break
        case 'debug':
            // eslint-disable-next-line no-console
            console.debug(line)
            break
        default:
            // eslint-disable-next-line no-console
            console.log(line)
    }
}

/**
 * Create a scoped logger.
 *
 * @example
 * const log = createLogger({ module: 'crm' })
 * log.info('Lead created', { leadId: '123' })
 * log.error('Failed to create', { error: err.message })
 */
export function createLogger(options: LoggerOptions = {}) {
    const minLevel = options.level ?? getMinLevel()
    const useJson = options.json ?? process.env.NODE_ENV === 'production'
    const module = options.module

    function log(level: LogLevel, msg: string, extra?: Record<string, unknown>) {
        if (!shouldLog(level, minLevel)) return
        const entry: LogEntry = { level, msg, module, ...extra }
        if (extra?.error instanceof Error) {
            entry.error = extra.error.message
            entry.stack = extra.error.stack
        }
        output(entry, useJson)
    }

    return {
        debug: (msg: string, extra?: Record<string, unknown>) => log('debug', msg, extra),
        info: (msg: string, extra?: Record<string, unknown>) => log('info', msg, extra),
        warn: (msg: string, extra?: Record<string, unknown>) => log('warn', msg, extra),
        error: (msg: string, extra?: Record<string, unknown>) => log('error', msg, extra),

        /**
         * Measure execution time of an async function.
         *
         * @example
         * const data = await log.measure('fetchLeads', async () => {
         *   return await supabase.from('crm_leads').select('*')
         * })
         */
        async measure<T>(label: string, fn: () => Promise<T>, extra?: Record<string, unknown>): Promise<T> {
            const start = performance.now()
            try {
                const result = await fn()
                const duration = Math.round(performance.now() - start)
                log('info', label, { ...extra, duration, status: 'ok' })
                return result
            } catch (err) {
                const duration = Math.round(performance.now() - start)
                log('error', label, {
                    ...extra,
                    duration,
                    status: 'error',
                    error: err instanceof Error ? err : new Error(String(err)),
                })
                throw err
            }
        },

        /** Create a child logger with additional module scope */
        child(childModule: string) {
            return createLogger({
                ...options,
                module: module ? `${module}:${childModule}` : childModule,
            })
        },
    }
}

/** Default logger instance */
export const logger = createLogger()

export type Logger = ReturnType<typeof createLogger>
