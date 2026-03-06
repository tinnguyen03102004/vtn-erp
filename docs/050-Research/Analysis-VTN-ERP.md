---
id: RESEARCH-001
type: research
status: draft
project: VTN-ERP
owner: "@product-team"
tags: [odoo, erp, architecture-firm, research]
created: 2026-03-04
---

# Research Insights: VTN Architecture ERP

## 1. Odoo Repository Analysis

### Tech Stack (github.com/odoo/odoo)
| Layer        | Technology                                                    |
| ------------ | ------------------------------------------------------------- |
| Backend      | Python 3.x, Custom ORM (Active Record pattern)                |
| Database     | PostgreSQL                                                    |
| Frontend     | OWL (Odoo Web Library) — TypeScript/JS, inspired by React/Vue |
| Templating   | QWeb (XML-based)                                              |
| API          | JSON-RPC, REST (via Odoo controllers)                         |
| Architecture | MVC, Modular (each feature = standalone module)               |

### Key Odoo Modules Relevant to Architecture Firms
| Module         | Purpose                         | VTN Use Case                        |
| -------------- | ------------------------------- | ----------------------------------- |
| `crm`          | Lead & opportunity pipeline     | Lead → Báo giá                      |
| `sale`         | Quotations & sales orders       | Báo giá → Hợp đồng                  |
| `account`      | Invoicing, payments, milestones | Tạm ứng + thanh toán theo giai đoạn |
| `project`      | Project & task management       | Triển khai dự án theo phase         |
| `hr_timesheet` | Time tracking per task          | Theo dõi giờ công kiến trúc sư      |
| `hr`           | Employee management             | Quản lý 30 nhân sự                  |
| `documents`    | File/document storage           | Bản vẽ, hồ sơ dự án                 |
| `sign`         | Digital signatures              | Ký hợp đồng điện tử                 |
| `mail`         | Messaging & notifications       | Chatter, email log                  |

### Odoo's Key Strengths for VTN
- **Milestone-based billing**: Built-in support for invoicing by project milestone
- **Auto project creation**: Confirming a sale order auto-creates project + tasks
- **CRM → Sale → Invoice pipeline**: Full lifecycle in one system
- **Modular**: Start with 4-5 core modules, expand gradually

---

## 2. Architecture Firm ERP Best Practices (2024-2025)

### Key Findings
1. **Project-Based Accounting** is critical — track cost & revenue per project, not globally
2. **Milestone Payment Schedules** are the standard billing model in architecture (not time-based)
3. **Phase-Based Work Breakdown**: Typical phases = Design Concept → Schematic → Design Dev → Construction Docs → Site Supervision → Close
4. **Resource Utilization Tracking**: Critical for profitability — who's working on what, at what % capacity
5. **Client Portal**: Architecture clients expect visibility into project progress & invoices
6. **Document Management**: Plans, BIM files, contracts must be versioned and stored centrally

### Industry-Specific "Wow Factors"
- 🎯 **Real-time profitability dashboard** per project (Revenue vs. Hours Burned)
- 📊 **Phase completion tracker** with % progress
- 💰 **Cash flow forecast** based on milestone schedule
- 🏗️ **Project Kanban board** with drag-and-drop stage management
- 📋 **Auto-generated payment requests** when milestones are approved
- 🔔 **Smart alerts**: budget overrun, upcoming payment milestones, contract expiry

### Common Pitfalls to Avoid
- ❌ Over-engineering: 30-person firm doesn't need manufacturing/warehouse modules
- ❌ Complex accounting setup initially — keep it simple (VND, local taxes)
- ❌ Forcing time-tracking if architects resist it — make it optional/gamified
- ❌ Too many user roles — start with: Admin, Director, PM, Architect, Finance

---

## 3. VTN Business Process Analysis

### VTN Workflow (as specified)
```
Lead → Báo giá → Deal Hợp đồng → Nhận Tạm ứng lần 1
  → Bắt đầu Dự án + Thiết kế Ý tưởng
  → [Nhận tiền theo từng giai đoạn] × N
  → Đóng dự án / Quyết toán
```

