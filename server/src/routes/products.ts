import { Router } from 'express';
import db from '../db/database';

const router = Router();

router.get('/', (_req, res) => {
  res.json(db.prepare('SELECT * FROM products ORDER BY category, name').all());
});

router.post('/', (req, res) => {
  const { name, category, price, description } = req.body;
  const result = db.prepare('INSERT INTO products (name, category, price, description) VALUES (?, ?, ?, ?)').run(
    name, category, price, description ?? ''
  );
  res.status(201).json(db.prepare('SELECT * FROM products WHERE id = ?').get(result.lastInsertRowid));
});

router.put('/:id', (req, res) => {
  const { name, category, price, description, active } = req.body;
  db.prepare('UPDATE products SET name=?, category=?, price=?, description=?, active=? WHERE id=?').run(
    name, category, price, description, active ?? 1, req.params.id
  );
  res.json(db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id));
});

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM products WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

export default router;
