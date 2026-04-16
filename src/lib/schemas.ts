// ================================================================
// Bridge: Re-export from @vtn/schemas package
// Existing imports like `import { createLeadSchema } from '@/lib/schemas'` continue to work.
// New code should import directly from '@vtn/schemas'.
// ================================================================
export {
    createLeadSchema, updateLeadSchema,
    createOrderSchema, updateOrderSchema, orderLineSchema, milestoneSchema,
    createInvoiceSchema, createPaymentSchema, directInvoiceSchema,
    createEmployeeSchema, updateEmployeeSchema,
    timesheetEntrySchema,
    createPhaseSchema, createTaskSchema,
    settingsSchema,
    createUserSchema, updateUserSchema,
    parseInput,
} from '@vtn/schemas'
