# Ateliê Bordado - Sistema de Gestão SaaS

Sistema completo multi-tenant para gestão de ateliê de bordado personalizado.

## Módulos

- **Dashboard** - KPIs, gráficos de receita, pedidos recentes
- **Clientes** - Cadastro com histórico, arquivos/logos, tags e preferências
- **Pedidos** - Kanban visual + listagem, status completo, itens de bordado
- **Artes** - Upload, versionamento, aprovação do cliente com feedback
- **Matrizes** - Arquivos .DST, .PES, .JEF vinculados a clientes
- **Produção** - Fila com etapas, máquinas, operadores, timers
- **Financeiro** - Receitas, despesas, pagamentos, resumo
- **Estoque** - Camisetas, linhas, materiais com alertas de mínimo
- **Agenda** - Calendário de prazos e entregas
- **Configurações** - Ateliê, usuários, máquinas

## Tech Stack

| Camada | Tecnologia |
|--------|-----------|
| Frontend | Next.js 14, TypeScript, Tailwind CSS, React Query |
| Backend | Node.js, Express, TypeScript |
| Banco | PostgreSQL + Prisma ORM |
| Auth | JWT, bcrypt |
| Upload | Multer |
| Charts | Recharts |

## Como rodar

### Com Docker (recomendado)

```bash
# Clone o projeto
git clone <repo>
cd atelier-bordado

# Suba todos os serviços
docker-compose up -d

# Acesse http://localhost:3000
```

### Desenvolvimento local

**1. Banco de dados**
```bash
# Suba o PostgreSQL
docker run -d --name atelier_pg -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=atelier_bordado -p 5432:5432 postgres:16-alpine
```

**2. Backend**
```bash
cd backend
cp .env.example .env
# Edite o .env conforme necessário

npm install
npx prisma generate
npx prisma migrate dev --name init
npx ts-node prisma/seed.ts   # Dados de exemplo

npm run dev   # Porta 3001
```

**3. Frontend**
```bash
cd frontend
npm install
npm run dev   # Porta 3000
```

## Credenciais de Demonstração

| Campo | Valor |
|-------|-------|
| URL | http://localhost:3000 |
| Slug | atelier-demo |
| Email | admin@atelier.com |
| Senha | admin123 |

## Arquitetura Multi-Tenant

O sistema usa **shared schema** com `tenantId` em todas as tabelas.
Cada ateliê tem seu próprio espaço isolado de dados.

### Hierarquia de Roles

```
OWNER → ADMIN → DESIGNER → OPERATOR → FINANCIAL
```

## Status dos Pedidos

```
NOVO → AGUARDANDO_ARTE → ARTE_EM_CRIACAO → AGUARDANDO_APROVACAO
     → ARTE_APROVADA → EM_PRODUCAO → FINALIZADO → ENTREGUE
```

## Estrutura do Projeto

```
atelier-bordado/
├── backend/
│   ├── src/
│   │   ├── controllers/   # Lógica de negócio
│   │   ├── middleware/    # Auth, upload, erros
│   │   ├── routes/        # Definição de rotas
│   │   └── config/        # DB, logger
│   ├── prisma/
│   │   ├── schema.prisma  # Schema completo
│   │   └── seed.ts        # Dados iniciais
│   └── uploads/           # Arquivos enviados
├── frontend/
│   └── src/
│       ├── app/           # Pages (App Router)
│       ├── components/    # UI reutilizável
│       ├── lib/           # API client, utils
│       └── store/         # Zustand (auth)
└── docker-compose.yml
```
