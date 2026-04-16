// ================================================================
// @vtn/shared — Common utilities, formatters, and helpers
// ================================================================

export { cn } from './utils'
export { formatCurrency, formatDate, formatRelativeTime, getInitials, truncate, escapeHtml } from './utils'
export type {
  // CRM
  CreateLeadInput, UpdateLeadInput,
  // Sale
  CreateOrderInput, UpdateOrderInput, OrderLineInput, MilestoneInput,
  // Projects
  CreatePhaseInput, UpdatePhaseInput, CreateTaskInput, UpdateTaskInput,
  // Finance
  CreateInvoiceInput, CreatePaymentInput,
  // HR
  CreateEmployeeInput, UpdateEmployeeInput,
  // Timesheets
  TimesheetEntry, CreateTimesheetInput, UpdateTimesheetInput,
} from './types'
