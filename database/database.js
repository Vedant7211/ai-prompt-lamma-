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

  db.run(`CREATE TABLE IF NOT EXISTS anomalies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    entity_id INTEGER,
    anomaly_type TEXT NOT NULL,
    description TEXT,
    detected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (entity_id) REFERENCES entities(id)
  )`);
});

// Function to store data in the database
async function storeDataInDatabase(extractedData) {
  try {
    // Store entities asynchronously
    for (const entity of extractedData.entities) {
      await new Promise((resolve, reject) => {
        db.run(
          `INSERT INTO entities (type, value) VALUES (?, ?)`,
          [entity.type, entity.value],
          function (err) {
            if (err) {
              console.error('Error inserting entity:', err.message);
              reject(err); // Reject promise on error
            } else {
              console.log(`Inserted entity with ID: ${this.lastID}`);
              resolve(); // Resolve promise on success
            }
          }
        );
      });
    }

    // Store relationships asynchronously
    for (const relationship of extractedData.relationships) {
      await new Promise((resolve, reject) => {
        db.run(
          `INSERT INTO relationships (from_entity, to_entity, relationship_type) VALUES (?, ?, ?)`,
          [relationship.source, relationship.target, relationship.type],
          function (err) {
            if (err) {
              console.error('Error inserting relationship:', err.message);
              reject(err); // Reject promise on error
            } else {
              console.log(`Inserted relationship with ID: ${this.lastID}`);
              resolve(); // Resolve promise on success
            }
          }
        );
      });
    }

    console.log('Data stored successfully in the database.');
  } catch (error) {
    console.error('Error storing data in the database:', error.message);
  }
}

module.exports = { db, storeDataInDatabase };
