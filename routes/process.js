const express = require('express');
const { processAllData } = require('../controllers/entitycontroller');
const router = express.Router();

router.get('/process', async (req, res) => {
  try {
    await processAllData();
    res.json({ message: "Data processed successfully using Ollama." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;