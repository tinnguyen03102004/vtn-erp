# AI Assistant Test Plan

## Scope
- In scope:
  - Open, close, expand, and clear the floating AI Assistant panel.
  - Send a user prompt and render an assistant response from `/api/ai/chat`.
  - Execute a quick action through the same chat path.
  - Render write-action confirmation details and handle both confirm and cancel paths.
  - Attach a small text file and send it with the prompt payload.
- Out of scope:
  - Live OpenAI responses, model quality, and external API availability.
  - Destructive write tools against production-like data.

## Environment
- Seed: `e2e/fixtures.ts` authenticated Director session.
- Base URL: `http://localhost:3000`.
- Required data: existing dashboard access only.
- Network: mock `/api/ai/chat` inside Playwright tests.

## Scenarios
### 1. Open and manage the assistant panel
**Seed:** `e2e/fixtures.ts`
**Preconditions:** User is authenticated as Director.
**Steps:**
1. Open `/dashboard`.
2. Click the floating AI Assistant button.
3. Verify the panel title, welcome message, quick actions, input, attach, send, clear, expand, and close controls.
4. Expand, collapse, clear history, and close the panel.
**Expected Results:**
- The panel opens and closes without navigation.
- Quick actions and input controls are visible.
- Clear history returns to the welcome state.

### 2. Send a prompt and receive a mocked response
**Seed:** `e2e/fixtures.ts`
**Preconditions:** `/api/ai/chat` is mocked.
**Steps:**
1. Open the assistant.
2. Enter a prompt.
3. Submit the message.
4. Inspect the mocked request payload.
**Expected Results:**
- User message appears.
- Assistant response appears.
- Payload contains recent messages and no attachment.

### 3. Quick action uses chat endpoint
**Seed:** `e2e/fixtures.ts`
**Preconditions:** `/api/ai/chat` is mocked.
**Steps:**
1. Open the assistant on a fresh page context.
2. Click a quick action.
**Expected Results:**
- The quick-action text is sent as a user message.
- The mocked assistant reply appears.

### 4. Pending write action confirmation
**Seed:** `e2e/fixtures.ts`
**Preconditions:** `/api/ai/chat` first returns `pendingAction`, then confirm response.
**Steps:**
1. Send a prompt that asks to create a lead.
2. Verify the confirmation card shows action details.
3. Cancel once.
4. Send again, then confirm.
**Expected Results:**
- Cancel appends a cancelled message and does not call confirm.
- Confirm sends `confirmAction.nonce` and renders the success message.

### 5. Text file attachment
**Seed:** `e2e/fixtures.ts`
**Preconditions:** `/api/ai/chat` is mocked.
**Steps:**
1. Open the assistant.
2. Attach a `.txt` file.
3. Send a prompt about the file.
**Expected Results:**
- File chip is visible before send.
- Payload includes attachment name, type, size, content, and `isImage: false`.
- Assistant response appears.
