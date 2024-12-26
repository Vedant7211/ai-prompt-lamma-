const fs = require('fs');
const { db } = require('../database/database'); // Removed storeDataInDatabase to avoid conflict
const { Ollama } = require('ollama');
const cytoscape = require('cytoscape');

// Function to send text to Ollama for entity and relationship extraction
async function extractDataFromOllama(text) {
  try {
    const ollama = new Ollama();

    const prompt = `
      Analyze the following text and extract information in a structured format. Return a JSON object with exactly this structure:

      {
        "entities": [
          {
            "type": "PERSON|ORGANIZATION|LOCATION|DATE|VEHICLE|PHONE|EMAIL",
            "value": "extracted value",
            "details": "additional context"
          }
        ],
        "relationships": [
          {
            "source": "entity1",
            "target": "entity2", 
            "type": "COMMUNICATES|ASSOCIATES|OWNS|BELONGS_TO",
            "details": "relationship context"
          }
        ],
        "anomalies": [
          {
            "type": "FREQUENCY|PATTERN|BEHAVIOR",
            "description": "detailed anomaly description",
            "severity": "HIGH|MEDIUM|LOW",
            "entities": ["involved entity names"]
          }
        ]
      }

      Rules:
      1. Each entity must have a specific type from the allowed values
      2. Each relationship must connect two existing entities
      3. Anomalies must reference actual entities
      4. All dates should be in ISO format
      5. Phone numbers should be standardized with country code
      6. Vehicle details must include plate number if available

      Text to analyze: "${text}"

      Provide only the JSON output with no additional text or explanation.`;

    const response = await ollama.generate({
      model: 'llama2',
      prompt: prompt,
    });

    console.log(`Received response from Ollama`);
    return JSON.parse(response.response); // Ensure JSON parsing
  } catch (err) {
    console.error('Error communicating with Ollama:', err.message);
    throw err;
  }
}

// Function to store extracted data into the database (local version)
async function localStoreData(extractedData) {
  try {
    // Store entities
    extractedData.entities.forEach((entity) => {
      db.run(
        `INSERT INTO entities (type, value) VALUES (?, ?)`,
        [entity.type, entity.value],
        (err) => {
          if (err) console.error('Error inserting entity:', err.message);
        }
      );
    });

    // Store relationships
    extractedData.relationships.forEach((rel) => {
      db.run(
        `INSERT INTO relationships (from_entity, to_entity, relationship_type) VALUES (?, ?, ?)`,
        [rel.source, rel.target, rel.type],
        (err) => {
          if (err) console.error('Error inserting relationship:', err.message);
        }
      );
    });

    console.log('Data successfully stored in the database.');
  } catch (error) {
    console.error('Error storing data:', error.message);
  }
}

// Process JSON files and extract entities/relationships using Ollama
async function processAllData() {
  const callData = JSON.parse(fs.readFileSync('./data/call_records.json'));
  const emailData = JSON.parse(fs.readFileSync('./data/emails.json'));
  const phoneData = JSON.parse(fs.readFileSync('./data/phone.json'));
  const vehicleData = JSON.parse(fs.readFileSync('./data/vehicle.json'));

    // Combine all text data
    let combinedText = '';

  callData.forEach((call) => {
    combinedText += `Caller: ${call.caller}, Receiver: ${call.receiver}, Date_Time: ${call.date_time}, Duration: ${call.duration}, Note: ${call.notes}\n`;
  });

  emailData.forEach((email) => {
    combinedText += `Email: ${email.email}, Type: ${email.type}, Note: ${email.note}\n`;
  });

  phoneData.forEach((phone) => {
    combinedText += `Phone Number: ${phone.number}, Type: ${phone.type}\n`;
  });

  vehicleData.forEach((vehicle) => {
    combinedText += `Vehicle: ${vehicle.license_plate}, Make: ${vehicle.make}, Model: ${vehicle.model}, Color: ${vehicle.color}, Status: ${vehicle.status}\n`;
  });

  // Send combined text to Ollama for extraction
  const extractedData = await extractDataFromOllama(combinedText);

  console.log('Extracted Data:', extractedData);

  // Store extracted data in the database
  await localStoreData(extractedData);

  // Format the extracted data into Cytoscape elements
  const elements = [];

  // Add entities as nodes
  extractedData.entities.forEach((entity) => {
    elements.push({
      data: {
        id: entity.value,
        label: entity.value,
        type: entity.type,
      },
    });
  });

  // Add relationships as edges
  extractedData.relationships.forEach((rel) => {
    elements.push({
      data: {
        id: `${rel.source}-${rel.target}`,
        source: rel.source,
        target: rel.target,
        label: rel.type,
      },
    });
  });

  // Create Cytoscape instance
  const cy = cytoscape({
    container: document.getElementById('cy'), // Assuming you have an HTML element with id 'cy'
    elements: elements,
    style: [
      {
        selector: 'node',
        style: {
          'background-color': '#0074D9',
          'label': 'data(label)',
        },
      },
      {
        selector: 'edge',
        style: {
          'width': 2,
          'line-color': '#FF4136',
          'target-arrow-color': '#FF4136',
          'target-arrow-shape': 'triangle',
          'label': 'data(label)',
        },
      },
    ],
    layout: {
      name: 'cose', // You can adjust the layout here
    },
  });

  console.log('Data processed and visualized successfully using Ollama and Cytoscape.');

  return cy; // Return the Cytoscape instance for further use
} 

async function getGraphData() {
  return new Promise((resolve, reject) => {
    const elements = { nodes: [], edges: [] };

    // Fetch entities from the database
    db.all(`SELECT * FROM entities`, [], (err, entities) => {
      if (err) {
        console.error('Error fetching entities:', err.message);
        return reject(err); // Reject promise if there's an error
      }

      // Add entities as nodes
      entities.forEach((entity) => {
        elements.nodes.push({
          data: {
            id: `entity-${entity.id}`,
            label: entity.value,
            type: entity.type,
          },
        });
      });

      // Fetch relationships from the database
      db.all(`SELECT * FROM relationships`, [], (err, relationships) => {
        if (err) {
          console.error('Error fetching relationships:', err.message);
          return reject(err); // Reject promise if there's an error
        }

        // Add relationships as edges
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

        console.log('Graph data successfully fetched:', elements);
        resolve(elements); // Resolve promise with the graph data
      });
    });
  });
}




module.exports = {
  processAllData,
  getGraphData, 
  getCytoscapeInstance: () => processAllData.cy
};
