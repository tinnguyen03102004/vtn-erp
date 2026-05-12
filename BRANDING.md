# Branding — VTN ERP

> Brand guidelines cho VTN ERP system

## Identity

| Property | Value |
|----------|-------|
| **Product Name** | VTN ERP |
| **Full Name** | VTN Architects — Enterprise Resource Planning |
| **Company** | Công ty TNHH Võ Trọng Nghĩa (VTN Architects) |
| **Domain** | Architecture & Design |
| **Tagline** | _Quản lý kiến trúc thông minh_ |

## Color Palette

### Primary Colors

| Name | Hex | Usage |
|------|-----|-------|
| Navy Dark | `#0F1C2E` | Primary background, headings |
| Navy | `#1F3A5F` | Secondary background, cards |
| Sky Blue | `#3B82F6` | Primary accent, links, buttons |
| Emerald | `#22C55E` | Success states, positive KPIs |

### Secondary Colors

| Name | Hex | Usage |
|------|-----|-------|
| Gold | `#C9A84C` | Warning states, pending items |
| Red | `#EF4444` | Error states, overdue items |
| Slate | `#8FA3BF` | Muted text, placeholders |
| Light Gray | `#F1F5F9` | Page backgrounds |

### Status Colors

| State | Color | Hex |
|-------|-------|-----|
| DRAFT | Gray | `#8FA3BF` |
| SENT / ACTIVE | Blue | `#3B82F6` |
| CONFIRMED / DONE | Green | `#22C55E` |
| PAID | Purple | `#8B5CF6` |
| CANCELLED | Red | `#EF4444` |
| WARNING | Gold | `#C9A84C` |

## Typography

| Usage | Font | Weight | Size |
|-------|------|--------|------|
| Headings | Inter | 700 (Bold) | 18–28px |
| Body | Inter | 400 (Regular) | 13–14px |
| Labels | Inter | 500 (Medium) | 11–12px |
| Monospace | JetBrains Mono | 400 | 12–13px |
| KPI Values | Inter | 700 | 22–32px |

## UI Components

### Badges

```
.badge-primary   → Blue background (#3B82F6)
.badge-success   → Green background (#22C55E)
.badge-warning   → Gold background (#C9A84C)
.badge-danger    → Red background (#EF4444)
.badge-muted     → Gray background (#8FA3BF)
```

### Cards

- Border radius: `12px`
- Background: `white`
- Shadow: `0 1px 3px rgba(0,0,0,0.08)`
- Padding: `20px`

### Buttons

| Type | Style |
|------|-------|
| Primary | Blue bg, white text, rounded |
| Secondary | Outlined, navy border |
| Danger | Red bg, white text |
| Ghost | No bg, text only |

## Logo Usage

- Minimum size: 32px height
- Clear space: 8px on all sides
- Dark background: Use white version
- Light background: Use navy version

## Icons

Using [Lucide React](https://lucide.dev/) icon library.

| Context | Preferred Icons |
|---------|----------------|
| Navigation | `LayoutDashboard`, `Users`, `Briefcase`, `FileText` |
| Actions | `Plus`, `Edit`, `Trash2`, `Download` |
| Status | `CheckCircle`, `Clock`, `AlertTriangle`, `XCircle` |
| Finance | `DollarSign`, `Receipt`, `CreditCard` |

## Vietnamese Formatting

| Format | Standard | Example |
|--------|----------|---------|
| Currency | `đ` suffix, dot thousands | `150.000.000 đ` |
| Date | `DD/MM/YYYY` | `12/05/2026` |
| Phone | `+84 xxx xxx xxxx` | `+84 912 345 678` |
| Tax ID | `10-digit` | `0102345678` |
