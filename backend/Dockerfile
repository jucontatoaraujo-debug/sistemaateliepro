FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

RUN npm install -g typescript ts-node
RUN npx prisma generate
RUN npm run build

RUN mkdir -p uploads/arts uploads/matrices uploads/clients logs

EXPOSE 3001

CMD ["sh", "-c", "npx prisma migrate deploy && npm start"]
