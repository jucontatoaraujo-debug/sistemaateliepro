#!/bin/bash
# =============================================
# Script de instalação - Ateliê Bordado Pro
# Compatível com Hostinger VPS (Ubuntu 20/22)
# =============================================

echo ""
echo "============================================"
echo "   Instalando Sistema Ateliê Bordado Pro"
echo "============================================"
echo ""

# Atualizar sistema
echo "→ Atualizando sistema..."
apt-get update -y && apt-get upgrade -y

# Instalar Node.js 20
echo "→ Instalando Node.js..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs

# Instalar PostgreSQL
echo "→ Instalando PostgreSQL..."
apt-get install -y postgresql postgresql-contrib

# Iniciar PostgreSQL
systemctl start postgresql
systemctl enable postgresql

# Criar banco de dados
echo "→ Configurando banco de dados..."
sudo -u postgres psql -c "CREATE USER atelie WITH PASSWORD 'atelie123';"
sudo -u postgres psql -c "CREATE DATABASE atelier_bordado OWNER atelie;"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE atelier_bordado TO atelie;"

# Instalar PM2 (gerenciador de processos)
echo "→ Instalando PM2..."
npm install -g pm2

# Instalar Nginx
echo "→ Instalando Nginx..."
apt-get install -y nginx

# Configurar backend
echo "→ Configurando backend..."
cd /var/www/atelie/backend

# Criar .env do backend
cat > .env << 'EOF'
DATABASE_URL="postgresql://atelie:atelie123@localhost:5432/atelier_bordado"
JWT_SECRET="atelier_bordado_jwt_secret_MUDE_ISSO_EM_PRODUCAO_2024"
JWT_EXPIRES_IN="7d"
PORT=3001
NODE_ENV=production
FRONTEND_URL="http://localhost:3000"
MAX_FILE_SIZE=10485760
EOF

npm install
npx prisma generate
npx prisma migrate deploy
npx ts-node prisma/seed.ts

npm run build

# Configurar frontend
echo "→ Configurando frontend..."
cd /var/www/atelie/frontend

cat > .env.local << 'EOF'
NEXT_PUBLIC_API_URL=http://SEU_IP_AQUI:3001
EOF

npm install
npm run build

# Iniciar com PM2
echo "→ Iniciando serviços..."
cd /var/www/atelie

pm2 start backend/dist/index.js --name "atelie-backend"
pm2 start "cd frontend && npm start" --name "atelie-frontend"
pm2 save
pm2 startup

# Configurar Nginx
echo "→ Configurando Nginx..."
cat > /etc/nginx/sites-available/atelie << 'NGINX'
server {
    listen 80;
    server_name _;

    # Frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Uploads
    location /uploads {
        proxy_pass http://localhost:3001;
    }
}
NGINX

ln -sf /etc/nginx/sites-available/atelie /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl restart nginx
systemctl enable nginx

echo ""
echo "============================================"
echo "   INSTALAÇÃO CONCLUÍDA!"
echo ""
echo "   Acesse: http://SEU_IP_DO_VPS"
echo "   Email:  admin@atelier.com"
echo "   Senha:  admin123"
echo "============================================"
echo ""
