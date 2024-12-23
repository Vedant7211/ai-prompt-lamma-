const db = require('../database/database');

function detectDuplicateEntities(callback) {
  db.all(
    `SELECT value, COUNT(*) as count 
     FROM entities 
     GROUP BY value 
     HAVING COUNT(*) > 1`,
    (err, rows) => {
      if (err) {
        console.error(err.message);
        return callback(err, null);
      }
      callback(null, rows);
    }
  );
}


module.exports = { detectDuplicateEntities };
