-- ============================================================
-- Payroll Module Migration
-- Bảng lương: payroll_periods + payroll_slips
-- ============================================================

-- 1. Add salary fields to employees table
ALTER TABLE public.employees
    ADD COLUMN IF NOT EXISTS "baseSalary" DECIMAL(15,0) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS "insurableSalary" DECIMAL(15,0) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS "region" INTEGER DEFAULT 1;

COMMENT ON COLUMN public.employees."baseSalary" IS 'Lương gross hàng tháng (VND)';
COMMENT ON COLUMN public.employees."insurableSalary" IS 'Lương đóng BHXH (VND), nếu khác baseSalary';
COMMENT ON COLUMN public.employees.region IS 'Vùng lương tối thiểu (1-4)';

-- 2. Payroll Periods (Kỳ lương)
CREATE TABLE IF NOT EXISTS public.payroll_periods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "month" INTEGER NOT NULL CHECK ("month" BETWEEN 1 AND 12),
    "year" INTEGER NOT NULL CHECK ("year" BETWEEN 2020 AND 2099),
    state TEXT NOT NULL DEFAULT 'DRAFT' CHECK (state IN ('DRAFT','CONFIRMED','PAID','CANCELLED')),
    "totalGross" DECIMAL(15,0) DEFAULT 0,
    "totalDeductions" DECIMAL(15,0) DEFAULT 0,
    "totalNet" DECIMAL(15,0) DEFAULT 0,
    "slipCount" INTEGER DEFAULT 0,
    notes TEXT,
    "confirmedAt" TIMESTAMPTZ,
    "confirmedById" UUID REFERENCES public.users(id),
    "createdAt" TIMESTAMPTZ DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE("month", "year")
);

COMMENT ON TABLE public.payroll_periods IS 'Kỳ lương theo tháng/năm';

-- 3. Payroll Slips (Phiếu lương)
CREATE TABLE IF NOT EXISTS public.payroll_slips (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "periodId" UUID NOT NULL REFERENCES public.payroll_periods(id) ON DELETE CASCADE,
    "employeeId" UUID NOT NULL REFERENCES public.employees(id),

    -- Gross
    "grossSalary" DECIMAL(15,0) NOT NULL DEFAULT 0,

    -- Insurance (employee share)
    "bhxhEmployee" DECIMAL(15,0) DEFAULT 0,
    "bhytEmployee" DECIMAL(15,0) DEFAULT 0,
    "bhtnEmployee" DECIMAL(15,0) DEFAULT 0,
    "totalInsuranceEmployee" DECIMAL(15,0) DEFAULT 0,

    -- Insurance (employer share)
    "bhxhEmployer" DECIMAL(15,0) DEFAULT 0,
    "bhytEmployer" DECIMAL(15,0) DEFAULT 0,
    "bhtnEmployer" DECIMAL(15,0) DEFAULT 0,
    "totalInsuranceEmployer" DECIMAL(15,0) DEFAULT 0,

    -- PIT
    "taxableIncome" DECIMAL(15,0) DEFAULT 0,
    "assessableIncome" DECIMAL(15,0) DEFAULT 0,
    dependents INTEGER DEFAULT 0,
    "pitAmount" DECIMAL(15,0) DEFAULT 0,

    -- Other deductions
    "otherDeductions" DECIMAL(15,0) DEFAULT 0,
    "deductionNotes" TEXT,

    -- Allowances
    allowances DECIMAL(15,0) DEFAULT 0,
    "allowanceNotes" TEXT,

    -- Net
    "totalDeductions" DECIMAL(15,0) DEFAULT 0,
    "netSalary" DECIMAL(15,0) NOT NULL DEFAULT 0,

    "createdAt" TIMESTAMPTZ DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE("periodId", "employeeId")
);

COMMENT ON TABLE public.payroll_slips IS 'Phiếu lương chi tiết theo nhân viên';

-- 4. Enable RLS
ALTER TABLE public.payroll_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payroll_slips ENABLE ROW LEVEL SECURITY;

-- 5. Indexes
CREATE INDEX IF NOT EXISTS idx_payroll_periods_year_month ON public.payroll_periods("year", "month");
CREATE INDEX IF NOT EXISTS idx_payroll_slips_period ON public.payroll_slips("periodId");
CREATE INDEX IF NOT EXISTS idx_payroll_slips_employee ON public.payroll_slips("employeeId");
