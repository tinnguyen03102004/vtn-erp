import { NextRequest } from 'next/server'
import OpenAI from 'openai'
import { toolDefinitions, executeTool } from '@/lib/ai/tools'
import { SYSTEM_PROMPT } from '@/lib/ai/system-prompt'

// ââ BUG-07 FIX: Simple in-memory rate limiter ââ
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

// ââ Write tools that need confirmation ââ
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
            return `â ÄÃ£ táº¡o lead **${args.partnerName}** thÃ nh cÃ´ng!` +
                (args.email ? `\nâ¢ Email: ${args.email}` : '') +
                (args.phone ? `\nâ¢ SÄT: ${args.phone}` : '') +
                (args.expectedValue ? `\nâ¢ GiÃ¡ trá» dá»± kiáº¿n: ${fmtVND(args.expectedValue)}` : '') +
                '\n\nBáº¡n cÃ³ thá» xem lead má»i trong **CRM & Leads**.'

        case 'create_quotation':
            return `â ÄÃ£ táº¡o bÃ¡o giÃ¡ **${result.order?.name || ''}** cho **${args.partnerName}**` +
                (args.totalAmount ? ` vá»i giÃ¡ trá» ${fmtVND(args.totalAmount)}` : '') +
                '.\n\nBáº¡n cÃ³ thá» xem trong **BÃ¡o giÃ¡ & HÄ**.'

        case 'send_quotation':
            return `â ÄÃ£ gá»­i bÃ¡o giÃ¡ **${result.name || args.orderId || ''}** thÃ nh cÃ´ng!`

        case 'create_employee':
            return `â ÄÃ£ táº¡o nhÃ¢n viÃªn **${args.name || ''}** thÃ nh cÃ´ng!` +
                (args.department ? `\nâ¢ PhÃ²ng ban: ${args.department}` : '') +
                (args.position ? `\nâ¢ Chá»©c vá»¥: ${args.position}` : '')

        case 'log_timesheet':
            return `â ÄÃ£ ghi nháº­n **${args.hours || 0} giá»** timesheet thÃ nh cÃ´ng!`

        case 'create_task':
            return `â ÄÃ£ táº¡o task **${args.name || ''}** thÃ nh cÃ´ng!` +
                (args.priority ? `\nâ¢ Æ¯u tiÃªn: ${args.priority}` : '')

        case 'convert_lead_to_quotation':
            return `â ÄÃ£ chuyá»n lead thÃ nh bÃ¡o giÃ¡ **${result.name || ''}** thÃ nh cÃ´ng!` +
                '\n\nBáº¡n cÃ³ thá» xem trong **BÃ¡o giÃ¡ & HÄ**.'

        default:
            return `â ÄÃ£ thá»±c hiá»n **${toolName}** thÃ nh cÃ´ng!`
    }
}

export async function POST(req: NextRequest) {
    try {
        // Rate limit check
        const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'
        if (!checkRateLimit(ip)) {
            return Response.json({ error: 'QuÃ¡ nhiá»u yÃªu cáº§u. Vui lÃ²ng chá» 1 phÃºt.' }, { status: 429 })
        }

        const apiKey = process.env.OPENAI_API_KEY
        if (!apiKey || apiKey === 'sk-PASTE-YOUR-KEY-HERE') {
            return Response.json({ error: 'OPENAI_API_KEY chÆ°a ÄÆ°á»£c cáº¥u hÃ¬nh trong .env. HÃ£y restart dev server sau khi thÃªm key.' }, { status: 500 })
        }

        const openai = new OpenAI({ apiKey })

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let body: any
        try {
            body = await req.json()
        } catch {
            return Response.json({ error: 'Invalid JSON body' }, { status: 400 })
        }

        const { messages, confirmAction } = body
        if (!messages || !Array.isArray(messages)) {
            return Response.json({ error: 'messages must be an array' }, { status: 400 })
        }

        // ââ BUG-05 FIX: If user confirmed a pending action, execute it ââ
        if (confirmAction) {
            const { toolName, args } = confirmAction
            const result = await executeTool(toolName, args)
            const parsed = JSON.parse(result)

            if (parsed.error) {
                return Response.json({
                    role: 'assistant',
                    content: `â Lá»-i: ${parsed.error}`,
                })
            }

            // Format friendly success message per tool type
            const content = formatSuccessMessage(toolName, args, parsed)
            return Response.json({ role: 'assistant', content })
        }

        const chatMessages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
            { role: 'system', content: SYSTEM_PROMPT },
            ...messages,
        ]

        // First call â may include function calls
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

                // BUG-05: Write tools â return confirmation instead of executing
                if (WRITE_TOOLS.has(toolCall.function.name)) {
                    pendingAction = {
                        toolName: toolCall.function.name,
                        args,
                        preview: `Tool: **${toolCall.function.name}**\nDá»¯ liá»u: ${JSON.stringify(args, null, 2)}`,
                    }
                    // Tell AI the action needs confirmation
                    chatMessages.push({
                        role: 'tool',
                        tool_call_id: toolCall.id,
                        content: JSON.stringify({
                            status: 'PENDING_CONFIRMATION',
                            message: 'HÃ nh Äá»ng nÃ y cáº§n user xÃ¡c nháº­n trÆ°á»c khi thá»±c hiá»n.',
                            action: toolCall.function.name,
                            args,
                        }),
                    })
                } else {
                    // Read-only tools â execute directly
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
                    // No tools â force text response for confirmation message
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
