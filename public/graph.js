const cytoscape = require('cytoscape');
const sqlite3 = require('sqlite3').verbose();

// Function to fetch data and generate Cytoscape elements
async function generateCytoscapeElements() {
  const db = new sqlite3.Database('./entities.db');

  return new Promise((resolve, reject) => {
    const elements = { nodes: [], edges: [] };

    // Fetch entities
    db.all(`SELECT * FROM entities`, [], (err, entities) => {
      if (err) return reject(err);

      entities.forEach((entity) => {
        elements.nodes.push({
          data: { id: `entity-${entity.id}`, label: entity.value, type: entity.type },
        });
      });

      // Fetch relationships
      db.all(`SELECT * FROM relationships`, [], (err, relationships) => {
        if (err) return reject(err);

        relationships.forEach((rel) => {
          elements.edges.push({
            data: {
              id: `rel-${rel.id}`,
              source: `entity-${rel.from_entity}`,
              target: `entity-${rel.to_entity}`,
              label: rel.relationship_type,
            },
          });
        });

        resolve(elements);
      });
    });
  });
}

module.exports = { generateCytoscapeElements };
