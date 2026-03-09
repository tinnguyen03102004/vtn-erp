import { describe, it, expect } from 'vitest'
import { parseInput } from '@/lib/schemas'
import {
    createLeadSchema,
    updateLeadSchema,
    createOrderSchema,
    orderLineSchema,
    milestoneSchema,
    createInvoiceSchema,
    createPaymentSchema,
    createEmployeeSchema,
    timesheetEntrySchema,
    createPhaseSchema,
    createTaskSchema,
} from '@/lib/schemas'

// ================================================================
// Zod Schema Validation Tests
// Ensures all server-side schemas reject invalid input correctly
// ================================================================

describe('CRM Schemas', () => {
    describe('createLeadSchema', () => {
        it('rejects empty name', () => {
            const result = parseInput(createLeadSchema, { name: '' })
            expect(result.success).toBe(false)
            if (!result.success) expect(result.fieldErrors).toHaveProperty('name')
        })

        it('accepts valid lead', () => {
            const result = parseInput(createLeadSchema, { name: 'Công ty ABC', email: 'abc@test.com' })
            expect(result.success).toBe(true)
        })

        it('rejects invalid email', () => {
            const result = parseInput(createLeadSchema, { name: 'Test', email: 'not-an-email' })
            expect(result.success).toBe(false)
            if (!result.success) expect(result.fieldErrors).toHaveProperty('email')
        })

        it('allows empty email', () => {
            const result = parseInput(createLeadSchema, { name: 'Test', email: '' })
            expect(result.success).toBe(true)
        })
    })

    describe('updateLeadSchema', () => {
        it('accepts partial update', () => {
            const result = parseInput(updateLeadSchema, { phone: '0123456789' })
            expect(result.success).toBe(true)
        })

        it('accepts empty object', () => {
            const result = parseInput(updateLeadSchema, {})
            expect(result.success).toBe(true)
        })
    })
})

describe('Sale Schemas', () => {
    describe('createOrderSchema', () => {
        it('rejects missing partnerName', () => {
            const result = parseInput(createOrderSchema, {})
            expect(result.success).toBe(false)
        })

        it('accepts valid order', () => {
            const result = parseInput(createOrderSchema, { partnerName: 'Khách hàng A' })
            expect(result.success).toBe(true)
        })
    })

    describe('orderLineSchema', () => {
        it('rejects negative qty', () => {
            const result = parseInput(orderLineSchema, { description: 'Test', qty: -1, unitPrice: 100 })
            expect(result.success).toBe(false)
        })

        it('rejects empty description', () => {
            const result = parseInput(orderLineSchema, { description: '', qty: 1, unitPrice: 100 })
            expect(result.success).toBe(false)
        })

        it('accepts valid line', () => {
            const result = parseInput(orderLineSchema, { description: 'Thiết kế', qty: 1, unitPrice: 50000000 })
            expect(result.success).toBe(true)
        })

        it('coerces string numbers', () => {
            const result = parseInput(orderLineSchema, { description: 'Test', qty: '3', unitPrice: '100000' })
            expect(result.success).toBe(true)
            if (result.success) {
                expect(result.data.qty).toBe(3)
                expect(result.data.unitPrice).toBe(100000)
            }
        })
    })

    describe('milestoneSchema', () => {
        it('rejects percent > 100', () => {
            const result = parseInput(milestoneSchema, { name: 'Phase 1', percent: 150 })
            expect(result.success).toBe(false)
        })

        it('accepts valid milestone', () => {
            const result = parseInput(milestoneSchema, { name: 'Đợt 1', percent: 30 })
            expect(result.success).toBe(true)
        })
    })
})

describe('Finance Schemas', () => {
    describe('createInvoiceSchema', () => {
        it('rejects missing orderId', () => {
            const result = parseInput(createInvoiceSchema, { amount: 1000, dueDate: '2026-04-01' })
            expect(result.success).toBe(false)
        })

        it('rejects invalid UUID', () => {
            const result = parseInput(createInvoiceSchema, {
                orderId: 'not-a-uuid', amount: 1000, dueDate: '2026-04-01',
            })
            expect(result.success).toBe(false)
        })
    })

    describe('createPaymentSchema', () => {
        it('rejects zero amount', () => {
            const result = parseInput(createPaymentSchema, {
                invoiceId: '550e8400-e29b-41d4-a716-446655440000', amount: 0,
            })
            expect(result.success).toBe(false)
        })
    })
})

describe('HR Schema', () => {
    describe('createEmployeeSchema', () => {
        it('rejects missing email', () => {
            const result = parseInput(createEmployeeSchema, { name: 'Nguyễn Văn A' })
            expect(result.success).toBe(false)
        })

        it('rejects short password', () => {
            const result = parseInput(createEmployeeSchema, {
                name: 'Test', email: 'test@vtn.com', password: '123',
            })
            expect(result.success).toBe(false)
        })

        it('accepts valid employee', () => {
            const result = parseInput(createEmployeeSchema, {
                name: 'Nguyễn Văn A', email: 'nva@vtn.com',
                department: 'Kiến trúc', position: 'Kiến trúc sư',
            })
            expect(result.success).toBe(true)
        })
    })
})

describe('Timesheet Schema', () => {
    describe('timesheetEntrySchema', () => {
        it('rejects hours > 24', () => {
            const result = parseInput(timesheetEntrySchema, {
                projectId: '550e8400-e29b-41d4-a716-446655440000',
                date: '2026-03-09', hours: 25,
            })
            expect(result.success).toBe(false)
        })

        it('accepts valid entry', () => {
            const result = parseInput(timesheetEntrySchema, {
                projectId: '550e8400-e29b-41d4-a716-446655440000',
                date: '2026-03-09', hours: 8,
            })
            expect(result.success).toBe(true)
        })
    })
})

describe('Project Schemas', () => {
    describe('createPhaseSchema', () => {
        it('rejects empty name', () => {
            const result = parseInput(createPhaseSchema, {
                projectId: '550e8400-e29b-41d4-a716-446655440000', name: '',
            })
            expect(result.success).toBe(false)
        })
    })

    describe('createTaskSchema', () => {
        it('rejects missing phaseId', () => {
            const result = parseInput(createTaskSchema, { name: 'Task 1' })
            expect(result.success).toBe(false)
        })

        it('accepts valid task', () => {
            const result = parseInput(createTaskSchema, {
                phaseId: '550e8400-e29b-41d4-a716-446655440000', name: 'Vẽ mặt bằng',
            })
            expect(result.success).toBe(true)
        })
    })
})

// ================================================================
// ActionResult Pattern Tests
// ================================================================
describe('ActionResult helpers', () => {
    it('ok() returns success', async () => {
        const { ok } = await import('@/lib/action-result')
        const result = ok({ id: '123', name: 'Test' })
        expect(result.success).toBe(true)
        if (result.success) expect(result.data.id).toBe('123')
    })

    it('fail() returns error with field errors', async () => {
        const { fail } = await import('@/lib/action-result')
        const result = fail('Validation failed', { name: 'Required' })
        expect(result.success).toBe(false)
        if (!result.success) {
            expect(result.error).toBe('Validation failed')
            expect(result.fieldErrors?.name).toBe('Required')
        }
    })
})
