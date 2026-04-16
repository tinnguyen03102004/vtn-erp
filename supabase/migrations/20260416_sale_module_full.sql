-- ============================================================
-- Sale Module: Báo giá & Hợp đồng (Full VietERP)
-- ============================================================

-- 1. Sale Orders (Quotations + Contracts)
CREATE TABLE IF NOT EXISTS public.sale_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    "docType" TEXT NOT NULL DEFAULT 'QUOTATION' CHECK ("docType" IN ('QUOTATION','CONTRACT')),
    state TEXT NOT NULL DEFAULT 'DRAFT',
    "quotationId" UUID REFERENCES public.sale_orders(id),
    "leadId" UUID,
    "partnerName" TEXT,
    "partnerEmail" TEXT,
    "partnerPhone" TEXT,
    "partnerAddress" TEXT,
    "partnerTaxCode" TEXT,
    "totalAmount" DECIMAL(15,0) DEFAULT 0,
    "discountPercent" DECIMAL(5,2) DEFAULT 0,
    "discountAmount" DECIMAL(15,0) DEFAULT 0,
    "vatRate" DECIMAL(5,2) DEFAULT 10,
    "vatAmount" DECIMAL(15,0) DEFAULT 0,
    "grandTotal" DECIMAL(15,0) DEFAULT 0,
    "validityDate" DATE,
    "expiresAt" TIMESTAMPTZ,
    notes TEXT,
    "rejectedReason" TEXT,
    "revision" INTEGER DEFAULT 1,
    "sentAt" TIMESTAMPTZ,
    "approvedAt" TIMESTAMPTZ,
    "signedAt" TIMESTAMPTZ,
    "createdById" UUID REFERENCES public.users(id),
    "createdAt" TIMESTAMPTZ DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE("name")
);

-- 2. Sale Order Lines (Dịch vụ / Hạng mục)
CREATE TABLE IF NOT EXISTS public.sale_order_lines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "orderId" UUID NOT NULL REFERENCES public.sale_orders(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    qty DECIMAL(10,2) DEFAULT 1,
    unit TEXT DEFAULT 'bộ',
    "unitPrice" DECIMAL(15,0) DEFAULT 0,
    "discountPercent" DECIMAL(5,2) DEFAULT 0,
    "vatRate" DECIMAL(5,2) DEFAULT 10,
    subtotal DECIMAL(15,0) DEFAULT 0,
    sequence INTEGER DEFAULT 0,
    "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Sale Milestones (Tiến độ thanh toán)
CREATE TABLE IF NOT EXISTS public.sale_milestones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "orderId" UUID NOT NULL REFERENCES public.sale_orders(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    percent DECIMAL(5,2) DEFAULT 0,
    amount DECIMAL(15,0) DEFAULT 0,
    "dueDate" DATE,
    state TEXT DEFAULT 'PENDING' CHECK (state IN ('PENDING','INVOICED','PAID')),
    "invoiceId" UUID,
    sequence INTEGER DEFAULT 0,
    "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Indexes
CREATE INDEX IF NOT EXISTS idx_sale_orders_doctype ON public.sale_orders("docType");
CREATE INDEX IF NOT EXISTS idx_sale_orders_state ON public.sale_orders(state);
CREATE INDEX IF NOT EXISTS idx_sale_orders_partner ON public.sale_orders("partnerName");
CREATE INDEX IF NOT EXISTS idx_sale_order_lines_orderid ON public.sale_order_lines("orderId");
CREATE INDEX IF NOT EXISTS idx_sale_milestones_orderid ON public.sale_milestones("orderId");

-- 5. RLS
ALTER TABLE public.sale_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sale_order_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sale_milestones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sale_orders_all" ON public.sale_orders FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "sale_order_lines_all" ON public.sale_order_lines FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "sale_milestones_all" ON public.sale_milestones FOR ALL USING (true) WITH CHECK (true);

-- 6. Comments
COMMENT ON TABLE public.sale_orders IS 'Báo giá và Hợp đồng';
COMMENT ON COLUMN public.sale_orders."docType" IS 'QUOTATION hoặc CONTRACT';
COMMENT ON COLUMN public.sale_orders."discountPercent" IS 'Chiết khấu % trên tổng';
COMMENT ON COLUMN public.sale_orders."vatRate" IS 'Thuế GTGT % (mặc định 10%)';
COMMENT ON COLUMN public.sale_orders."grandTotal" IS 'Tổng sau CK + VAT';
COMMENT ON COLUMN public.sale_orders."revision" IS 'Phiên bản báo giá (v1, v2...)';
COMMENT ON COLUMN public.sale_order_lines."discountPercent" IS 'Chiết khấu % per line';
COMMENT ON COLUMN public.sale_order_lines."vatRate" IS 'Thuế GTGT % per line';
COMMENT ON COLUMN public.sale_order_lines.unit IS 'Đơn vị tính (bộ, m2, tháng...)';
COMMENT ON COLUMN public.sale_milestones."invoiceId" IS 'Liên kết hoá đơn khi PAID';
