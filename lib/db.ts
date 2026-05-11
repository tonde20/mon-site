import path from 'path';
import fs from 'fs';
import bcrypt from 'bcryptjs';

// node:sqlite est natif dans Node.js 22.5+ — aucune compilation nécessaire
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { DatabaseSync } = require('node:sqlite');

const DB_PATH = path.join(process.cwd(), 'data', 'cma.db');

let db: any = null;

export function getDb(): any {
  if (!db) {
    const dataDir = path.dirname(DB_PATH);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    db = new DatabaseSync(DB_PATH);
    db.exec('PRAGMA journal_mode = WAL');
    db.exec('PRAGMA foreign_keys = ON');
    initSchema(db);
    seedData(db);
  }
  return db;
}

function initSchema(db: any) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS admins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      nom TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS doctors (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nom TEXT NOT NULL,
      prenom TEXT NOT NULL,
      telephone TEXT NOT NULL,
      specialite TEXT DEFAULT 'Médecin généraliste',
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      actif INTEGER DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS patients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE NOT NULL,
      nom TEXT NOT NULL,
      prenom TEXT NOT NULL,
      date_naissance TEXT,
      sexe TEXT DEFAULT 'M',
      telephone TEXT,
      adresse TEXT,
      password TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS consultations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      patient_id INTEGER NOT NULL,
      doctor_id INTEGER NOT NULL,
      date TEXT DEFAULT CURRENT_TIMESTAMP,
      motif TEXT,
      diagnostic TEXT,
      notes TEXT,
      tension TEXT,
      temperature TEXT,
      poids TEXT,
      valide_jusqu TEXT,
      montant INTEGER DEFAULT 1250,
      FOREIGN KEY (patient_id) REFERENCES patients(id),
      FOREIGN KEY (doctor_id) REFERENCES doctors(id)
    );

    CREATE TABLE IF NOT EXISTS prescriptions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      consultation_id INTEGER NOT NULL,
      medicament TEXT NOT NULL,
      posologie TEXT,
      duree TEXT,
      FOREIGN KEY (consultation_id) REFERENCES consultations(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS examens (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      consultation_id INTEGER NOT NULL,
      type_examen TEXT NOT NULL,
      description TEXT,
      resultat TEXT,
      FOREIGN KEY (consultation_id) REFERENCES consultations(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS rendez_vous (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      patient_id INTEGER NOT NULL,
      doctor_id INTEGER NOT NULL,
      date_heure TEXT NOT NULL,
      motif TEXT,
      statut TEXT DEFAULT 'en_attente',
      notes TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (patient_id) REFERENCES patients(id),
      FOREIGN KEY (doctor_id) REFERENCES doctors(id)
    );

    CREATE TABLE IF NOT EXISTS certificats (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      patient_id INTEGER NOT NULL,
      doctor_id INTEGER NOT NULL,
      date TEXT DEFAULT CURRENT_TIMESTAMP,
      type TEXT NOT NULL DEFAULT 'Medical',
      contenu TEXT,
      montant INTEGER DEFAULT 2000,
      FOREIGN KEY (patient_id) REFERENCES patients(id),
      FOREIGN KEY (doctor_id) REFERENCES doctors(id)
    );

    CREATE TABLE IF NOT EXISTS paiements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      patient_id INTEGER,
      type TEXT NOT NULL,
      reference_id INTEGER,
      montant INTEGER NOT NULL,
      date TEXT DEFAULT CURRENT_TIMESTAMP,
      notes TEXT,
      FOREIGN KEY (patient_id) REFERENCES patients(id)
    );
  `);
}

function seedData(db: any) {
  const settingExists = db.prepare('SELECT value FROM settings WHERE key = ?').get('etablissement_nom');
  if (settingExists) return;

  db.prepare("INSERT OR IGNORE INTO settings (key, value) VALUES ('etablissement_nom', 'CMA de Boromo')").run();
  db.prepare("INSERT OR IGNORE INTO settings (key, value) VALUES ('consultation_frais', '1250')").run();
  db.prepare("INSERT OR IGNORE INTO settings (key, value) VALUES ('certificat_frais', '2000')").run();
  db.prepare("INSERT OR IGNORE INTO settings (key, value) VALUES ('consultation_validite_jours', '10')").run();

  const adminPwd = bcrypt.hashSync('admin123', 10);
  db.prepare("INSERT OR IGNORE INTO admins (username, password, nom) VALUES ('admin', ?, 'Administrateur')").run(adminPwd);

  const prenoms = ['Moussa', 'Fatimata', 'Ibrahim', 'Aminata', 'Boureima', 'Rasmata', 'Oumarou', 'Salimata', 'Adama', 'Mariam', 'Seydou', 'Halimatou'];
  const noms = ['OUEDRAOGO', 'SAWADOGO', 'COULIBALY', 'TRAORE', 'ZONGO', 'KABORE', 'SOME', 'DIALLO', 'SANKARA', 'BARRY', 'COMPAORÉ', 'GUIRA'];

  for (let i = 1; i <= 12; i++) {
    const username = `medecin${i}`;
    const pwd = bcrypt.hashSync(`medecin${i}123`, 10);
    const phoneNum = 74000000 + (i - 1);
    const phone = `0${phoneNum}`;
    db.prepare(
      "INSERT OR IGNORE INTO doctors (nom, prenom, telephone, specialite, username, password) VALUES (?, ?, ?, 'Médecin généraliste', ?, ?)"
    ).run(noms[i - 1], prenoms[i - 1], phone, username, pwd);
  }

  const patientPwd = bcrypt.hashSync('patient123', 10);
  db.prepare(
    "INSERT OR IGNORE INTO patients (code, nom, prenom, date_naissance, sexe, telephone, adresse, password) VALUES ('PAT-000001', 'KABORÉ', 'Alassane', '1985-03-15', 'M', '70123456', 'Boromo centre', ?)"
  ).run(patientPwd);
}

export function generatePatientCode(db: any): string {
  const last = db.prepare('SELECT code FROM patients ORDER BY id DESC LIMIT 1').get() as { code: string } | undefined;
  if (!last) return 'PAT-000001';
  const num = parseInt(last.code.split('-')[1]) + 1;
  return `PAT-${String(num).padStart(6, '0')}`;
}
