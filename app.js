const express = require('express');
const path = require('path');
const cors = require('cors');
const { processAllData, getGraphData } = require('./controllers/entitycontroller');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors()); // Allow cross-origin requests
app.use(express.json()); // Parse JSON requests
app.use(express.static('public')); // Serve static files directly from the public folder

// Routes

// Route to serve the visualization HTML
app.get('/visualize', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'visualization.html'));
});

// Route to fetch graph data
    app.get('/graph-data', async (req, res) => {
      try {
        const graphData = await getGraphData();
      console.log('Graph data retrieved:', graphData); // Debug log
      res.json(graphData);
    } catch (err) {
      console.error('Error fetching graph data:', err.message);
      res.status(500).json({ error: `Failed to fetch graph data: ${err.message}` });
    }
  });

  

// Route to process data
app.get('/process', async (req, res) => {
  try {
    await processAllData();
    res.json({ message: 'Data processed successfully using Ollama.' });
  } catch (err) {
    console.error('Error processing data:', err.message);
    res.status(500).json({ error: `Failed to process data: ${err.message}` });
  }
});

// Optional favicon route to suppress 404 errors
app.get('/favicon.ico', (req, res) => res.status(204)); // No content response

// Root route
app.get('/', (req, res) => {
  res.send('Welcome to the API!');
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running at http://127.0.0.1:${PORT}`);
});
