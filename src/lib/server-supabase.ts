import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'
import { prisma } from './prisma'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const storageClient = createClient<Database>(supabaseUrl, supabaseAnonKey)

const tableToModel: Record<string, string> = {
    users: 'user',
    accounts: 'account',
    sessions: 'session',
    verification_tokens: 'verificationToken',
    employees: 'employee',
    crm_stages: 'crmStage',
    crm_leads: 'crmLead',
    sale_orders: 'saleOrder',
    sale_order_lines: 'saleOrderLine',
    sale_milestones: 'saleMilestone',
    projects: 'project',
    project_phases: 'projectPhase',
    project_tasks: 'projectTask',
    invoices: 'invoice',
    payments: 'payment',
    timesheets: 'timesheet',
    settings: 'setting',
    attachments: 'attachment',
    app_sessions: 'appSession',
    payroll_periods: 'payrollPeriod',
    payroll_slips: 'payrollSlip',
    audit_logs: 'auditLog',
}

type Filter =
    | { type: 'eq'; column: string; value: unknown }
    | { type: 'in'; column: string; value: unknown[] }
    | { type: 'gte'; column: string; value: unknown }
    | { type: 'lte'; column: string; value: unknown }
    | { type: 'ilike'; column: string; value: string }

function toPlainData<T>(value: T): T {
    return JSON.parse(
        JSON.stringify(value, (_, nested) => {
            if (typeof nested === 'bigint') return nested.toString()
            return nested
        })
    ) as T
}

function buildWhere(filters: Filter[]) {
    if (filters.length === 0) return undefined

    // Prisma requires full ISO-8601 for DateTime columns; Supabase JS accepts "YYYY-MM-DD".
    // Auto-pad short dates so server-supabase stays drop-in compatible.
    const dateRe = /^\d{4}-\d{2}-\d{2}$/
    const padDate = (v: unknown, end: boolean) => {
        if (typeof v === 'string' && dateRe.test(v)) {
            return end ? `${v}T23:59:59.999Z` : `${v}T00:00:00.000Z`
        }
        return v
    }

    const andClauses = filters.map((filter) => {
        switch (filter.type) {
        case 'eq':
            return { [filter.column]: filter.value }
        case 'in':
            return { [filter.column]: { in: filter.value } }
        case 'gte':
            return { [filter.column]: { gte: padDate(filter.value, false) } }
        case 'lte':
            return { [filter.column]: { lte: padDate(filter.value, true) } }
        case 'ilike': {
            const pattern = filter.value
            const trimmed = pattern.replace(/^%+|%+$/g, '')
            return { [filter.column]: { contains: trimmed, mode: 'insensitive' } }
        }
        }
    })

    return andClauses.length === 1 ? andClauses[0] : { AND: andClauses }
}

function buildOrderBy(ordering: Array<{ column: string; ascending: boolean }>) {
    if (ordering.length === 0) return undefined
    return ordering.map((item) => ({ [item.column]: item.ascending ? 'asc' : 'desc' }))
}

function getDelegate(table: string) {
    const model = tableToModel[table]
    if (!model) {
        throw new Error(`Unsupported server DB table: ${table}`)
    }
    return (prisma as unknown as Record<string, unknown>)[model] as Record<string, (...args: unknown[]) => Promise<unknown>>
}

function getUniqueSelector(record: Record<string, unknown>) {
    if (record.id) return { id: record.id }
    if (record.key) return { key: record.key }
    if (record.token) return { token: record.token }
    if (record.email) return { email: record.email }
    if (record.sessionToken) return { sessionToken: record.sessionToken }
    return null
}

/** Columns that are NEVER returned in select queries, per table. */
const SENSITIVE_COLUMNS: Record<string, string[]> = {
    users: ['password'],
}

class ServerQueryBuilder {
    private operation: 'select' | 'insert' | 'update' | 'delete' | 'upsert' = 'select'
    private payload: unknown
    private filters: Filter[] = []
    private ordering: Array<{ column: string; ascending: boolean }> = []
    private limitValue?: number
    private expectSingle = false
    private countExact = false
    private returning = false
    private onConflict?: string
    private selectColumns?: string[]

    constructor(private readonly table: string) {}

    private buildResponse(data: unknown, error: { message: string } | null = null, count: number | null = null) {
        return { data, error, count }
    }

