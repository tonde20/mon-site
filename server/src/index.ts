import express from 'express';
import cors from 'cors';
import ingredientsRouter from './routes/ingredients';
import productsRouter from './routes/products';
import ordersRouter from './routes/orders';
import treasuryRouter from './routes/treasury';
import dashboardRouter from './routes/dashboard';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: ['http://localhost:5173', 'http://localhost:3000'] }));
app.use(express.json());

app.use('/api/ingredients', ingredientsRouter);
app.use('/api/products', productsRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/treasury', treasuryRouter);
app.use('/api/dashboard', dashboardRouter);

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

app.listen(PORT, () => {
  console.log(`🥐 Serveur Pâtisserie La Baraka → http://localhost:${PORT}`);
});
