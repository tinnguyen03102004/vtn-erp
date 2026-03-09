// ── AI Tool Registry ──
// Maps natural language intents → server actions as OpenAI function declarations

import { createLead, getLeads, getStages, updateLead, moveLeadStage, convertLeadToOrder } from '@/lib/actions/crm'
import { createOrder, getQuotations, getContracts, sendQuotation, approveQuotation, convertToContract, getOrder } from '@/lib/actions/sale'
import { getEmployees, createEmployee } from '@/lib/actions/employees'
import { saveWeekTimesheets, getTimesheetsWithDetails } from '@/lib/actions/timesheets'
import { createInvoice, createPayment, getInvoices } from '@/lib/actions/finance'
import { getProjects, createTask } from '@/lib/actions/projects'
import { globalSearch } from '@/lib/actions/search'
import { getDashboardKPIs } from '@/lib/actions/dashboard'
import { estimateFromDescription, analyzeQuotation, formatVND } from '@/lib/ai/quote-analysis'

// ── OpenAI Function Declarations (JSON Schema) ──

export const toolDefinitions = [
    {
        type: 'function' as const,
        function: {
            name: 'search_everything',
            description: 'Tìm kiếm tất cả trong hệ thống (lead, báo giá, hợp đồng, dự án, nhân viên)',
            parameters: {
                type: 'object',
                properties: {
                    query: { type: 'string', description: 'Từ khóa tìm kiếm' },
                },
                required: ['query'],
            },
        },
    },
    {
        type: 'function' as const,
        function: {
            name: 'get_dashboard',
            description: 'Lấy tổng quan dashboard: tổng lead, doanh thu, báo giá, dự án, timesheet gần đây',
            parameters: { type: 'object', properties: {} },
        },
    },
    // ── CRM ──
    {
        type: 'function' as const,
        function: {
            name: 'get_leads',
            description: 'Lấy danh sách tất cả khách hàng tiềm năng (leads) trong CRM',
            parameters: { type: 'object', properties: {} },
        },
    },
    {
        type: 'function' as const,
        function: {
            name: 'create_lead',
            description: 'Tạo lead/khách hàng tiềm năng mới trong CRM',
            parameters: {
                type: 'object',
                properties: {
                    partnerName: { type: 'string', description: 'Tên khách hàng hoặc chủ đầu tư' },
                    email: { type: 'string', description: 'Email liên hệ' },
                    phone: { type: 'string', description: 'Số điện thoại' },
                    expectedValue: { type: 'number', description: 'Giá trị dự kiến (VND)' },
                    notes: { type: 'string', description: 'Ghi chú về lead' },
                },
                required: ['partnerName'],
            },
        },
    },
    {
        type: 'function' as const,
        function: {
            name: 'convert_lead_to_quotation',
            description: 'Chuyển đổi lead thành báo giá (quotation)',
            parameters: {
                type: 'object',
                properties: {
                    leadId: { type: 'string', description: 'ID của lead cần chuyển' },
                },
                required: ['leadId'],
            },
        },
    },
    // ── Sale (Báo giá & Hợp đồng) ──
    {
        type: 'function' as const,
        function: {
            name: 'get_quotations',
            description: 'Lấy danh sách tất cả báo giá',
            parameters: { type: 'object', properties: {} },
        },
    },
    {
        type: 'function' as const,
        function: {
            name: 'get_contracts',
            description: 'Lấy danh sách tất cả hợp đồng',
            parameters: { type: 'object', properties: {} },
        },
    },
    {
        type: 'function' as const,
        function: {
            name: 'create_quotation',
            description: 'Tạo báo giá mới cho khách hàng',
            parameters: {
                type: 'object',
                properties: {
                    partnerName: { type: 'string', description: 'Tên khách hàng / chủ đầu tư' },
                    partnerEmail: { type: 'string', description: 'Email khách hàng' },
                    partnerPhone: { type: 'string', description: 'Số điện thoại' },
                    totalAmount: { type: 'number', description: 'Tổng giá trị báo giá (VND)' },
                    notes: { type: 'string', description: 'Ghi chú / điều khoản' },
                },
                required: ['partnerName', 'totalAmount'],
            },
        },
    },
    {
        type: 'function' as const,
        function: {
            name: 'send_quotation',
            description: 'Gửi báo giá cho khách hàng (chuyển trạng thái DRAFT → SENT)',
            parameters: {
                type: 'object',
                properties: {
                    orderId: { type: 'string', description: 'ID báo giá cần gửi' },
                },
                required: ['orderId'],
            },
        },
    },
    // ── HR ──
    {
        type: 'function' as const,
        function: {
            name: 'get_employees',
            description: 'Lấy danh sách tất cả nhân viên',
            parameters: { type: 'object', properties: {} },
        },
    },
    {
        type: 'function' as const,
        function: {
            name: 'create_employee',
            description: 'Tạo nhân viên mới',
            parameters: {
                type: 'object',
                properties: {
                    name: { type: 'string', description: 'Tên nhân viên' },
                    email: { type: 'string', description: 'Email' },
                    phone: { type: 'string', description: 'Số điện thoại' },
                    position: { type: 'string', description: 'Chức vụ (Kiến trúc sư, KTS trưởng, etc.)' },
                    department: { type: 'string', description: 'Phòng ban' },
                },
                required: ['name'],
            },
        },
    },
    {
        type: 'function' as const,
        function: {
            name: 'log_timesheet',
            description: 'Ghi nhận timesheet (giờ làm việc) cho nhân viên',
            parameters: {
                type: 'object',
                properties: {
                    employeeId: { type: 'string', description: 'ID nhân viên' },
                    projectId: { type: 'string', description: 'ID dự án' },
                    date: { type: 'string', description: 'Ngày (YYYY-MM-DD)' },
                    hours: { type: 'number', description: 'Số giờ làm việc' },
                },
                required: ['employeeId', 'projectId', 'date', 'hours'],
            },
        },
    },
    // ── Finance ──
    {
        type: 'function' as const,
        function: {
            name: 'get_invoices',
            description: 'Lấy danh sách tất cả hóa đơn',
            parameters: { type: 'object', properties: {} },
        },
    },
    // ── Projects ──
    {
        type: 'function' as const,
        function: {
            name: 'get_projects',
            description: 'Lấy danh sách tất cả dự án',
            parameters: { type: 'object', properties: {} },
        },
    },
    {
        type: 'function' as const,
        function: {
            name: 'create_task',
            description: 'Tạo task mới trong dự án',
            parameters: {
                type: 'object',
                properties: {
                    phaseId: { type: 'string', description: 'ID phase trong dự án' },
                    name: { type: 'string', description: 'Tên task' },
                    assignee: { type: 'string', description: 'Người được giao' },
                    dueDate: { type: 'string', description: 'Hạn hoàn thành (YYYY-MM-DD)' },
                },
                required: ['phaseId', 'name'],
            },
        },
    },
    // ── Quote Analysis ──
    {
        type: 'function' as const,
        function: {
            name: 'estimate_price',
            description: 'Ước tính giá dự án theo diện tích và loại dịch vụ kiến trúc. LUÔN dùng tool này khi khách hỏi giá. Trả kết quả có structured data.',
            parameters: {
                type: 'object',
                properties: {
                    description: { type: 'string', description: 'Mô tả dự án (VD: "thiết kế biệt thự 500m2 trọn gói")' },
                },
                required: ['description'],
            },
        },
    },
    {
        type: 'function' as const,
        function: {
            name: 'analyze_quotation',
            description: 'Phân tích báo giá: so sánh với giá thị trường, đánh giá biên lợi nhuận',
            parameters: {
                type: 'object',
                properties: {
                    quotationId: { type: 'string', description: 'ID báo giá cần phân tích' },
                },
                required: ['quotationId'],
            },
        },
    },
]

