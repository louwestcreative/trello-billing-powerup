// server/toggl-proxy.js

const express = require('express');
const fetch = require('node-fetch');
const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

app.all('/toggl/*', async (req, res) => {
  try {
    const togglPath = req.path.replace('/toggl', '');

    const togglApiToken = process.env.TOGGL_API_TOKEN || 'YOUR_TOGGL_API_TOKEN';
    const authHeader = `Basic ${Buffer.from(`${togglApiToken}:api_token`).toString('base64')}`;

    const fetchOptions = {
      method: req.method,
      headers: {
        'Authorization': authHeader,
        'Content-Type': req.get('Content-Type') || 'application/json',
      },
    };

    if (req.method !== 'GET' && req.method !== 'HEAD') {
      fetchOptions.body = JSON.stringify(req.body);
    }

    const togglResponse = await fetch(`https://api.track.toggl.com/api/v9${togglPath}`, fetchOptions);
    const data = await togglResponse.json();

    res.status(togglResponse.status).json(data);
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({ error: 'Proxy error' });
  }
});

app.listen(port, () => {
  console.log(`Toggl API proxy listening at http://localhost:${port}`);
});
