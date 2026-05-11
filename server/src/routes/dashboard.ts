import { Router } from 'express';
import db from '../db/database';

const router = Router();

router.get('/', (_req, res) => {
  const today = new Date().toISOString().split('T')[0];
  const month = today.substring(0, 7);

  const today_revenue = (db.prepare("SELECT COALESCE(SUM(amount),0) as v FROM transactions WHERE type='income' AND date=?").get(today) as any).v;
  const monthly_revenue = (db.prepare("SELECT COALESCE(SUM(amount),0) as v FROM transactions WHERE type='income' AND date LIKE ?").get(`${month}%`) as any).v;
  const monthly_expense = (db.prepare("SELECT COALESCE(SUM(amount),0) as v FROM transactions WHERE type='expense' AND date LIKE ?").get(`${month}%`) as any).v;
  const pending_orders = (db.prepare("SELECT COUNT(*) as v FROM orders WHERE status IN ('pending','in_progress')").get() as any).v;
  const low_stock_count = (db.prepare('SELECT COUNT(*) as v FROM ingredients WHERE quantity <= min_quantity').get() as any).v;

  const recent_orders = db.prepare('SELECT * FROM orders ORDER BY created_at DESC LIMIT 5').all();
  const low_stock_items = db.prepare('SELECT * FROM ingredients WHERE quantity <= min_quantity ORDER BY (quantity*1.0/CASE WHEN min_quantity>0 THEN min_quantity ELSE 1 END) ASC LIMIT 6').all();
  const daily_revenue = db.prepare(
    "SELECT date, SUM(CASE WHEN type='income' THEN amount ELSE 0 END) as income, SUM(CASE WHEN type='expense' THEN amount ELSE 0 END) as expense FROM transactions WHERE date >= date('now','-6 days') GROUP BY date ORDER BY date ASC"
  ).all();

  res.json({ today_revenue, monthly_revenue, monthly_expense, pending_orders, low_stock_count, recent_orders, low_stock_items, daily_revenue });
});

export default router;
