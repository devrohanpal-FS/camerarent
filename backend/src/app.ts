import express from 'express';
import cors from 'cors';
import path from 'path';
import authRoutes from './controllers/auth.controller';
import productRoutes from './controllers/product.controller';
import cartRoutes from './controllers/cart.controller';
import orderRoutes from './controllers/order.controller';
import contactRoutes from './controllers/contact.controller';
import cmsRoutes from './controllers/cms.controller';
import notificationRoutes from './controllers/notification.controller';
import crewRoutes from './controllers/crew.controller';

const app = express();

if (process.env.TRUST_PROXY) {
  const trustProxyVal = process.env.TRUST_PROXY.toLowerCase();
  if (trustProxyVal === 'true' || trustProxyVal === '1') {
    app.set('trust proxy', 1);
  } else {
    app.set('trust proxy', process.env.TRUST_PROXY);
  }
}

app.use(cors());
app.use(express.json({ limit: '25mb' }));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/crew', crewRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/contacts', contactRoutes);
app.use('/api/cms', cmsRoutes);
app.use('/api/notifications', notificationRoutes);

app.get('/', (req, res) => {
  res.json({
    status: 'online',
    service: 'CameraRent API Gateway',
    timestamp: new Date(),
  });
});

app.get('/api', (req, res) => {
  res.json({
    status: 'online',
    service: 'CameraRent API Gateway - Subendpoints Active',
    timestamp: new Date(),
  });
});

app.use((req, res, next) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Express Error Handler caught:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message || 'An unexpected error occurred.',
  });
});

export default app;
