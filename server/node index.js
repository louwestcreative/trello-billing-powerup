import express from 'express';
import fetch from 'node-fetch';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// CORS middleware to allow your front-end requests (adjust origin as needed)
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*'); // Replace * with your frontend origin for security
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

app.post('/validate-toggl-key', async (req, res) => {
  const apiKey = req.body.apiKey;
  if (!apiKey) {
    return res.status(400).json({ error: 'API key is required' });
  }

  const auth = Buffer.from(`${apiKey}:api_token`).toString('base64');

  try {
    const response = await fetch('https://api.track.toggl.com/api/v9/me', {
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      const data = await response.json();
      return res.json({ valid: true, data });
    } else {
      const errorText = await response.text();
      return res.status(401).json({ valid: false, error: errorText });
    }
  } catch (error) {
    return res.status(500).json({ valid: false, error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