    select(columns?: string, options?: { count?: 'exact' }) {
        if (this.operation === 'insert' || this.operation === 'update' || this.operation === 'delete' || this.operation === 'upsert') {
            this.returning = true
            return this
        }

        this.operation = 'select'
        this.countExact = options?.count === 'exact'

        // Parse column projection: 'id, name, email' → ['id', 'name', 'email']
        if (columns && columns !== '*') {
            this.selectColumns = columns.split(',').map(c => c.trim()).filter(Boolean)
        }

        return this
    }

    /** Build Prisma `select` object from parsed columns + deny-list. */
    private buildSelect(): Record<string, true> | undefined {
        const denyList = SENSITIVE_COLUMNS[this.table] || []
        const cols = this.selectColumns

        if (!cols && denyList.length === 0) return undefined

        if (cols) {
            // Explicit projection: only include requested columns, minus denied
            const proj: Record<string, true> = {}
            for (const col of cols) {
                if (!denyList.includes(col)) {
                    proj[col] = true
                }
            }
            return Object.keys(proj).length > 0 ? proj : undefined
        }

        // No explicit columns but has deny-list: we can't use Prisma select
        // to exclude fields without knowing all column names, so we strip
        // sensitive fields post-query in stripSensitive().
        return undefined
    }

    /** Remove sensitive columns from query results when no explicit projection. */
    private stripSensitive<T>(data: T): T {
        const denyList = SENSITIVE_COLUMNS[this.table]
        if (!denyList || denyList.length === 0) return data

        const strip = (obj: unknown): unknown => {
            if (!obj || typeof obj !== 'object') return obj
            if (Array.isArray(obj)) return obj.map(strip)
            const cleaned = { ...obj as Record<string, unknown> }
            for (const col of denyList) {
                delete cleaned[col]
            }
            return cleaned
        }

        return strip(data) as T
    }

    insert(payload: unknown) {
        this.operation = 'insert'
        this.payload = payload
        return this
    }

    update(payload: unknown) {
        this.operation = 'update'
        this.payload = payload
        return this
    }

    delete() {
        this.operation = 'delete'
        return this
    }

    upsert(payload: unknown, options?: { onConflict?: string }) {
        this.operation = 'upsert'
        this.payload = payload
        this.onConflict = options?.onConflict
        return this
    }

    eq(column: string, value: unknown) {
        this.filters.push({ type: 'eq', column, value })
        return this
    }

    in(column: string, value: unknown[]) {
        this.filters.push({ type: 'in', column, value })
        return this
    }

    gte(column: string, value: unknown) {
        this.filters.push({ type: 'gte', column, value })
        return this
    }

    lte(column: string, value: unknown) {
        this.filters.push({ type: 'lte', column, value })
        return this
    }

    ilike(column: string, value: string) {
        this.filters.push({ type: 'ilike', column, value })
        return this
    }

    order(column: string, options?: { ascending?: boolean }) {
        this.ordering.push({ column, ascending: options?.ascending !== false })
        return this
    }

    limit(value: number) {
        this.limitValue = value
        return this
    }

    single() {
        this.expectSingle = true
        return this
    }

    then<TResult1 = unknown, TResult2 = never>(
        onfulfilled?: ((value: { data: unknown; error: { message: string } | null; count: number | null }) => TResult1 | PromiseLike<TResult1>) | null,
        onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null
    ) {
        return this.execute().then(onfulfilled, onrejected)
    }

    private async executeAuditInsert() {
        const row = Array.isArray(this.payload) ? this.payload[0] : this.payload
        const entry = row as Record<string, unknown>
        await prisma.$executeRaw`
            insert into audit_logs ("userId", action, entity, "entityId", details, metadata, "createdAt")
            values (
                ${entry.userId as string},
                ${entry.action as string},
                ${entry.entity as string},
                ${entry.entityId as string},
                ${entry.details as string | null},
                ${entry.metadata as string | null},
                ${entry.createdAt as string}
            )
        `
        return this.buildResponse(null, null, null)
    }

