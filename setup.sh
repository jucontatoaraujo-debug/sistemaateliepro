#!/bin/bash
# Script de setup do sistema Ateliê Bordado

echo "============================================"
echo "  Setup - Sistema Gestão Ateliê Bordado"
echo "============================================"
echo ""

# Verificar Node.js
if ! command -v node &> /dev/null; then
    echo "ERRO: Node.js não encontrado. Instale em https://nodejs.org"
    exit 1
fi

echo "✓ Node.js $(node -v)"

# Backend
echo ""
echo "→ Instalando dependências do backend..."
cd backend
npm install
echo "✓ Backend instalado"

# Frontend
echo ""
echo "→ Instalando dependências do frontend..."
cd ../frontend
npm install
echo "✓ Frontend instalado"

cd ..

echo ""
echo "============================================"
echo "  Setup concluído!"
echo ""
echo "  Próximos passos:"
echo ""
echo "  1. Inicie o PostgreSQL:"
echo "     docker run -d --name atelier_pg \\"
echo "       -e POSTGRES_PASSWORD=postgres \\"
echo "       -e POSTGRES_DB=atelier_bordado \\"
echo "       -p 5432:5432 postgres:16-alpine"
echo ""
echo "  2. Configure o banco:"
echo "     cd backend"
echo "     npx prisma migrate dev --name init"
echo "     npx ts-node prisma/seed.ts"
echo ""
echo "  3. Inicie o backend (terminal 1):"
echo "     cd backend && npm run dev"
echo ""
echo "  4. Inicie o frontend (terminal 2):"
echo "     cd frontend && npm run dev"
echo ""
echo "  5. Acesse: http://localhost:3000"
echo "     Email: admin@atelier.com"
echo "     Senha: admin123"
echo "============================================"
