-- Add payment tracking fields to payroll_periods
ALTER TABLE public.payroll_periods
    ADD COLUMN IF NOT EXISTS "paidAt" TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS "paidById" UUID REFERENCES public.users(id),
    ADD COLUMN IF NOT EXISTS "bankRef" TEXT;

-- Add dependents and allowances to employees (used in PIT calculation)
ALTER TABLE public.employees
    ADD COLUMN IF NOT EXISTS "dependents" INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS "allowances" DECIMAL(15,0) DEFAULT 0;

COMMENT ON COLUMN public.payroll_periods."paidAt" IS 'Ngày chi trả lương';
COMMENT ON COLUMN public.payroll_periods."paidById" IS 'Người thực hiện chi trả';
COMMENT ON COLUMN public.payroll_periods."bankRef" IS 'Mã tham chiếu chuyển khoản ngân hàng';
COMMENT ON COLUMN public.employees."dependents" IS 'Số người phụ thuộc (giảm trừ TNCN)';
COMMENT ON COLUMN public.employees."allowances" IS 'Phụ cấp hàng tháng (VND)';
