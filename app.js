const express = require('express');
const path = require('path');
const { processAllData } = require('./controllers/entitycontroller');

const app = express();
const PORT = 3000;

app.use(express.json());  // Middleware to parse JSON
// Serve static files from public directory
app.use('/static', express.static('public'));

// Route to serve the visualization page
app.get('/visualize', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'visualization.html'));
});

// API endpoint to get graph data for Cytoscape
app.get('/api/graph-data', async (req, res) => {
  try {
    const data = await processAllData();
    
    // Transform data into Cytoscape format
    const elements = {
      nodes: [],
      edges: []
    };

    // Add nodes
    data.forEach(item => {
      elements.nodes.push({
        data: {
          id: item.id,
          label: item.name || item.id
        }
      });

      // Add edges if there are relationships
      if (item.relationships) {
        item.relationships.forEach(rel => {
          elements.edges.push({
            data: {
              id: `${item.id}-${rel.targetId}`,
              source: item.id,
              target: rel.targetId,
              label: rel.type
            }
          });
        });
      }
    });

    res.json(elements);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Static file serving (for favicon.ico)
app.use(express.static(path.join(__dirname, 'public')));

// Root route
app.get('/', (req, res) => {
  res.send('Welcome to the API!');
});


app.get('/process', async (req, res) => {
  try {
    await processAllData();
    res.json({ message: "Data processed successfully using Ollama." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Favicon route (optional)
app.get('/favicon.ico', (req, res) => res.status(204));  // No content response


app.listen(PORT, () => {
  console.log(`Server running at http://127.0.0.1:${PORT}`);
});