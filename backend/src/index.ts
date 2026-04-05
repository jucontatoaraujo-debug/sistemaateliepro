import 'express-async-errors';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import path from 'path';
import dotenv from 'dotenv';
import { errorHandler } from './middleware/errorHandler';
import { logger } from './config/logger';

// Rotas
import authRoutes from './routes/auth';
import tenantRoutes from './routes/tenants';
import clientRoutes from './routes/clients';
import orderRoutes from './routes/orders';
import artRoutes from './routes/arts';
import matrixRoutes from './routes/matrices';
import productionRoutes from './routes/production';
import financialRoutes from './routes/financial';
import productRoutes from './routes/products';
import dashboardRoutes from './routes/dashboard';
import machineRoutes from './routes/machines';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Security
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 300,
  message: { error: 'Muitas requisições, tente novamente mais tarde.' },
});
app.use('/api/', limiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Static files (uploads)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Health check
app.get('/health', (_, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/tenants', tenantRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/arts', artRoutes);
app.use('/api/matrices', matrixRoutes);
app.use('/api/production', productionRoutes);
app.use('/api/financial', financialRoutes);
app.use('/api/products', productRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/machines', machineRoutes);

// Error handler
app.use(errorHandler);

app.listen(PORT, () => {
  logger.info(`Servidor rodando na porta ${PORT}`);
});

export default app;
