import { Router } from 'express';
import db from '../db/database';

const router = Router();

router.get('/', (req, res) => {
  const { status } = req.query;
  const rows = status
    ? db.prepare('SELECT * FROM orders WHERE status = ? ORDER BY created_at DESC').all(status)
    : db.prepare('SELECT * FROM orders ORDER BY created_at DESC').all();
  res.json(rows);
});

router.get('/:id', (req, res) => {
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
  if (!order) return res.status(404).json({ error: 'Non trouvé' });
  const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(req.params.id);
  res.json({ ...order, items });
});

router.post('/', (req, res) => {
  const { customer_name, customer_phone, items, payment_method, notes, delivery_date } = req.body;
  const total = (items as any[]).reduce((s: number, i: any) => s + i.total_price, 0);

  const order = db.transaction(() => {
    const r = db.prepare(
      'INSERT INTO orders (customer_name, customer_phone, total_amount, payment_method, notes, delivery_date) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(customer_name, customer_phone ?? '', total, payment_method ?? 'cash', notes ?? '', delivery_date ?? null);

    const orderId = r.lastInsertRowid;
    const insItem = db.prepare(
      'INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price, total_price, customization) VALUES (?, ?, ?, ?, ?, ?, ?)'
    );
    for (const item of items as any[]) {
      insItem.run(orderId, item.product_id ?? null, item.product_name, item.quantity, item.unit_price, item.total_price, item.customization ?? '');
    }
    return db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
  })();

  res.status(201).json(order);
});

router.put('/:id', (req, res) => {
  const { customer_name, customer_phone, payment_method, notes, delivery_date, paid_amount } = req.body;
  db.prepare(
    'UPDATE orders SET customer_name=?, customer_phone=?, payment_method=?, notes=?, delivery_date=?, paid_amount=?, updated_at=CURRENT_TIMESTAMP WHERE id=?'
  ).run(customer_name, customer_phone, payment_method, notes, delivery_date, paid_amount ?? 0, req.params.id);
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
  const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(req.params.id);
  res.json({ ...order, items });
});

router.patch('/:id/status', (req, res) => {
  const { status } = req.body;
  db.prepare('UPDATE orders SET status=?, updated_at=CURRENT_TIMESTAMP WHERE id=?').run(status, req.params.id);

  if (status === 'delivered') {
    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id) as any;
    const existing = db.prepare('SELECT id FROM transactions WHERE order_id = ?').get(req.params.id);
    if (!existing) {
      const today = new Date().toISOString().split('T')[0];
      db.prepare(
        "INSERT INTO transactions (type, category, amount, description, date, order_id, payment_method) VALUES ('income', 'Ventes', ?, ?, ?, ?, ?)"
      ).run(order.total_amount, `Commande #${req.params.id} – ${order.customer_name}`, today, req.params.id, order.payment_method);
    }
  }

  res.json(db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id));
});

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM orders WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

export default router;
