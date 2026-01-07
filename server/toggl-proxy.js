// server/toggl-proxy.js
// Reusable Toggl API proxy functions

const fetch = require('node-fetch');

/**
 * Validates a Toggl API key by calling the /me endpoint
 * @param {string} apiKey - The Toggl API key to validate
 * @returns {Promise<Object>} - { valid: boolean, data?: Object, error?: string }
 */
async function validateTogglApiKey(apiKey) {
  if (!apiKey || typeof apiKey !== 'string') {
    return { 
      valid: false, 
      error: 'API key must be a non-empty string' 
    };
  }

  try {
    // Toggl uses Basic Auth with format "apiKey:api_token"
    const auth = Buffer.from(`${apiKey}:api_token`).toString('base64');
    
    const response = await fetch('https://api.track.toggl.com/api/v9/me', {
      method: 'GET',
      headers: { 
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const data = await response.json();
      return { 
        valid: true,
        data: {
          id: data.id,
          email: data.email,
          fullname: data.fullname,
          timezone: data.timezone,
          default_workspace_id: data.default_workspace_id,
          beginning_of_week: data.beginning_of_week,
          country_id: data.country_id
        }
      };
    } else if (response.status === 401 || response.status === 403) {
      return { 
        valid: false, 
        error: 'Invalid API key. Please check your Toggl API key.' 
      };
    } else {
      const errorText = await response.text();
      return { 
        valid: false, 
        error: `Toggl API error (${response.status}): ${errorText}` 
      };
    }
    
  } catch (error) {
    console.error('Toggl validation error:', error);
    return { 
      valid: false, 
      error: `Network error: ${error.message}` 
    };
  }
}

/**
 * Fetches time entries for a given date range
 * @param {string} apiKey - The Toggl API key
 * @param {string} startDate - Start date (ISO format: YYYY-MM-DD)
 * @param {string} endDate - End date (ISO format: YYYY-MM-DD)
 * @returns {Promise<Object>} - { success: boolean, entries?: Array, error?: string }
 */
async function getTimeEntries(apiKey, startDate, endDate) {
  try {
    const auth = Buffer.from(`${apiKey}:api_token`).toString('base64');
    
    const url = `https://api.track.toggl.com/api/v9/me/time_entries?start_date=${startDate}&end_date=${endDate}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: { 
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const entries = await response.json();
      return { 
        success: true,
        entries: entries
      };
    } else {
      const errorText = await response.text();
      return { 
        success: false, 
        error: `Failed to fetch time entries: ${errorText}` 
      };
    }
    
  } catch (error) {
    return { 
      success: false, 
      error: `Network error: ${error.message}` 
    };
  }
}

/**
 * Fetches workspaces for the authenticated user
 * @param {string} apiKey - The Toggl API key
 * @returns {Promise<Object>} - { success: boolean, workspaces?: Array, error?: string }
 */
async function getWorkspaces(apiKey) {
  try {
    const auth = Buffer.from(`${apiKey}:api_token`).toString('base64');
    
    const response = await fetch('https://api.track.toggl.com/api/v9/workspaces', {
      method: 'GET',
      headers: { 
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const workspaces = await response.json();
      return { 
        success: true,
        workspaces: workspaces
      };
    } else {
      const errorText = await response.text();
      return { 
        success: false, 
        error: `Failed to fetch workspaces: ${errorText}` 
      };
    }
    
  } catch (error) {
    return { 
      success: false, 
      error: `Network error: ${error.message}` 
    };
  }
}

/**
 * Fetches projects for a given workspace
 * @param {string} apiKey - The Toggl API key
 * @param {number} workspaceId - The workspace ID
 * @returns {Promise<Object>} - { success: boolean, projects?: Array, error?: string }
 */
async function getProjects(apiKey, workspaceId) {
  try {
    const auth = Buffer.from(`${apiKey}:api_token`).toString('base64');
    
    const response = await fetch(`https://api.track.toggl.com/api/v9/workspaces/${workspaceId}/projects`, {
      method: 'GET',
      headers: { 
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const projects = await response.json();
      return { 
        success: true,
        projects: projects
      };
    } else {
      const errorText = await response.text();
      return { 
        success: false, 
        error: `Failed to fetch projects: ${errorText}` 
      };
    }
    
  } catch (error) {
    return { 
      success: false, 
      error: `Network error: ${error.message}` 
    };
  }
}

module.exports = {
  validateTogglApiKey,
  getTimeEntries,
  getWorkspaces,
  getProjects
};
