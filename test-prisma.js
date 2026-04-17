require('dotenv').config({ path: '.env.local' });
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');

const adapter = new PrismaPg({ connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

prisma.user.findFirst().then(console.log).catch(console.error).finally(()=>prisma.$disconnect());
