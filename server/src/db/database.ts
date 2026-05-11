import { Database as WasmDB } from 'node-sqlite3-wasm';
import path from 'path';
import fs from 'fs';

type Row = Record<string, unknown>;
type RunResult = { changes: number; lastInsertRowid: number };

function wrapStmt(raw: any) {
  const toArr = (args: any[]): any[] => (args.length === 1 && Array.isArray(args[0]) ? args[0] : args);
  return {
    run: (...args: any[]): RunResult => raw.run(toArr(args)),
    get: (...args: any[]): Row | undefined => raw.get(toArr(args)),
    all: (...args: any[]): Row[] => raw.all(toArr(args)),
  };
}

const DB_PATH = path.join(__dirname, '../../../patisserie.db');
const LOCK_PATH = DB_PATH + '.lock';
if (fs.existsSync(LOCK_PATH)) {
  try { fs.rmSync(LOCK_PATH, { recursive: true, force: true }); } catch (_) {}
}

const _db = new WasmDB(DB_PATH);
_db.exec('PRAGMA foreign_keys = ON');

const db = {
  exec: (sql: string) => { _db.exec(sql); },
  prepare: (sql: string) => wrapStmt(_db.prepare(sql)),
};

export function withTransaction<T>(fn: () => T): T {
  db.exec('BEGIN');
  try {
    const result = fn();
    db.exec('COMMIT');
    return result;
  } catch (e) {
    db.exec('ROLLBACK');
    throw e;
  }
}

db.exec(`
  CREATE TABLE IF NOT EXISTS ingredients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'Général',
    quantity REAL NOT NULL DEFAULT 0,
    unit TEXT NOT NULL DEFAULT 'kg',
    min_quantity REAL NOT NULL DEFAULT 0,
    price_per_unit REAL NOT NULL DEFAULT 0,
    supplier TEXT DEFAULT '',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS stock_movements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ingredient_id INTEGER NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('in', 'out')),
    quantity REAL NOT NULL,
    reason TEXT DEFAULT '',
    date DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ingredient_id) REFERENCES ingredients(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    price REAL NOT NULL,
    description TEXT DEFAULT '',
    active INTEGER DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_name TEXT NOT NULL,
    customer_phone TEXT DEFAULT '',
    status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'in_progress', 'ready', 'delivered', 'cancelled')),
    total_amount REAL NOT NULL DEFAULT 0,
    paid_amount REAL DEFAULT 0,
    payment_method TEXT DEFAULT 'cash',
    notes TEXT DEFAULT '',
    delivery_date TEXT DEFAULT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    product_id INTEGER,
    product_name TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    unit_price REAL NOT NULL,
    total_price REAL NOT NULL,
    customization TEXT DEFAULT '',
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
  );

  CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL CHECK(type IN ('income', 'expense')),
    category TEXT NOT NULL,
    amount REAL NOT NULL,
    description TEXT DEFAULT '',
    date TEXT NOT NULL,
    order_id INTEGER DEFAULT NULL,
    payment_method TEXT DEFAULT 'cash',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL
  );
`);

const productCount = (db.prepare('SELECT COUNT(*) as c FROM products').get() as any).c;
if (productCount === 0) {
  const ins = db.prepare('INSERT INTO products (name, category, price, description) VALUES (?, ?, ?, ?)');
  withTransaction(() => {
    ins.run('Croissant nature', 'Viennoiseries', 500, 'Croissant beurre pur');
    ins.run('Pain au chocolat', 'Viennoiseries', 500, 'Pâte feuilletée au chocolat');
    ins.run('Brioche', 'Viennoiseries', 1000, 'Brioche moelleuse');
    ins.run('Chausson aux pommes', 'Viennoiseries', 500, 'Feuilleté garni de compote');
    ins.run('Cake citron', 'Cakes', 1000, 'Cake au citron entier');
    ins.run('Cake marbré', 'Cakes', 1500, 'Cake chocolat vanille');
    ins.run('Cake aux fruits', 'Cakes', 2000, 'Cake avec fruits confits');
    ins.run('Gâteau anniversaire 6 pers.', 'Gâteaux', 5000, 'Personnalisable sur commande');
    ins.run('Gâteau anniversaire 12 pers.', 'Gâteaux', 15000, 'Personnalisable sur commande');
    ins.run('Pièce montée mariage 50 pers.', 'Gâteaux', 12500, "Sur commande, 72h à l'avance");
    ins.run('Pièce montée mariage 100 pers.', 'Gâteaux', 25000, "Sur commande, 72h à l'avance");
    ins.run('Café express', 'Boissons', 500, 'Café arabica');
    ins.run('Café au lait', 'Boissons', 1000, 'Café avec lait chaud');
    ins.run('Thé à la menthe', 'Boissons', 500, 'Thé frais');
    ins.run("Jus d'orange", 'Boissons', 1000, 'Pressé frais');
    ins.run('Jus pomme', 'Boissons', 1000, 'Naturel 100%');
  });
}

const ingCount = (db.prepare('SELECT COUNT(*) as c FROM ingredients').get() as any).c;
if (ingCount === 0) {
  const ins = db.prepare('INSERT INTO ingredients (name, category, quantity, unit, min_quantity, price_per_unit, supplier) VALUES (?, ?, ?, ?, ?, ?, ?)');
  withTransaction(() => {
    ins.run('Farine de blé', 'Farines', 25, 'kg', 5, 1.20, 'Moulin Local');
    ins.run('Sucre blanc', 'Sucres', 15, 'kg', 3, 1.00, 'Fournisseur Général');
    ins.run('Beurre', 'Matières grasses', 8, 'kg', 2, 8.50, 'Laiterie Locale');
    ins.run('Œufs', 'Produits laitiers', 120, 'unité', 30, 0.25, 'Ferme Bio');
    ins.run('Levure chimique', 'Levures', 2, 'kg', 0.5, 5.00, 'Fournisseur Général');
    ins.run('Chocolat noir', 'Chocolat', 5, 'kg', 1, 12.00, 'Choco Import');
    ins.run('Lait entier', 'Produits laitiers', 20, 'L', 5, 1.30, 'Laiterie Locale');
    ins.run('Crème fraîche', 'Produits laitiers', 5, 'L', 1, 3.50, 'Laiterie Locale');
    ins.run('Sel fin', 'Condiments', 3, 'kg', 0.5, 0.80, 'Fournisseur Général');
    ins.run('Vanille', 'Arômes', 0.5, 'kg', 0.1, 50.00, 'Épices du Monde');
    ins.run('Café moulu', 'Boissons', 3, 'kg', 1, 15.00, 'Coffee Import');
    ins.run('Thé vert', 'Boissons', 2, 'kg', 0.5, 20.00, 'Tea World');
    ins.run('Oranges', 'Fruits', 10, 'kg', 3, 2.50, 'Marché Local');
    ins.run('Pommes', 'Fruits', 8, 'kg', 2, 2.00, 'Marché Local');
    ins.run('Sucre glace', 'Sucres', 3, 'kg', 1, 1.50, 'Fournisseur Général');
  });
}

export default db;
