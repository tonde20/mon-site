import { Router } from 'express';
import db from '../db/database';

const router = Router();

router.get('/', (_req, res) => {
  res.json(db.prepare('SELECT * FROM ingredients ORDER BY category, name').all());
});

router.get('/low-stock', (_req, res) => {
  res.json(db.prepare('SELECT * FROM ingredients WHERE quantity <= min_quantity ORDER BY (quantity * 1.0 / CASE WHEN min_quantity > 0 THEN min_quantity ELSE 1 END) ASC').all());
});

router.get('/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM ingredients WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Non trouvé' });
  res.json(row);
});

router.post('/', (req, res) => {
  const { name, category, quantity, unit, min_quantity, price_per_unit, supplier } = req.body;
  const result = db.prepare(
    'INSERT INTO ingredients (name, category, quantity, unit, min_quantity, price_per_unit, supplier) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).run(name, category, quantity ?? 0, unit, min_quantity ?? 0, price_per_unit ?? 0, supplier ?? '');

  if ((quantity ?? 0) > 0) {
    db.prepare('INSERT INTO stock_movements (ingredient_id, type, quantity, reason) VALUES (?, ?, ?, ?)').run(
      result.lastInsertRowid, 'in', quantity, 'Stock initial'
    );
  }
  res.status(201).json(db.prepare('SELECT * FROM ingredients WHERE id = ?').get(result.lastInsertRowid));
});

router.put('/:id', (req, res) => {
  const { name, category, unit, min_quantity, price_per_unit, supplier } = req.body;
  db.prepare(
    'UPDATE ingredients SET name=?, category=?, unit=?, min_quantity=?, price_per_unit=?, supplier=?, updated_at=CURRENT_TIMESTAMP WHERE id=?'
  ).run(name, category, unit, min_quantity, price_per_unit, supplier, req.params.id);
  res.json(db.prepare('SELECT * FROM ingredients WHERE id = ?').get(req.params.id));
});

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM ingredients WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

router.post('/:id/movements', (req, res) => {
  const { type, quantity, reason } = req.body;
  const ing = db.prepare('SELECT * FROM ingredients WHERE id = ?').get(req.params.id) as any;
  if (!ing) return res.status(404).json({ error: 'Non trouvé' });

  db.transaction(() => {
    db.prepare('INSERT INTO stock_movements (ingredient_id, type, quantity, reason) VALUES (?, ?, ?, ?)').run(
      req.params.id, type, quantity, reason ?? ''
    );
    const newQty = type === 'in' ? ing.quantity + quantity : Math.max(0, ing.quantity - quantity);
    db.prepare('UPDATE ingredients SET quantity=?, updated_at=CURRENT_TIMESTAMP WHERE id=?').run(newQty, req.params.id);
  })();

  res.json(db.prepare('SELECT * FROM ingredients WHERE id = ?').get(req.params.id));
});

router.get('/:id/movements', (req, res) => {
  res.json(db.prepare(
    'SELECT sm.*, i.name as ingredient_name, i.unit FROM stock_movements sm JOIN ingredients i ON sm.ingredient_id = i.id WHERE sm.ingredient_id = ? ORDER BY sm.date DESC LIMIT 50'
  ).all(req.params.id));
});

export default router;
