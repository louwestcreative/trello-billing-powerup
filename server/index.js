// server/index.js
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch'); // npm install node-fetch@2

const app = express();
app.use(cors());
app.use(express.json());

app.post('/validate-toggl-key', async (req, res) => {
  const { apiKey } = req.body;
  if (!apiKey) return res.status(400).json({ error: 'API key is required' });

  const auth = Buffer.from(`${apiKey}:api_token`).toString('base64');
  try {
    const response = await fetch('https://api.track.toggl.com/api/v9/me', {
      headers: { Authorization: `Basic ${auth}` },
    });

    if (response.ok) {
      const data = await response.json();
      res.json({ valid: true, data });
    } else {
      const errorText = await response.text();
      res.status(response.status).json({ valid: false, error: errorText });
    }
  } catch (error) {
    res.status(500).json({ valid: false, error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Toggl API proxy server listening on port ${PORT}`);
});
