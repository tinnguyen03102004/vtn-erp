/**
 * Migration script: Rename expectedRevenue → expectedValue
 * Matches the actual Supabase DB column name.
 */
const fs = require('fs');
const path = require('path');

const files = [
  'src/lib/types.ts',
  'src/lib/ai/tools.ts',
  'src/lib/actions/search.ts',
  'src/lib/actions/dashboard.ts',
  'src/lib/actions/crm.ts',
  'src/components/LeadDetail.tsx',
  'src/components/CRMKanban.tsx',
  'src/components/ChatPanel.tsx',
  'src/components/chat/chatConstants.ts',
  'src/app/api/ai/chat/route.ts',
  'src/app/(dashboard)/dashboard/page.tsx',
];

let totalChanges = 0;

for (const rel of files) {
  const abs = path.resolve(rel);
  if (!fs.existsSync(abs)) {
    console.log(`SKIP: ${rel} (not found)`);
    continue;
  }
  const original = fs.readFileSync(abs, 'utf8');
  const updated = original.replace(/expectedRevenue/g, 'expectedValue');
  const count = (original.match(/expectedRevenue/g) || []).length;
  if (count > 0) {
    fs.writeFileSync(abs, updated, 'utf8');
    console.log(`✅ ${rel}: ${count} replacements`);
    totalChanges += count;
  } else {
    console.log(`⏭️  ${rel}: no changes needed`);
  }
}

console.log(`\nTotal: ${totalChanges} replacements across ${files.length} files`);
