  const fs = require('fs');
  const db = require('../database/database');
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
      return response.response;
    } catch (err) {
      console.error("Error communicating with Ollama:", JSON.stringify(err));
      throw err;
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

    callData.forEach(call => {
      console.log('Here in caller reciever note');
      combinedText += `Caller: ${call.caller}, Receiver: ${call.receiver}, Date_Time: ${call.date_time}, Duration: ${call.duration}, Note: ${call.notes}\n`;
    });

    emailData.forEach(email => {
      console.log('Here in email and type');
      combinedText += `Email: ${email.email}, Type: ${email.type} , Note: ${email.note}\n`;
    });

    phoneData.forEach(phone => {
      combinedText += `Phone Number: ${phone.number}, Type: ${phone.type}\n`;
    });

    vehicleData.forEach(vehicle => {
      combinedText += `Vehicle: ${vehicle.license_plate},Make: ${vehicle.make}, Model: ${vehicle.model} ,Color: ${vehicle.color}, Status: ${vehicle.status}\n`;
    });

    // Send combined text to Ollama
    const extractedData = await extractDataFromOllama(combinedText);
    console.log("extarctData" , extractedData)

    // Create Cytoscape instance
    const cy = cytoscape({
      elements: []
    });

    // Add entities as nodes
    extractedData.entities.forEach(entity => {
      cy.add({
        group: 'nodes',
        data: {
          id: entity.value,
          label: entity.value,
          type: entity.type
        }
      });
      
      // Store in database
      db.run(`INSERT INTO entities (type, value) VALUES (?, ?)`, [entity.type, entity.value]);
    });

    // Add relationships as edges
    extractedData.relationships.forEach(rel => {
      cy.add({
        group: 'edges',
        data: {
          id: `${rel.from}-${rel.to}`,
          source: rel.from,
          target: rel.to,
          label: rel.type
        }
      });
      
      // Store in database
      db.run(`INSERT INTO relationships (from_entity, to_entity, relationship_type) VALUES (?, ?, ?)`,
        [rel.from, rel.to, rel.type]);
    });

    // Layout the graph
    const layout = cy.layout({
      name: 'cose'
    });
    layout.run();

    console.log("Data processed and visualized successfully using Ollama and Cytoscape.");
    
    return cy; // Return the cytoscape instance for further use
  }

  module.exports = { 
    processAllData,
    getCytoscapeInstance: () => cy // Export cytoscape instance getter
  };