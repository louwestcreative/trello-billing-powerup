// server/index.js
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS for all origins (adjust for production)
app.use(cors());
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Trello Billing Power-Up server is running',
    timestamp: new Date().toISOString(),
    endpoints: {
      health: 'GET /health',
      validateToggl: 'POST /validate-toggl-key'
    }
  });
});

// Toggl API validation endpoint
app.post('/validate-toggl-key', async (req, res) => {
  const { apiKey } = req.body;
  
  // Validate input
  if (!apiKey) {
    console.log('❌ Validation failed: No API key provided');
    return res.status(400).json({ 
      valid: false,
      error: 'API key is required' 
    });
  }
  
  // Log sanitized API key (first 4 chars only for security)
  const sanitized = apiKey.substring(0, 4) + '***';
  console.log(`🔍 Validating Toggl API key: ${sanitized}`);
  
  try {
    // Encode API key for Toggl Basic Auth
    // Toggl expects: "apiKey:api_token" encoded in base64
    const auth = Buffer.from(`${apiKey}:api_token`).toString('base64');
    
    // Call Toggl API to validate
    const response = await fetch('https://api.track.toggl.com/api/v9/me', {
      method: 'GET',
      headers: { 
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      // API key is valid
      const data = await response.json();
      console.log(`✅ API key valid for: ${data.email}`);
      
      res.json({ 
        valid: true,
        data: {
          id: data.id,
          email: data.email,
          fullname: data.fullname,
          timezone: data.timezone,
          default_workspace_id: data.default_workspace_id
        }
      });
    } else if (response.status === 401 || response.status === 403) {
      // Invalid API key
      console.log(`❌ Invalid API key (status: ${response.status})`);
      res.json({ 
        valid: false, 
        error: 'Invalid API key. Please check your Toggl API key and try again.' 
      });
    } else {
      // Other HTTP errors
      const errorText = await response.text();
      console.log(`⚠️ Toggl API error (status: ${response.status}):`, errorText);
      res.status(response.status).json({ 
        valid: false, 
        error: `Toggl API returned status ${response.status}` 
      });
    }
    
  } catch (error) {
    // Network or server errors
    console.error('❌ Server error:', error);
    res.status(500).json({ 
      valid: false, 
      error: 'Server error: ' + error.message 
    });
  }
});

// Catch-all for unknown routes
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Endpoint not found',
    availableEndpoints: {
      health: 'GET /health',
      validateToggl: 'POST /validate-toggl-key'
    }
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════╗
║                                                       ║
║   Trello Billing Power-Up Server                     ║
║   Status: RUNNING ✅                                  ║
║                                                       ║
║   URL: http://localhost:${PORT}                         ║
║                                                       ║
║   Endpoints:                                          ║
║   • GET  /health                                      ║
║   • POST /validate-toggl-key                          ║
║                                                       ║
║   Test with:                                          ║
║   curl http://localhost:${PORT}/health                  ║
║                                                       ║
╚═══════════════════════════════════════════════════════╝
  `);
});
