import { Router } from 'express';
import db from '../db/database';

const router = Router();

router.get('/summary', (req, res) => {
  const month = (req.query.month as string) || new Date().toISOString().substring(0, 7);
  const filter = `${month}%`;

  const total_income = (db.prepare("SELECT COALESCE(SUM(amount),0) as v FROM transactions WHERE type='income' AND date LIKE ?").get(filter) as any).v;
  const total_expense = (db.prepare("SELECT COALESCE(SUM(amount),0) as v FROM transactions WHERE type='expense' AND date LIKE ?").get(filter) as any).v;

  const income_by_category = db.prepare("SELECT category, SUM(amount) as total FROM transactions WHERE type='income' AND date LIKE ? GROUP BY category ORDER BY total DESC").all(filter);
  const expense_by_category = db.prepare("SELECT category, SUM(amount) as total FROM transactions WHERE type='expense' AND date LIKE ? GROUP BY category ORDER BY total DESC").all(filter);
  const daily_balances = db.prepare(
    "SELECT date, SUM(CASE WHEN type='income' THEN amount ELSE 0 END) as income, SUM(CASE WHEN type='expense' THEN amount ELSE 0 END) as expense FROM transactions WHERE date LIKE ? GROUP BY date ORDER BY date ASC"
  ).all(filter);

  res.json({ total_income, total_expense, net_balance: total_income - total_expense, income_by_category, expense_by_category, daily_balances });
});

router.get('/', (req, res) => {
  const { month } = req.query;
  const rows = month
    ? db.prepare('SELECT * FROM transactions WHERE date LIKE ? ORDER BY date DESC, created_at DESC').all(`${month}%`)
    : db.prepare('SELECT * FROM transactions ORDER BY date DESC, created_at DESC LIMIT 200').all();
  res.json(rows);
});

router.post('/', (req, res) => {
  const { type, category, amount, description, date, payment_method } = req.body;
  const result = db.prepare(
    'INSERT INTO transactions (type, category, amount, description, date, payment_method) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(type, category, amount, description ?? '', date, payment_method ?? 'cash');
  res.status(201).json(db.prepare('SELECT * FROM transactions WHERE id = ?').get(result.lastInsertRowid));
});

router.put('/:id', (req, res) => {
  const { type, category, amount, description, date, payment_method } = req.body;
  db.prepare('UPDATE transactions SET type=?, category=?, amount=?, description=?, date=?, payment_method=? WHERE id=?').run(
    type, category, amount, description, date, payment_method, req.params.id
  );
  res.json(db.prepare('SELECT * FROM transactions WHERE id = ?').get(req.params.id));
});

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM transactions WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

export default router;
