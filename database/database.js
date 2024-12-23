const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('entities.db', (err) => {
  if (err) console.error(err.message);
  console.log('Connected to the database.');
});

db.serialize(() => {
  // Table for entities
  db.run(`CREATE TABLE IF NOT EXISTS entities (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL,
      value TEXT NOT NULL
  )`);

  // Table for relationships
  db.run(`CREATE TABLE IF NOT EXISTS relationships (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      from_entity TEXT NOT NULL,
      to_entity TEXT NOT NULL,
      relationship_type TEXT NOT NULL
  )`);
});

module.exports = db;
