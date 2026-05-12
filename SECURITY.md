# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| 0.1.x   | ✅ Active |
| < 0.1   | ❌ EOL    |

## Reporting a Vulnerability

**⚠️ KHÔNG tạo public issue cho security vulnerabilities.**

### How to Report

1. **Email**: Gửi email đến **security@vtn.vn** với:
   - Mô tả chi tiết vulnerability
   - Steps to reproduce
   - Impact assessment
   - Suggested fix (nếu có)

2. **Response Time**: Chúng tôi sẽ phản hồi trong vòng **48 giờ**

3. **Disclosure**: Sau khi fix được deploy, chúng tôi sẽ:
   - Credit cho người phát hiện (nếu đồng ý)
   - Publish security advisory
   - Release patch version

## Security Architecture

### Authentication

- **Server-side sessions** — Cookie chỉ chứa HMAC-signed token, không chứa user data
- **HMAC-SHA256** signing — Chống cookie tampering
- **bcrypt** password hashing — Cost factor 10+
- **Session expiry** — Auto-expire sau 7 ngày
- **IP + UserAgent tracking** — Mỗi session ghi nhận device info

### Authorization (RBAC)

- **5 roles**: DIRECTOR, PROJECT_MANAGER, ARCHITECT, FINANCE, SALES
- **13 permissions**: Granular control per module
- **Server-side enforcement**: `requirePermission()` guard trên mọi mutation
- **No client-side security**: UI chỉ là convenience, server là source of truth

### Database Security

- **Row Level Security (RLS)**: Enabled trên toàn bộ tables
- **Supabase anon key**: Read-only, RLS-filtered access
- **No direct DB exposure**: Tất cả queries đi qua server actions
- **Audit logging**: Critical actions được log vào `audit_logs` table

### API Security

- **CSRF Protection**: Same-origin cookie (httpOnly, secure, sameSite)
- **Rate Limiting**: AI chat endpoint rate-limited (15 req/min/IP)
- **Input Validation**: Zod schemas validate tất cả user input
- **File Upload**: Type + size validation (max 10MB)

### AI Safety

- **Write operations require confirmation**: User phải xác nhận trước khi AI thực hiện write actions
- **Read-only by default**: AI tools mặc định chỉ đọc data
- **No PII in prompts**: System prompt không chứa sensitive data

## Security Checklist for Contributors

- [ ] Mọi server action phải có `requireAuth()` hoặc `requirePermission()`
- [ ] Input validation bằng Zod schema trước khi xử lý
- [ ] Không log sensitive data (passwords, tokens, API keys)
- [ ] Không expose internal errors cho client (`fail('Something went wrong')`)
- [ ] File uploads phải validate type và size
- [ ] SQL queries qua Supabase JS (parameterized, không raw string)
- [ ] Audit log cho hành động thay đổi data quan trọng

## Known Security Considerations

| Item | Status | Notes |
|------|--------|-------|
| RLS on all tables | ✅ Enabled | All 22 tables |
| Password hashing | ✅ bcrypt | Cost factor 10 |
| Session security | ✅ HMAC-signed | httpOnly + Secure |
| CSRF protection | ✅ SameSite cookie | Strict mode |
| Input validation | ✅ Zod schemas | Server-side |
| Rate limiting | ⚠️ In-memory only | Needs Redis for production |
| Leaked password check | ❌ Not implemented | Planned for v0.2 |
| 2FA | ❌ Not implemented | Planned for v0.3 |
| Dependency audit | ⚠️ 5 moderate vulns | postcss in next.js bundle |
