/* global TrelloPowerUp */

// Hourly rates by label
const HOURLY_RATES = {
  'Kitsap GAL': 200,
  'Pierce GAL': 125,
  'Kitsap MG GAL': 200,
  'Pierce CV': 126,
  'Kitsap CV': 75,
  'Pierce MG GAL': 125
};

// Auto-charge amounts for GAL labels
const AUTO_CHARGES = {
  'Pierce GAL': 2000,
  'Pierce MG GAL': 2000,
  'Kitsap GAL': 4000,
  'Kitsap MG GAL': 4000
};

// Toggl API configuration
const TOGGL_API_BASE = 'https://api.track.toggl.com/api/v9';

var GRAY_ICON = './coin.png';

// Helper function to make Toggl API calls
async function togglRequest(t, endpoint, options = {}) {
  const apiKey = await t.get('board', 'shared', 'togglApiKey');
  
  if (!apiKey) {
    throw new Error('Toggl API key not configured');
  }

  const auth = btoa(`${apiKey}:api_token`);
  
  const response = await fetch(`${TOGGL_API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/json',
      ...options.headers
    }
  });

  if (!response.ok) {
    throw new Error(`Toggl API error: ${response.status}`);
  }

  return response.json();
}

// Get or create Toggl workspace
async function getTogglWorkspace(t) {
  const workspaces = await togglRequest(t, '/me/workspaces');
  return workspaces[0]; // Use first workspace
}

// Get or create Toggl client based on label
async function getOrCreateTogglClient(t, labelName) {
  const workspace = await getTogglWorkspace(t);
  const clients = await togglRequest(t, `/workspaces/${workspace.id}/clients`);
  
  // Check if client exists
  let client = clients.find(c => c.name === labelName);
  
  if (!client) {
    // Create new client
    client = await togglRequest(t, `/workspaces/${workspace.id}/clients`, {
      method: 'POST',
      body: JSON.stringify({ name: labelName })
    });
  }
  
  return client;
}

// Get or create Toggl project
async function getOrCreateTogglProject(t, projectName, clientId, hourlyRate) {
  const workspace = await getTogglWorkspace(t);
  const projects = await togglRequest(t, `/workspaces/${workspace.id}/projects`);
  
  // Check if project exists
  let project = projects.find(p => p.name === projectName);
  
  if (!project) {
    // Create new project
    project = await togglRequest(t, `/workspaces/${workspace.id}/projects`, {
      method: 'POST',
      body: JSON.stringify({
        name: projectName,
        client_id: clientId,
        rate: hourlyRate,
        billable: true
      })
    });
  }
  
  return project;
}

// Get time entries for a project
async function getTogglTimeEntries(t, projectName) {
  const workspace = await getTogglWorkspace(t);
  
  // Get projects to find project ID
  const projects = await togglRequest(t, `/workspaces/${workspace.id}/projects`);
  const project = projects.find(p => p.name === projectName);
  
  if (!project) {
    return [];
  }
  
  // Get time entries for the project
  const endDate = new Date().toISOString().split('T')[0];
  const startDate = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  
  const entries = await togglRequest(
    t, 
    `/me/time_entries?start_date=${startDate}&end_date=${endDate}`
  );
  
  return entries.filter(e => e.project_id === project.id);
}

// Calculate total hours and billable amount
function calculateTotals(timeEntries, hourlyRate) {
  const totalSeconds = timeEntries.reduce((sum, entry) => sum + (entry.duration || 0), 0);
  const totalHours = totalSeconds / 3600;
  const billableAmount = totalHours * hourlyRate;
  
  return {
    totalHours: totalHours.toFixed(2),
    billableAmount: billableAmount.toFixed(2)
  };
}

// Get the primary label for hourly rate determination
function getPrimaryLabel(labels) {
  const labelOrder = [
    'Kitsap GAL', 'Pierce GAL', 'Kitsap MG GAL', 
    'Pierce CV', 'Kitsap CV', 'Pierce MG GAL'
  ];
  
  for (let labelName of labelOrder) {
    if (labels.some(l => l.name === labelName)) {
      return labelName;
    }
  }
  
  return null;
}

TrelloPowerUp.initialize({
  'board-buttons': function(t, options) {
    return [{
      icon: GRAY_ICON,
      text: 'Configure Toggl',
      callback: function(t) {
        return t.popup({
          title: 'Toggl Configuration',
          url: './toggl-config.html',
          height: 150
        });
      }
    }];
  },
  
  'card-badges': function(t, options) {
    return t.card('name')
      .get('name')
      .then(function(cardName) {
        return t.get('card', 'shared', 'charges', []);
      })
      .then(function(charges) {
        return t.get('card', 'shared', 'payments', []);
      })
      .then(function(payments) {
        var totalCharged = charges.reduce((sum, c) => sum + c.amount, 0);
        var totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
        var balance = totalCharged - totalPaid;
        
        return [{
          icon: GRAY_ICON,
          text: '$' + balance.toFixed(2),
          color: balance > 0 ? 'red' : 'green'
        }];
      });
  },
  
  'card-buttons': function(t, options) {
    return [{
      icon: GRAY_ICON,
      text: 'Billing & Hours',
      callback: function(t) {
        return t.modal({
          url: './modal.html',
          fullscreen: false,
          title: 'Billing & Time Tracking'
        });
      }
    }, {
      icon: GRAY_ICON,
      text: 'Sync Toggl Hours',
      callback: async function(t) {
        try {
          const card = await t.card('name', 'labels');
          const projectName = card.name;
          const labels = card.labels;
          const primaryLabel = getPrimaryLabel(labels);
          
          if (!primaryLabel) {
            return t.alert({
              message: 'No billing label found on card',
              duration: 3
            });
          }
          
          const hourlyRate = HOURLY_RATES[primaryLabel];
          const timeEntries = await getTogglTimeEntries(t, projectName);
          const totals = calculateTotals(timeEntries, hourlyRate);
          
          return t.alert({
            message: `Synced: ${totals.totalHours} hours = $${totals.billableAmount}`,
            duration: 5
          });
        } catch (error) {
          return t.alert({
            message: 'Error syncing Toggl: ' + error.message,
            duration: 5
          });
        }
      }
    }];
  },
  
  'card-back-section': function(t, options) {
    return {
      title: 'Time Tracking',
      icon: GRAY_ICON,
      content: {
        type: 'iframe',
        url: t.signUrl('./toggl-section.html'),
        height: 300
      }
    };
  },
  
  // Auto-create Toggl project when card is created
  'on-enable': function(t) {
    return t.modal({
      url: './auth.html',
      fullscreen: false,
      title: 'Setup Billing Power-Up'
    });
  },
  
  'card-detail-badge': function(t, options) {
    return t.card('labels', 'name')
      .then(async function(card) {
        const primaryLabel = getPrimaryLabel(card.labels);
        
        if (!primaryLabel) {
          return [];
        }
        
        const hourlyRate = HOURLY_RATES[primaryLabel];
        
        try {
          const timeEntries = await getTogglTimeEntries(t, card.name);
          const totals = calculateTotals(timeEntries, hourlyRate);
          
          return [{
            text: `${totals.totalHours}h @ $${hourlyRate}/h`,
            icon: GRAY_ICON,
            color: 'blue'
          }];
        } catch (error) {
          return [];
        }
      });
  }
}, {
  appKey: 'YOUR_APP_KEY',
  appName: 'Billing & Time Tracking'
});
