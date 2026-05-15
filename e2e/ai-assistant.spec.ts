// spec: specs/ai-assistant-module.md
// seed: e2e/fixtures.ts
import fs from 'node:fs'
import { test, expect } from './fixtures'

async function openAssistant(page: import('@playwright/test').Page) {
    await page.evaluate(() => localStorage.removeItem('vtn_ai_chat'))
    await page.goto('/dashboard')
    await expect(page).toHaveURL(/\/dashboard$/)
    await page.getByLabel(/AI Assistant/i).click()
    await expect(page.getByText('VTN AI Assistant')).toBeVisible()
}

test.describe('AI Assistant', () => {
    test('should open, expand, clear, and close the assistant panel', async ({ authedPage: page }) => {
        await openAssistant(page)

        await expect(page.locator('input[placeholder*="AI"]').last()).toBeVisible()
        await expect(page.locator('button').filter({ hasText: /T.*ng quan|Leads|B.*o gi/i }).first()).toBeVisible()

        await page.getByRole('button', { name: 'Mở rộng' }).click()
        await expect(page.getByText('VTN AI Assistant')).toBeVisible()
        await page.getByRole('button', { name: 'Thu nhỏ' }).click()

        await page.getByRole('button', { name: 'Xóa lịch sử' }).click()
        await expect(page.getByText(/tr.*l.* AI/i).first()).toBeVisible()

        await page.getByRole('button', { name: 'Đóng' }).click()
        await expect(page.getByText('VTN AI Assistant')).toHaveCount(0)
        await expect(page.getByLabel(/AI Assistant/i)).toBeVisible()
    })

    test('should send a prompt and render mocked assistant response', async ({ authedPage: page }) => {
        let requestBody: Record<string, unknown> | undefined
        await page.route('**/api/ai/chat', async (route) => {
            requestBody = route.request().postDataJSON() as Record<string, unknown>
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({ role: 'assistant', content: 'Mock AI: dashboard looks healthy.' }),
            })
        })

        await openAssistant(page)
        await page.locator('input[placeholder*="AI"]').last().fill('Tong quan dashboard hom nay')
        await page.locator('button[type="submit"]').last().click()

        await expect(page.getByText('Tong quan dashboard hom nay')).toBeVisible()
        await expect(page.getByText('Mock AI: dashboard looks healthy.')).toBeVisible()
        expect(requestBody?.attachment).toBeUndefined()
        expect(requestBody?.messages).toEqual(
            expect.arrayContaining([
                expect.objectContaining({ role: 'user', content: 'Tong quan dashboard hom nay' }),
            ])
        )
    })

    test('should send a quick action through the chat endpoint', async ({ authedPage: page }) => {
        let sentContent = ''
        await page.route('**/api/ai/chat', async (route) => {
            const body = route.request().postDataJSON() as { messages: Array<{ role: string; content: string }> }
            sentContent = body.messages.at(-1)?.content ?? ''
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({ role: 'assistant', content: 'Mock AI: quick action done.' }),
            })
        })

        await openAssistant(page)
        await page.locator('button').filter({ hasText: /Leads/ }).click()

        await expect(page.getByText('Mock AI: quick action done.')).toBeVisible()
        expect(sentContent).toMatch(/lead/i)
    })

    test('should render pending action and support cancel and confirm paths', async ({ authedPage: page }) => {
        let confirmNonce = ''
        let confirmCalls = 0

        await page.route('**/api/ai/chat', async (route) => {
            const body = route.request().postDataJSON() as Record<string, unknown>
            const confirmAction = body.confirmAction as { nonce?: string } | undefined

            if (confirmAction) {
                confirmCalls += 1
                confirmNonce = confirmAction.nonce ?? ''
                await route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify({ role: 'assistant', content: 'Lead Test AI da duoc tao.' }),
                })
                return
            }

            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    role: 'assistant',
                    content: 'Can xac nhan truoc khi tao lead.',
                    pendingAction: {
                        toolName: 'create_lead',
                        args: { partnerName: 'Lead Test AI', expectedValue: 100000000 },
                        nonce: 'nonce-ai-test',
                        preview: 'create_lead',
                    },
                }),
            })
        })

        await openAssistant(page)
        await page.locator('input[placeholder*="AI"]').last().fill('Tao lead Lead Test AI')
        await page.locator('button[type="submit"]').last().click()

        await expect(page.getByText(/X.*c nh.*n thao t.*c/i)).toBeVisible()
        await expect(page.getByText('Lead Test AI', { exact: true })).toBeVisible()
        await page.locator('button').filter({ hasText: /H.*y/i }).last().click()
        await expect(page.getByText(/h.*y thao t.*c/i)).toBeVisible()
        expect(confirmCalls).toBe(0)

        await page.locator('input[placeholder*="AI"]').last().fill('Tao lead Lead Test AI lan 2')
        await page.locator('button[type="submit"]').last().click()
        await expect(page.getByText(/X.*c nh.*n thao t.*c/i)).toBeVisible()
        await page.locator('button').filter({ hasText: /X.*c nh.*n/i }).last().click()

        await expect(page.getByText('Lead Test AI da duoc tao.')).toBeVisible()
        expect(confirmCalls).toBe(1)
        expect(confirmNonce).toBe('nonce-ai-test')
    })

    test('should attach a text file and include it in the chat payload', async ({ authedPage: page }, testInfo) => {
        let attachment: Record<string, unknown> | undefined
        await page.route('**/api/ai/chat', async (route) => {
            const body = route.request().postDataJSON() as { attachment?: Record<string, unknown> }
            attachment = body.attachment
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({ role: 'assistant', content: 'Mock AI: file received.' }),
            })
        })

        const filePath = testInfo.outputPath('ai-note.txt')
        fs.writeFileSync(filePath, 'AI assistant e2e attachment content', 'utf8')

        await openAssistant(page)
        await page.locator('input[type="file"]').setInputFiles(filePath)
        await expect(page.getByText('ai-note.txt')).toBeVisible()

        await page.locator('input[placeholder*="AI"], input[placeholder*="t"]').last().fill('Doc file nay')
        await page.locator('button[type="submit"]').last().click()

        await expect(page.getByText('Mock AI: file received.')).toBeVisible()
        expect(attachment).toEqual(expect.objectContaining({
            name: 'ai-note.txt',
            type: 'text/plain',
            content: 'AI assistant e2e attachment content',
            isImage: false,
        }))
    })
})