// ── Tool Executor ──
// Maps function name → actual server action execution

// BUG-03 FIX: Validate required args before execution
function validateArgs(args: Record<string, unknown>, required: string[]): string | null {
    for (const key of required) {
        if (args[key] === undefined || args[key] === null || args[key] === '') {
            return `Thiếu trường bắt buộc: ${key}`
        }
    }
    return null
}

export async function executeTool(name: string, args: Record<string, unknown>): Promise<string> {
    try {
        switch (name) {
            case 'search_everything': {
                const err = validateArgs(args, ['query'])
                if (err) return JSON.stringify({ error: err })
                const result = await globalSearch(String(args.query))
                if (!result.success) return JSON.stringify({ error: result.error })
                return JSON.stringify(result.data.slice(0, 10))
            }
            case 'get_dashboard': {
                const result = await getDashboardKPIs()
                if (!result.success) return JSON.stringify({ error: result.error })
                return JSON.stringify(result.data)
            }
            case 'get_leads': {
                const leads = await getLeads()
                return JSON.stringify(leads.slice(0, 20).map((l) => ({
                    id: l.id, name: l.partnerName, email: l.email,
                    phone: l.phone, value: l.expectedValue, stage: l.stageId,
                })))
            }
            case 'create_lead': {
                const err = validateArgs(args, ['partnerName'])
                if (err) return JSON.stringify({ error: err })
                // Lookup default stage (first stage in pipeline)
                const stages = await getStages()
                const defaultStageId = stages[0]?.id || null
                const result = await createLead({
                    name: args.partnerName,
                    partnerName: args.partnerName,
                    email: args.email || null,
                    phone: args.phone || null,
                    expectedValue: args.expectedValue || 0,
                    notes: args.notes || null,
                    stageId: defaultStageId,
                    probability: 10,
                })
                if (!result.success) return JSON.stringify({ error: result.error })
                return JSON.stringify({ success: true, lead: { id: result.data.id, name: result.data.partnerName } })
            }
            case 'convert_lead_to_quotation': {
                const err = validateArgs(args, ['leadId'])
                if (err) return JSON.stringify({ error: err })
                const result = await convertLeadToOrder(String(args.leadId))
                if (!result.success) return JSON.stringify({ error: result.error })
                return JSON.stringify({ success: true, orderId: result.data.id, name: result.data.name })
            }
            case 'get_quotations': {
                const quotes = await getQuotations()
                return JSON.stringify(quotes.slice(0, 20).map((q) => ({
                    id: q.id, name: q.name, client: q.partnerName,
                    amount: q.totalAmount, state: q.state,
                })))
            }
            case 'get_contracts': {
                const contracts = await getContracts()
                return JSON.stringify(contracts.slice(0, 20).map((c) => ({
                    id: c.id, name: c.name, client: c.partnerName,
                    amount: c.totalAmount, state: c.state,
                })))
            }
            case 'create_quotation': {
                const err = validateArgs(args, ['partnerName', 'totalAmount'])
                if (err) return JSON.stringify({ error: err })
                const result = await createOrder({
                    partnerName: args.partnerName,
                    partnerEmail: args.partnerEmail || null,
                    partnerPhone: args.partnerPhone || null,
                    notes: args.notes || null,
                })
                if (!result.success) return JSON.stringify({ error: result.error })
                return JSON.stringify({ success: true, order: { id: result.data.id, name: result.data.name } })
            }
            case 'send_quotation': {
                const err = validateArgs(args, ['orderId'])
                if (err) return JSON.stringify({ error: err })
                await sendQuotation(String(args.orderId))
                return JSON.stringify({ success: true, message: 'Đã gửi báo giá cho khách hàng' })
            }
            case 'get_employees': {
                const emps = await getEmployees()
                return JSON.stringify(emps.slice(0, 30).map((e) => ({
                    id: e.id, name: e.name, position: e.position, department: e.department,
                })))
            }
            case 'create_employee': {
                const err = validateArgs(args, ['name'])
                if (err) return JSON.stringify({ error: err })
                const result = await createEmployee({
                    name: args.name,
                    email: args.email || null,
                    phone: args.phone || null,
                    position: args.position || null,
                    department: args.department || null,
                })
                if (!result.success) return JSON.stringify({ error: result.error })
                return JSON.stringify({ success: true, employee: { id: result.data.id, name: result.data.name } })
            }
            case 'log_timesheet': {
                const err = validateArgs(args, ['employeeId', 'projectId', 'date', 'hours'])
                if (err) return JSON.stringify({ error: err })
                const result = await saveWeekTimesheets(String(args.employeeId), [
                    { projectId: String(args.projectId), date: String(args.date), hours: Number(args.hours) },
                ])
                if (!result.success) return JSON.stringify({ error: result.error })
                return JSON.stringify({ success: true, message: `Đã log ${args.hours}h cho ngày ${args.date}` })
            }
            case 'get_invoices': {
                const invoices = await getInvoices()
                return JSON.stringify(invoices.slice(0, 20).map((i) => ({
                    id: i.id, number: i.invoiceNumber, client: i.clientName,
                    amount: i.amount, state: i.state,
                })))
            }
            case 'get_projects': {
                const projects = await getProjects()
                return JSON.stringify(projects.slice(0, 20).map((p) => ({
                    id: p.id, name: p.name, client: p.clientName, state: p.state,
                })))
            }
            case 'create_task': {
                const err = validateArgs(args, ['phaseId', 'name'])
                if (err) return JSON.stringify({ error: err })
                const result = await createTask({
                    phaseId: args.phaseId,
                    name: args.name,
                    assigneeId: args.assignee || null,
                    deadline: args.dueDate || null,
                })
                if (!result.success) return JSON.stringify({ error: result.error })
                return JSON.stringify({ success: true, task: { id: result.data.id, name: result.data.name } })
            }
            case 'estimate_price': {
                const err = validateArgs(args, ['description'])
                if (err) return JSON.stringify({ error: err })
                const estimate = estimateFromDescription(String(args.description))
                return JSON.stringify({
                    ...estimate,
                    items: estimate.items.map(i => ({
                        ...i,
                        totalFormatted: formatVND(i.total),
                        pricePerM2Formatted: formatVND(i.pricePerM2),
                    })),
                    subtotalFormatted: formatVND(estimate.subtotal),
                    taxFormatted: formatVND(estimate.tax),
                    totalFormatted: formatVND(estimate.total),
                })
            }
            case 'analyze_quotation': {
                const err = validateArgs(args, ['quotationId'])
                if (err) return JSON.stringify({ error: err })
                const order = await getOrder(String(args.quotationId))
                if (!order) return JSON.stringify({ error: 'Không tìm thấy báo giá' })
                const analysis = analyzeQuotation({
                    items: (order as any).items || [],
                    total: (order as any).totalAmount || 0,
                })
                return JSON.stringify({
                    quotation: { id: order.id, name: (order as any).name, client: (order as any).partnerName },
                    ...analysis,
                    totalFormatted: formatVND(analysis.totalValue),
                    estimatedMarketFormatted: formatVND(analysis.estimatedMarket),
                })
            }
            default:
                return JSON.stringify({ error: `Unknown tool: ${name}` })
        }
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Tool execution failed'
        return JSON.stringify({ error: message })
    }
}
