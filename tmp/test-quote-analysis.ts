// RRI-T Unit Tests for quote-analysis.ts
import { estimateFromDescription, analyzeQuotation, formatVND } from '../src/lib/ai/quote-analysis'

const tests: [string, () => boolean][] = [
    // D5: Data Integrity — Area Detection
    ['T01 area=500 from "biệt thự 500m2"', () => estimateFromDescription('biệt thự 500m2').items[0].area === 500],
    ['T02 full_package detection', () => estimateFromDescription('trọn gói 300m2').items[0].name.includes('Trọn gói')],
    ['T03 multi-service (kiến trúc + nội thất)', () => estimateFromDescription('kiến trúc nội thất 200m2').items.length === 2],
    ['T04 default 200m² when no area', () => { const r = estimateFromDescription('thiết kế nhà'); return r.items[0].area === 200 && r.confidence === 0.6 }],
    ['T05 tax = 10% of subtotal', () => { const r = estimateFromDescription('kiến trúc 100m2'); return r.tax === r.subtotal * 0.1 }],
    ['T06 concept → basic pricing', () => estimateFromDescription('sơ bộ 150m2').items[0].name.includes('sơ bộ')],
    ['T07 landscape detection', () => estimateFromDescription('cảnh quan 100m2').items[0].name.includes('cảnh quan')],
    ['T08 supervision detection', () => estimateFromDescription('giám sát 100m2').items[0].name.includes('Giám sát')],
    ['T09 comma area "1,5m2"', () => estimateFromDescription('nhà 1,5m2').items[0].area === 1.5],
    ['T10 empty → default service', () => estimateFromDescription('').items.length > 0],

    // D5: formatVND
    ['T11 formatVND triệu', () => formatVND(5_000_000) === '5 tr ₫'],
    ['T12 formatVND tỷ', () => formatVND(1_500_000_000) === '1.5 tỷ ₫'],
    ['T13 formatVND small', () => formatVND(500_000).includes('₫')],

    // D5: analyzeQuotation
    ['T14 high price → warning', () => analyzeQuotation({ items: [], total: 200_000_000, area: 100 }).assessment.includes('⚠️')],
    ['T15 low price → warning', () => analyzeQuotation({ items: [], total: 10_000_000, area: 100 }).assessment.includes('⚠️')],
    ['T16 fair price → ok', () => analyzeQuotation({ items: [], total: 100_000_000, area: 200 }).assessment.includes('✅')],
    ['T17 negative variance', () => analyzeQuotation({ items: [], total: 10_000_000, area: 100 }).variance < 0],
    ['T18 recommendations non-empty for outlier', () => analyzeQuotation({ items: [], total: 200_000_000, area: 100 }).recommendations.length > 0],

    // D7: Edge Cases
    ['T19 zero area string', () => { const r = estimateFromDescription('0m2'); return r.items[0].area === 0 && r.total === 0 }],
    ['T20 huge area "999999m2"', () => { const r = estimateFromDescription('999999m2'); return r.total > 0 }],

    // D2: Tool integration structure
    ['T21 estimate output has confidence', () => 'confidence' in estimateFromDescription('test')],
    ['T22 analyze output has variancePercent', () => 'variancePercent' in analyzeQuotation({ items: [], total: 100_000_000 })],
]

console.log('=== RRI-T: Quote Analysis Unit Tests ===\n')
let pass = 0, fail = 0
for (const [name, fn] of tests) {
    try {
        const ok = fn()
        console.log(ok ? `✅ ${name}` : `❌ ${name}`)
        ok ? pass++ : fail++
    } catch (e: any) {
        console.log(`❌ ${name} — ERROR: ${e.message}`)
        fail++
    }
}
console.log(`\n=== Result: ${pass}/${tests.length} PASS, ${fail} FAIL ===`)
process.exit(fail > 0 ? 1 : 0)
