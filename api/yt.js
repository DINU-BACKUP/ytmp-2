const express = require('express');
const { ytmp3, ytmp4, apimp3, apimp4, metadata, search, channel } = require('../your-module'); // Your existing module
const cors = require('cors');

// Create the Express app
const app = express();

// Enable CORS
app.use(cors());

// Middleware to parse JSON bodies
app.use(express.json());

// MP3 download endpoint
app.get('/ytmp3', async (req, res) => {
  const { link, formats } = req.query;
  if (!link) return res.status(400).json({ status: false, message: 'Missing link parameter!' });

  try {
    const result = await ytmp3(link, formats);
    return res.json(result);
  } catch (error) {
    return res.status(500).json({ status: false, message: 'Error during MP3 download' });
  }
});

// MP4 download endpoint
app.get('/ytmp4', async (req, res) => {
  const { link, formats } = req.query;
  if (!link) return res.status(400).json({ status: false, message: 'Missing link parameter!' });

  try {
    const result = await ytmp4(link, formats);
    return res.json(result);
  } catch (error) {
    return res.status(500).json({ status: false, message: 'Error during MP4 download' });
  }
});

// API to fetch MP3 with external API (apimp3)
app.get('/apimp3', async (req, res) => {
  const { link, formats } = req.query;
  if (!link) return res.status(400).json({ status: false, message: 'Missing link parameter!' });

  try {
    const result = await apimp3(link, formats);
    return res.json(result);
  } catch (error) {
    return res.status(500).json({ status: false, message: 'Error during external MP3 download' });
  }
});

// API to fetch MP4 with external API (apimp4)
app.get('/apimp4', async (req, res) => {
  const { link, formats } = req.query;
  if (!link) return res.status(400).json({ status: false, message: 'Missing link parameter!' });

  try {
    const result = await apimp4(link, formats);
    return res.json(result);
  } catch (error) {
    return res.status(500).json({ status: false, message: 'Error during external MP4 download' });
  }
});

// Metadata fetch endpoint
app.get('/metadata', async (req, res) => {
  const { link } = req.query;
  if (!link) return res.status(400).json({ status: false, message: 'Missing link parameter!' });

  try {
    const result = await metadata(link);
    return res.json(result);
  } catch (error) {
    return res.status(500).json({ status: false, message: 'Error fetching metadata' });
  }
});

// Channel info endpoint
app.get('/channel', async (req, res) => {
  const { input } = req.query;
  if (!input) return res.status(400).json({ status: false, message: 'Missing input parameter!' });

  try {
    const result = await channel(input);
    return res.json(result);
  } catch (error) {
    return res.status(500).json({ status: false, message: 'Error fetching channel info' });
  }
});

// Search videos endpoint
app.get('/search', async (req, res) => {
  const { query } = req.query;
  if (!query) return res.status(400).json({ status: false, message: 'Missing search query!' });

  try {
    const result = await search(query);
    return res.json(result);
  } catch (error) {
    return res.status(500).json({ status: false, message: 'Error during search' });
  }
});

// Export the serverless handler for Vercel
module.exports = app;
