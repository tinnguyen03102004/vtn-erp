import { NextRequest } from 'next/server'
import OpenAI from 'openai'
import { toolDefinitions, executeTool } from '@/lib/ai/tools'
import { SYSTEM_PROMPT } from '@/lib/ai/system-prompt'
import { requireAuth } from '@/lib/auth-guard'

// File content extraction helpers
async function extractTextFromPDF(base64: string): Promise<string> {
    try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const pdfModule = await import('pdf-parse') as any
        const pdfParse = pdfModule.default || pdfModule
        const buffer = Buffer.from(base64, 'base64')
        const data = await pdfParse(buffer)
        return data.text?.slice(0, 15000) || 'Không thể đọc nội dung PDF.'
    } catch {
        return 'Không thể trích xuất text từ PDF. Vui lòng thử file khác.'
    }
}

async function extractTextFromDOCX(base64: string): Promise<string> {
    try {
        const mammoth = await import('mammoth')
        const buffer = Buffer.from(base64, 'base64')
        const result = await mammoth.extractRawText({ buffer })
        return result.value?.slice(0, 15000) || 'Không thể đọc nội dung DOCX.'
    } catch {
        return 'Không thể trích xuất text từ DOCX. Vui lòng thử file khác.'
    }
}

interface Attachment {
    name: string
    type: string
    size: number
    content: string
    isImage: boolean
}

// ── BUG-07 FIX: Simple in-memory rate limiter ──
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()
const RATE_LIMIT = 15 // max requests
const RATE_WINDOW = 60_000 // per 1 minute

function checkRateLimit(ip: string): boolean {
    const now = Date.now()
    const entry = rateLimitMap.get(ip)

    if (!entry || now > entry.resetTime) {
        rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_WINDOW })
        return true
    }

    if (entry.count >= RATE_LIMIT) return false
    entry.count++
    return true
}

// ── Write tools that need confirmation ──
const WRITE_TOOLS = new Set([
    'create_lead', 'create_quotation', 'send_quotation',
    'create_employee', 'log_timesheet', 'create_task',
    'convert_lead_to_quotation',
])