    private async execute(): Promise<{ data: unknown; error: { message: string } | null; count: number | null }> {
        try {
            if (this.table === 'audit_logs' && this.operation === 'insert') {
                return await this.executeAuditInsert()
            }

            const delegate = getDelegate(this.table)
            const where = buildWhere(this.filters)
            const orderBy = buildOrderBy(this.ordering)

            if (this.operation === 'select') {
                const selectProj = this.buildSelect()

                if (this.expectSingle) {
                    const queryArgs: Record<string, unknown> = { where, orderBy }
                    if (selectProj) queryArgs.select = selectProj
                    const record = await delegate.findFirst(queryArgs)
                    const safe = record ? this.stripSensitive(toPlainData(record)) : null
                    return this.buildResponse(safe, null, this.countExact ? 1 : null)
                }

                const queryArgs: Record<string, unknown> = { where, orderBy, take: this.limitValue }
                if (selectProj) queryArgs.select = selectProj
                const records = await delegate.findMany(queryArgs)
                const count = this.countExact ? Number(await delegate.count({ where })) : null
                const safe = this.stripSensitive(toPlainData(records))
                return this.buildResponse(safe, null, count)
            }

            if (this.operation === 'insert') {
                const rows = Array.isArray(this.payload) ? this.payload : [this.payload]

                if (rows.length === 0) {
                    return this.buildResponse(this.returning ? [] : null, null, 0)
                }

                if (rows.length === 1) {
                    const record = await delegate.create({ data: rows[0] })
                    return this.buildResponse(this.returning ? toPlainData(record) : null, null, 1)
                }

                if (this.returning) {
                    const created = await Promise.all(
                        rows.map((row) => delegate.create({ data: row }))
                    )
                    return this.buildResponse(toPlainData(created), null, created.length)
                }

                const result = await delegate.createMany({ data: rows }) as { count?: number }
                return this.buildResponse(null, null, Number(result.count ?? rows.length))
            }

            if (this.operation === 'update') {
                if (this.expectSingle || this.returning) {
                    const existing = await delegate.findFirst({ where, orderBy })
                    if (!existing) return this.buildResponse(null, null, 0)

                    const uniqueWhere = getUniqueSelector(existing as Record<string, unknown>)
                    if (!uniqueWhere) {
                        throw new Error(`Unable to resolve unique selector for table ${this.table}`)
                    }

                    const record = await delegate.update({ where: uniqueWhere, data: this.payload })
                    return this.buildResponse(this.expectSingle || this.returning ? toPlainData(record) : null, null, 1)
                }

                const result = await delegate.updateMany({ where, data: this.payload }) as { count?: number }
                return this.buildResponse(null, null, Number(result.count ?? 0))
            }

            if (this.operation === 'delete') {
                const result = await delegate.deleteMany({ where }) as { count?: number }
                return this.buildResponse(null, null, Number(result.count ?? 0))
            }

            if (this.operation === 'upsert') {
                const rows = Array.isArray(this.payload) ? this.payload : [this.payload]
                const conflictKey = this.onConflict
                if (!conflictKey) throw new Error(`Upsert on ${this.table} requires onConflict`)

                const records = await Promise.all(rows.map((row) => {
                    const typedRow = row as Record<string, unknown>
                    return delegate.upsert({
                        where: { [conflictKey]: typedRow[conflictKey] },
                        update: typedRow,
                        create: typedRow,
                    })
                }))

                if (this.returning) {
                    return this.buildResponse(rows.length === 1 ? toPlainData(records[0]) : toPlainData(records), null, records.length)
                }

                return this.buildResponse(null, null, records.length)
            }

            throw new Error(`Unsupported operation on table ${this.table}`)
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown database error'
            return this.buildResponse(null, { message }, null)
        }
    }
}

export const serverSupabase = {
    from(table: string) {
        return new ServerQueryBuilder(table)
    },
    storage: storageClient.storage,
}

/**
 * Auth-only user lookup. Calls a SECURITY DEFINER RPC function
 * that bypasses RLS to retrieve password hash for bcrypt.compare.
 * RLS is enabled on users table with no anon policies, so direct
 * queries return 0 rows — this RPC is the only safe path.
 * NEVER expose this function to user-facing APIs.
 */
export async function getUserForAuth(email: string) {
    const { data, error } = await storageClient
        .rpc('get_user_for_auth', { lookup_email: email })
    if (error || !data || data.length === 0) return null
    return data[0] as { id: string; email: string; password: string | null; name: string | null; role: string; isActive: boolean }
}

export { toPlainData }
