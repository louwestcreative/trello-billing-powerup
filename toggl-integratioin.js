// Toggl API Integration Helper
// This handles all Toggl API calls and data syncing

const TOGGL_API_BASE = 'https://api.track.toggl.com/api/v9';

class TogglIntegration {
  constructor(apiToken) {
    this.apiToken = apiToken;
    this.headers = {
      'Content-Type': 'application/json',
      'Authorization': `Basic ${btoa(apiToken + ':api_token')}`
    };
  }

  // Get all workspaces
  async getWorkspaces() {
    const response = await fetch(`${TOGGL_API_BASE}/me`, {
      headers: this.headers
    });
    const data = await response.json();
    return data.workspaces || [];
  }

  // Get time entries for a specific project or client
  async getTimeEntries(workspaceId, startDate, endDate) {
    const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const end = endDate || new Date().toISOString();
    
    const response = await fetch(
      `${TOGGL_API_BASE}/me/time_entries?start_date=${start}&end_date=${end}`,
      { headers: this.headers }
    );
    return await response.json();
  }

  // Get projects for a workspace
  async getProjects(workspaceId) {
    const response = await fetch(
      `${TOGGL_API_BASE}/workspaces/${workspaceId}/projects`,
      { headers: this.headers }
    );
    return await response.json();
  }

  // Match Toggl entries to Trello cards by name
  matchEntriesToCard(cardName, timeEntries, projects) {
    const matchedEntries = [];
    
    // Clean card name for matching
    const cleanCardName = cardName.toLowerCase().trim();
    
    for (const entry of timeEntries) {
      const projectName = projects.find(p => p.id === entry.project_id)?.name || '';
      const description = entry.description || '';
      
      // Match by project name or description containing card name
      if (projectName.toLowerCase().includes(cleanCardName) || 
          description.toLowerCase().includes(cleanCardName)) {
        matchedEntries.push(entry);
      }
    }
    
    return matchedEntries;
  }

  // Calculate total hours from entries
  calculateTotalHours(entries) {
    let totalSeconds = 0;
    for (const entry of entries) {
      if (entry.duration > 0) {
        totalSeconds += entry.duration;
      }
    }
    return totalSeconds / 3600; // Convert to hours
  }

  // Get hourly rate from card data or default
  getHourlyRate(cardData, labelName) {
    // Check if custom rate is set
    if (cardData.hourlyRate) {
      return cardData.hourlyRate;
    }
    
    // Default rates by case type
    const defaultRates = {
      'Pierce GAL': 125,
      'Pierce MG GAL': 125,
      'Kitsap GAL': 200,
      'Kitsap MG GAL': 200,
      'Pierce CV': 200,
      'Kitsap CV': 75
    };
    
    return defaultRates[labelName] || 100;
  }
}

// Helper to format hours
function formatHours(hours) {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return `${h}h ${m}m`;
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { TogglIntegration, formatHours };
}