function fmtVND(n: number): string {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(n)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function formatSuccessMessage(toolName: string, args: Record<string, any>, result: any): string {
    switch (toolName) {
        case 'create_lead':
            return `✅ Đã tạo lead **${args.partnerName}** thành công!` +
                (args.email ? `\n• Email: ${args.email}` : '') +
                (args.phone ? `\n• SĐT: ${args.phone}` : '') +
                (args.expectedRevenue ? `\n• Giá trị dự kiến: ${fmtVND(args.expectedRevenue)}` : '') +
                '\n\nBạn có thể xem lead mới trong **CRM & Leads**.'

        case 'create_quotation':
            return `✅ Đã tạo báo giá **${result.order?.name || ''}** cho **${args.partnerName}**` +
                (args.totalAmount ? ` với giá trị ${fmtVND(args.totalAmount)}` : '') +
                '.\n\nBạn có thể xem trong **Báo giá & HĐ**.'

        case 'send_quotation':
            return `✅ Đã gửi báo giá **${result.name || args.orderId || ''}** thành công!`

        case 'create_employee':
            return `✅ Đã tạo nhân viên **${args.name || ''}** thành công!` +
                (args.department ? `\n• Phòng ban: ${args.department}` : '') +
                (args.position ? `\n• Chức vụ: ${args.position}` : '')

        case 'log_timesheet':
            return `✅ Đã ghi nhận **${args.hours || 0} giờ** timesheet thành công!`

        case 'create_task':
            return `✅ Đã tạo task **${args.name || ''}** thành công!` +
                (args.priority ? `\n• Ưu tiên: ${args.priority}` : '')

        case 'convert_lead_to_quotation':
            return `✅ Đã chuyển lead thành báo giá **${result.name || ''}** thành công!` +
                '\n\nBạn có thể xem trong **Báo giá & HĐ**.'

        default:
            return `✅ Đã thực hiện **${toolName}** thành công!`
    }
}

export async function POST(req: NextRequest) {
    try {
        try {
            await requireAuth()
        } catch {
            return Response.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Rate limit check
        const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'
        if (!checkRateLimit(ip)) {
            return Response.json({ error: 'Quá nhiều yêu cầu. Vui lòng chờ 1 phút.' }, { status: 429 })
        }

        const apiKey = process.env.OPENAI_API_KEY
        if (!apiKey || apiKey === 'sk-PASTE-YOUR-KEY-HERE') {
            return Response.json({ error: 'OPENAI_API_KEY chưa được cấu hình trong .env. Hãy restart dev server sau khi thêm key.' }, { status: 500 })
        }

        const openai = new OpenAI({ apiKey })

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let body: any
        try {
            body = await req.json()
        } catch {
            return Response.json({ error: 'Invalid JSON body' }, { status: 400 })
        }

        const { messages, confirmAction, attachment } = body
        if (!messages || !Array.isArray(messages)) {
            return Response.json({ error: 'messages must be an array' }, { status: 400 })
        }

        // ── Process attachment if present ──
        let fileContext = ''
        let imageContent: OpenAI.Chat.Completions.ChatCompletionContentPart | null = null

        if (attachment) {
            const att = attachment as Attachment
            if (att.isImage) {
                // For images: use GPT-4o vision with image_url
                imageContent = {
                    type: 'image_url',
                    image_url: {
                        url: `data:${att.type};base64,${att.content}`,
                        detail: 'low', // cost-efficient
                    },
                }
            } else if (att.type === 'text/plain' || att.type === 'text/csv') {
                // Text files: content is already text
                fileContext = `\n\n--- NỘI DUNG FILE: ${att.name} ---\n${att.content.slice(0, 15000)}\n--- HẾT FILE ---`
            } else if (att.type === 'application/pdf') {
                const text = await extractTextFromPDF(att.content)
                fileContext = `\n\n--- NỘI DUNG PDF: ${att.name} ---\n${text}\n--- HẾT FILE ---`
            } else if (att.type.includes('word') || att.type.includes('document')) {
                const text = await extractTextFromDOCX(att.content)
                fileContext = `\n\n--- NỘI DUNG DOCX: ${att.name} ---\n${text}\n--- HẾT FILE ---`
            }
        }

        // ── BUG-05 FIX: If user confirmed a pending action, execute it ──
        if (confirmAction) {
            const { toolName, args } = confirmAction
            const result = await executeTool(toolName, args)
            const parsed = JSON.parse(result)

            if (parsed.error) {
                return Response.json({
                    role: 'assistant',
                    content: `❌ Lỗi: ${parsed.error}`,
                })
            }

            // Format friendly success message per tool type
            const content = formatSuccessMessage(toolName, args, parsed)
            return Response.json({ role: 'assistant', content })
        }

        // Build messages for OpenAI
        const systemMsg = SYSTEM_PROMPT + (fileContext ? `\n\nUser đã đính kèm tài liệu. Hãy phân tích nội dung file và trả lời câu hỏi dựa trên nó.${fileContext}` : '')

        const chatMessages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
            { role: 'system', content: systemMsg },
        ]

        // Add conversation history
        for (const m of messages) {
            chatMessages.push(m)
        }

        // If there's an image attachment, modify the LAST user message to include image
        if (imageContent && chatMessages.length > 0) {
            const lastMsg = chatMessages[chatMessages.length - 1]
            if (lastMsg.role === 'user') {
                const textContent = typeof lastMsg.content === 'string' ? lastMsg.content : ''
                chatMessages[chatMessages.length - 1] = {
                    role: 'user',
                    content: [
                        { type: 'text', text: textContent || `Phân tích hình ảnh đính kèm: ${(attachment as Attachment).name}` },
                        imageContent,
                    ],
                }
            }
        }

        // First call — may include function calls
        let response = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: chatMessages,
            tools: toolDefinitions,
            tool_choice: 'auto',
            max_tokens: 2048,
        })

        let message = response.choices[0].message

        // If the model wants to call tools, execute them and feed results back
        const maxIterations = 5
        let iteration = 0
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let pendingAction: { toolName: string; args: Record<string, any>; preview: string } | null = null

        while (message.tool_calls && message.tool_calls.length > 0 && iteration < maxIterations) {
            iteration++

            // Add assistant message with tool calls
            chatMessages.push(message)

            // Execute each tool call
            for (const toolCall of message.tool_calls) {
                if (toolCall.type !== 'function') continue

                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                let args: Record<string, any>
                try {
                    args = JSON.parse(toolCall.function.arguments)
                } catch {
                    chatMessages.push({
                        role: 'tool',
                        tool_call_id: toolCall.id,
                        content: JSON.stringify({ error: 'Invalid tool arguments' }),
                    })
                    continue
                }

                // BUG-05: Write tools → return confirmation instead of executing
                if (WRITE_TOOLS.has(toolCall.function.name)) {
                    pendingAction = {
                        toolName: toolCall.function.name,
                        args,
                        preview: `Tool: **${toolCall.function.name}**\nDữ liệu: ${JSON.stringify(args, null, 2)}`,
                    }
                    // Tell AI the action needs confirmation
                    chatMessages.push({
                        role: 'tool',
                        tool_call_id: toolCall.id,
                        content: JSON.stringify({
                            status: 'PENDING_CONFIRMATION',
                            message: 'Hành động này cần user xác nhận trước khi thực hiện.',
                            action: toolCall.function.name,
                            args,
                        }),
                    })
                } else {
                    // Read-only tools → execute directly
                    const result = await executeTool(toolCall.function.name, args)
                    chatMessages.push({
                        role: 'tool',
                        tool_call_id: toolCall.id,
                        content: result,
                    })
                }
            }

            // If there's a pending action, let AI generate confirm message and break
            if (pendingAction) {
                response = await openai.chat.completions.create({
                    model: 'gpt-4o-mini',
                    messages: chatMessages,
                    max_tokens: 2048,
                    // No tools — force text response for confirmation message
                })
                message = response.choices[0].message
                break
            }

            // Call again with tool results
            response = await openai.chat.completions.create({
                model: 'gpt-4o-mini',
                messages: chatMessages,
                tools: toolDefinitions,
                tool_choice: 'auto',
                max_tokens: 2048,
            })

            message = response.choices[0].message
        }

        return Response.json({
            role: 'assistant',
            content: message.content || '',
            toolCalls: message.tool_calls || null,
            pendingAction: pendingAction || null,
        })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
        console.error('AI Chat Error:', err)
        return Response.json(
            { error: err.message || 'AI error' },
            { status: 500 }
        )
    }
}
