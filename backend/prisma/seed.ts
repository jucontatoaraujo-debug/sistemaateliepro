import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando seed...');

  const hashedPassword = await bcrypt.hash('admin123', 12);

  const tenant = await prisma.tenant.upsert({
    where: { slug: 'atelier-demo' },
    update: {},
    create: {
      name: 'Ateliê Bordado Demo',
      slug: 'atelier-demo',
      plan: 'PRO',
      settings: { create: { currency: 'BRL', defaultDeadline: 7 } },
      users: {
        create: [
          { name: 'Admin', email: 'admin@atelier.com', password: hashedPassword, role: 'OWNER' },
          { name: 'Designer', email: 'designer@atelier.com', password: hashedPassword, role: 'DESIGNER' },
          { name: 'Operador', email: 'operador@atelier.com', password: hashedPassword, role: 'OPERATOR' },
        ],
      },
      machines: {
        create: [
          { name: 'Máquina 1 - Tajima', model: 'Tajima TMEG-C1501', heads: 15 },
          { name: 'Máquina 2 - Barudan', model: 'Barudan BEKS-S1501C', heads: 15 },
        ],
      },
    },
  });

  console.log(`Tenant criado: ${tenant.name} (slug: ${tenant.slug})`);

  // Criar alguns clientes de exemplo
  const clients = await Promise.all([
    prisma.client.upsert({
      where: { tenantId_email: { tenantId: tenant.id, email: 'joao@empresa.com' } },
      update: {},
      create: {
        tenantId: tenant.id,
        name: 'João Silva',
        email: 'joao@empresa.com',
        whatsapp: '11999990001',
        instagram: '@joaosilva',
        isCompany: false,
        preferences: { fonts: ['Arial', 'Times New Roman'], colors: ['#1a1a1a', '#c0a060'], styles: ['clássico'] },
      },
    }),
    prisma.client.upsert({
      where: { tenantId_email: { tenantId: tenant.id, email: 'contato@empresa.com' } },
      update: {},
      create: {
        tenantId: tenant.id,
        name: 'Maria Santos',
        email: 'contato@empresa.com',
        whatsapp: '11999990002',
        isCompany: true,
        companyName: 'Empresa ABC Ltda',
        totalOrders: 5,
      },
    }),
  ]);

  console.log(`${clients.length} clientes criados`);
  console.log('\n=== DADOS DE ACESSO ===');
  console.log('URL: http://localhost:3000');
  console.log('Slug: atelier-demo');
  console.log('Email: admin@atelier.com');
  console.log('Senha: admin123');
  console.log('======================\n');
}

main().catch(console.error).finally(() => prisma.$disconnect());
