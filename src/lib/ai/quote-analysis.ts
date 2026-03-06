// ── VTN Architects Standard Pricing & Quote Analysis ──

export const STANDARD_PRICING: Record<string, { name: string; pricePerM2: number }> = {
    architecture_basic: { name: 'Thiết kế kiến trúc sơ bộ', pricePerM2: 300_000 },
    architecture_detail: { name: 'Thiết kế kỹ thuật thi công', pricePerM2: 500_000 },
    interior: { name: 'Thiết kế nội thất', pricePerM2: 400_000 },
    supervision: { name: 'Giám sát thi công', pricePerM2: 150_000 },
    landscape: { name: 'Thiết kế cảnh quan', pricePerM2: 200_000 },
    full_package: { name: 'Trọn gói (KT + NT + GS)', pricePerM2: 850_000 },
}

export interface QuoteEstimate {
    items: { name: string; area: number; pricePerM2: number; total: number }[]
    subtotal: number
    tax: number
    total: number
    confidence: number
}

/**
 * Estimate a quote based on project description.
 * Extracts area (m²), service type, and calculates pricing.
 */
export function estimateFromDescription(description: string): QuoteEstimate {
    // Extract area
    const areaMatch = description.match(/(\d+[\.,]?\d*)\s*m2/i)
    const area = areaMatch ? parseFloat(areaMatch[1].replace(',', '.')) : 200 // default 200m²

    // Detect services
    const services: string[] = []
    if (/trọn gói|full|tất cả/i.test(description)) {
        services.push('full_package')
    } else {
        if (/kiến trúc|architecture/i.test(description)) services.push('architecture_detail')
        if (/nội thất|interior/i.test(description)) services.push('interior')
        if (/giám sát|supervision/i.test(description)) services.push('supervision')
        if (/cảnh quan|landscape/i.test(description)) services.push('landscape')
        if (/sơ bộ|concept/i.test(description)) {
            // Replace detailed with basic
            const idx = services.indexOf('architecture_detail')
            if (idx >= 0) services[idx] = 'architecture_basic'
            else services.push('architecture_basic')
        }
    }

    // Default to architecture if nothing detected
    if (services.length === 0) services.push('architecture_detail')

    const items = services.map(svc => {
        const pricing = STANDARD_PRICING[svc]
        return {
            name: pricing.name,
            area,
            pricePerM2: pricing.pricePerM2,
            total: area * pricing.pricePerM2,
        }
    })

    const subtotal = items.reduce((sum, item) => sum + item.total, 0)
    const tax = subtotal * 0.1
    const total = subtotal + tax

    return {
        items,
        subtotal,
        tax,
        total,
        confidence: areaMatch ? 0.85 : 0.6,
    }
}

/**
 * Analyze a quotation — compare with standard pricing.
 */
export function analyzeQuotation(quotationData: {
    items: { description: string; quantity: number; unit_price: number; amount: number }[]
    total: number
    area?: number
}): {
    totalValue: number
    estimatedMarket: number
    variance: number
    variancePercent: number
    assessment: string
    recommendations: string[]
} {
    const area = quotationData.area || 200
    const estimatedMarket = area * STANDARD_PRICING.architecture_detail.pricePerM2

    const totalValue = quotationData.total
    const variance = totalValue - estimatedMarket
    const variancePercent = Math.round((variance / estimatedMarket) * 100)

    let assessment = ''
    const recommendations: string[] = []

    if (variancePercent > 20) {
        assessment = '⚠️ Giá cao hơn đáng kể so với thị trường'
        recommendations.push('Xem xét giảm giá hoặc bổ sung dịch vụ để tăng giá trị')
        recommendations.push('So sánh với báo giá cạnh tranh gần đây')
    } else if (variancePercent > 0) {
        assessment = '✅ Giá hợp lý, cao hơn nhẹ so với thị trường'
        recommendations.push('Nhấn mạnh chất lượng và kinh nghiệm để justify giá')
    } else if (variancePercent > -15) {
        assessment = '✅ Giá cạnh tranh, trong khoảng hợp lý'
    } else {
        assessment = '⚠️ Giá thấp hơn nhiều so với thị trường'
        recommendations.push('Kiểm tra biên lợi nhuận')
        recommendations.push('Xem xét tăng giá hoặc điều chỉnh scope')
    }

    return {
        totalValue,
        estimatedMarket,
        variance,
        variancePercent,
        assessment,
        recommendations,
    }
}

/**
 * Format VND currency.
 */
export function formatVND(amount: number): string {
    if (amount >= 1_000_000_000) return `${(amount / 1_000_000_000).toFixed(1)} tỷ ₫`
    if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(0)} tr ₫`
    return new Intl.NumberFormat('vi-VN').format(amount) + ' ₫'
}
