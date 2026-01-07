// server/index.js
const express = require('express');
const cors = require('cors');
const togglProxy = require('./toggl-proxy');

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
      validateToggl: 'POST /validate-toggl-key',
      timeEntries: 'POST /toggl/time-entries',
      workspaces: 'POST /toggl/workspaces',
      projects: 'POST /toggl/projects'
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
    const result = await togglProxy.validateTogglApiKey(apiKey);
    
    if (result.valid) {
      console.log(`✅ API key valid for: ${result.data.email}`);
      res.json(result);
    } else {
      console.log(`❌ Invalid API key: ${result.error}`);
      res.json(result);
    }
    
  } catch (error) {
    console.error('❌ Server error:', error);
    res.status(500).json({ 
      valid: false, 
      error: 'Server error: ' + error.message 
    });
  }
});

// Get time entries
app.post('/toggl/time-entries', async (req, res) => {
  const { apiKey, startDate, endDate } = req.body;
  
  if (!apiKey) {
    return res.status(400).json({ 
      success: false,
      error: 'API key is required' 
    });
  }
  
  if (!startDate || !endDate) {
    return res.status(400).json({ 
      success: false,
      error: 'startDate and endDate are required (format: YYYY-MM-DD)' 
    });
  }
  
  console.log(`📊 Fetching time entries: ${startDate} to ${endDate}`);
  
  try {
    const result = await togglProxy.getTimeEntries(apiKey, startDate, endDate);
    res.json(result);
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Get workspaces
app.post('/toggl/workspaces', async (req, res) => {
  const { apiKey } = req.body;
  
  if (!apiKey) {
    return res.status(400).json({ 
      success: false,
      error: 'API key is required' 
    });
  }
  
  console.log(`🏢 Fetching workspaces`);
  
  try {
    const result = await togglProxy.getWorkspaces(apiKey);
    res.json(result);
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Get projects
app.post('/toggl/projects', async (req, res) => {
  const { apiKey, workspaceId } = req.body;
  
  if (!apiKey) {
    return res.status(400).json({ 
      success: false,
      error: 'API key is required' 
    });
  }
  
  if (!workspaceId) {
    return res.status(400).json({ 
      success: false,
      error: 'workspaceId is required' 
    });
  }
  
  console.log(`📁 Fetching projects for workspace: ${workspaceId}`);
  
  try {
    const result = await togglProxy.getProjects(apiKey, workspaceId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Catch-all for unknown routes
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Endpoint not found',
    availableEndpoints: {
      health: 'GET /health',
      validateToggl: 'POST /validate-toggl-key',
      timeEntries: 'POST /toggl/time-entries',
      workspaces: 'POST /toggl/workspaces',
      projects: 'POST /toggl/projects'
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
║   • POST /toggl/time-entries                          ║
║   • POST /toggl/workspaces                            ║
║   • POST /toggl/projects                              ║
║                                                       ║
║   Test with:                                          ║
║   curl http://localhost:${PORT}/health                  ║
║                                                       ║
╚═══════════════════════════════════════════════════════╝
  `);
});
