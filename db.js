const Database = require('better-sqlite3');
const path = require('path');

// Initialize local SQLite database for high performance
const db = new Database(path.join(__dirname, 'interior_ai.db'));
db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    client_name TEXT NOT NULL,
    property_type TEXT DEFAULT '2BHK Apartment',
    budget_amount REAL DEFAULT 1000000,
    style_preference TEXT DEFAULT 'Modern Minimal',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS budget_breakdowns (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id TEXT,
    trade_name TEXT NOT NULL,
    amount REAL NOT NULL,
    percentage REAL NOT NULL,
    FOREIGN KEY(project_id) REFERENCES projects(id)
  );

  CREATE TABLE IF NOT EXISTS contractors (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    specialty TEXT NOT NULL,
    experience_years INTEGER,
    rating REAL,
    daily_rate TEXT,
    avatar_url TEXT
  );

  CREATE TABLE IF NOT EXISTS contact_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    message TEXT NOT NULL,
    status TEXT DEFAULT 'new',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS progress_updates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id TEXT,
    task_name TEXT NOT NULL,
    contractor_name TEXT NOT NULL,
    photo_url TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

const seedContractors = () => {
  const count = db.prepare('SELECT COUNT(*) as count FROM contractors').get().count;
  if (count === 0) {
    const insert = db.prepare('INSERT INTO contractors (id, name, specialty, experience_years, rating, daily_rate, avatar_url) VALUES (?, ?, ?, ?, ?, ?, ?)');
    insert.run('c1', 'Ar. Rajesh Verma', 'Principal Architect', 12, 4.9, '₹120 / sq.ft', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80');
    insert.run('c2', 'Vikram Singh', 'Master Carpenter Lead', 15, 4.8, '₹850 / day', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80');
    insert.run('c3', 'Suresh Kumar', 'Concealed Electrical Lead', 9, 4.9, '₹600 / day', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80');
  }
};
seedContractors();

const dbHelpers = {
  saveProject: (project) => {
    const stmt = db.prepare(`
      INSERT INTO projects (id, client_name, property_type, budget_amount, style_preference)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        property_type=excluded.property_type,
        budget_amount=excluded.budget_amount,
        style_preference=excluded.style_preference
    `);
    stmt.run(project.id, project.clientName, project.propertyType, project.budgetAmount, project.stylePreference);
  },

  getContractors: () => {
    return db.prepare('SELECT * FROM contractors').all();
  },

  saveProgressLog: (projectId, taskName, contractorName, photoUrl) => {
    const stmt = db.prepare('INSERT INTO progress_updates (project_id, task_name, contractor_name, photo_url) VALUES (?, ?, ?, ?)');
    return stmt.run(projectId, taskName, contractorName, photoUrl);
  },

  saveContactRequest: (contact) => {
    const stmt = db.prepare('INSERT INTO contact_requests (client_name, email, phone, message) VALUES (?, ?, ?, ?)');
    return stmt.run(contact.name, contact.email, contact.phone, contact.message);
  },

  getProgressLogs: (projectId) => {
    return db.prepare('SELECT * FROM progress_updates WHERE project_id = ? ORDER BY updated_at DESC').all(projectId);
  }
};

module.exports = dbHelpers;