### Mapped to ERP Modules
| Stage                     | Odoo Module                 | Key Data                            |
| ------------------------- | --------------------------- | ----------------------------------- |
| Lead                      | CRM                         | Contact, source, probability        |
| Báo giá                   | Sale                        | Quote PDF, fee schedule, scope      |
| Hợp đồng                  | Sale + Sign                 | Signed contract, payment milestones |
| Tạm ứng                   | Account (Invoice)           | 30% advance invoice, bank transfer  |
| Dự án bắt đầu             | Project                     | Phases, tasks, assigned architects  |
| Thanh toán theo giai đoạn | Account (Milestone Invoice) | Invoice at each milestone approval  |
| Đóng dự án                | Project                     | Phase "Closed", final invoice       |

### Payment Milestone Example (Typical Architecture Contract)
| Milestone                        | % of Total Fee | Trigger                    |
| -------------------------------- | -------------- | -------------------------- |
| Ký hợp đồng / Tạm ứng            | 20-30%         | Contract signed            |
| Bàn giao Ý tưởng thiết kế        | 10-15%         | Concept approved by client |
| Bàn giao Hồ sơ Thiết kế Cơ sở    | 15-20%         | Schematic design approved  |
| Bàn giao Hồ sơ Thiết kế Kỹ thuật | 20-25%         | DD approved                |
| Bàn giao Hồ sơ Xây dựng          | 15-20%         | CDs completed              |
| Quyết toán / Đóng dự án          | 5-10%          | Project closed             |

---

## 4. Tech Stack Decision: Build vs. Configure Odoo

### Option A: Self-hosted Odoo (Configure + Extend)
- **Pros**: Rich ERP out-of-box, CRM→Sale→Account→Project pipeline built-in, active community
- **Cons**: Python required, complex initial setup, UI may feel generic, learning curve
- **Cost**: Free (Community Edition), hosting needed (~$20-50/month VPS)
- **Time to first value**: 2-4 weeks for basic setup

### Option B: Custom Next.js + Supabase (inspired by Odoo patterns)
- **Pros**: Full UX control, modern stack, team already has experience (VTN ERP v1), faster iteration
- **Cons**: Must build all ERP logic from scratch, more development time
- **Cost**: Higher dev cost, Supabase free tier or ~$25/month
- **Time to first value**: 4-8 weeks for MVP

### Option C: Hybrid — Custom Frontend + Odoo Backend (API)
- **Pros**: Best of both — Odoo business logic + custom beautiful UI
- **Cons**: Highest complexity, need to maintain two systems
- **Recommendation**: Avoid for 30-person team

### 🏆 Recommendation for VTN
**Option B (Custom Next.js + Supabase)** — because:
1. VTN already has a working v1 codebase with this stack
2. Custom UX feels more modern and tailored vs. Odoo's generic UI
3. Full control over the VTN-specific workflow
4. Use **Odoo as inspiration** for module structure & business logic patterns
5. Easier to maintain with Vietnamese-speaking developers

**Odoo repo provides**: Architecture patterns, data model inspiration, workflow logic, proven UX flows
**Custom build provides**: VTN-specific branding, Vietnamese UX, modern design

---

## 5. Competitive & WOW Factor Analysis

### Modern Architecture ERP "Wow Factors" (2025)
1. **Dark mode premium dashboard** — Deep navy/gold color scheme (architectural aesthetic)
2. **Visual project timeline** — Gantt chart with milestone markers overlaid on payment schedule
3. **Cash flow health indicator** — Traffic light system for project financial health
4. **Drag-to-approve milestones** — Architects drag task card to "Approved" → triggers invoice
5. **Client-facing portal** — Clients see project phases, deliverables, and pay invoices online
6. **Mobile-first timesheet** — Quick log hours from phone (WhatsApp-bot integration potential)
7. **AI-suggested next actions** — "Payment milestone overdue, send reminder?" one-click action

### References from Odoo Patterns
- Odoo CRM: Kanban pipeline stages (adapt for architecture project stages)
- Odoo Project: Gantt + Kanban, milestone tasks, timesheets per task
- Odoo Accounting: Milestone-based invoice templates, payment terms
- Odoo Documents: Folder structure per project for BIM/drawing files

---

## 6. Sources

- [Odoo GitHub Repo](https://github.com/odoo/odoo)
- [Odoo for Architecture Firms - macrofix.com](https://macrofix.com)
- [Best Architecture ERP 2024 - archivinci.com](https://archivinci.com)
- [Monograph - Architecture-specific PM](https://monograph.com)
- [BQE Core - A&E Firm ERP](https://bqe.com)
- [Odoo Architecture Tech Stack - medium.com](https://medium.com)
