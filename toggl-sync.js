/* global TrelloPowerUp */

const t = TrelloPowerUp.iframe();

// ===== CORS PROXY CONFIGURATION =====
// Using AllOrigins as a free CORS proxy
// For production, consider setting up your own backend proxy
const CORS_PROXY = 'https://api.allorigins.win/raw?url=';
const TOGGL_API_BASE = 'https://api.track.toggl.com/api/v9';

// Helper function to call Toggl API through proxy
async function callTogglAPI(apiToken, endpoint) {
  const togglUrl = `${TOGGL_API_BASE}${endpoint}`;
  const authHeader = btoa(`${apiToken}:api_token`);
  
  try {
    // Try direct call first (in case CORS is resolved or user has extension)
    try {
      const directResponse = await fetch(togglUrl, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${authHeader}`
        }
      });
      
      if (directResponse.ok) {
        console.log('✓ Direct Toggl API call succeeded');
        return await directResponse.json();
      }
    } catch (directError) {
      console.log('Direct call blocked by CORS, using proxy...');
    }
    
    // Use proxy as fallback
    const proxyUrl = `${CORS_PROXY}${encodeURIComponent(togglUrl)}`;
    
    const response = await fetch(proxyUrl, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${authHeader}`
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Toggl API error: ${response.status} - ${errorText}`);
    }
    
    const text = await response.text();
    
    // Try to parse as JSON
    try {
      return JSON.parse(text);
    } catch (parseError) {
      // If it's wrapped by AllOrigins, try to extract
      if (text.includes('"contents"')) {
        const wrapped = JSON.parse(text);
        return JSON.parse(wrapped.contents);
      }
      throw new Error('Failed to parse Toggl API response');
    }
    
  } catch (error) {
    console.error('Toggl API call failed:', error);
    throw error;
  }
}

function formatHours(hours) {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

function formatCurrency(amount) {
  return '$' + amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

async function loadSettings() {
  const apiToken = await t.get('board', 'private', 'togglApiToken');
  
  if (apiToken) {
    document.getElementById('setupSection').style.display = 'none';
    document.getElementById('syncSection').style.display = 'block';
    document.getElementById('togglApiToken').value = apiToken;
  }
}

// Save API token
document.getElementById('saveTokenBtn').addEventListener('click', async function() {
  const token = document.getElementById('togglApiToken').value.trim();
  
  if (!token) {
    alert('Please enter your Toggl API token');
    return;
  }
  
  // Test the token using our proxy helper
  try {
    showStatus('Testing connection...', 'blue');
    
    // FIXED: Use callTogglAPI instead of direct fetch
    const userData = await callTogglAPI(token, '/me');
    
    console.log('Connected to Toggl as:', userData);
    
    await t.set('board', 'private', 'togglApiToken', token);
    document.getElementById('setupSection').style.display = 'none';
    document.getElementById('syncSection').style.display = 'block';
    
    showStatus('Token saved successfully!', 'green');
  } catch (error) {
    console.error('Connection error:', error);
    showStatus('Error: ' + error.message, 'red');
    alert('Error connecting to Toggl: ' + error.message);
  }
});

// Sync button
document.getElementById('syncBtn').addEventListener('click', async function() {
  const apiToken = await t.get('board', 'private', 'togglApiToken');
  const dateRange = parseInt(document.getElementById('dateRange').value);
  
  if (!apiToken) {
    alert('Please set up your Toggl API token first');
    return;
  }
  
  showStatus('Syncing...', 'blue');
  
  try {
    const card = await t.card('name', 'labels');
    const cardName = card.name;
    
    // Get time entries
    const startDate = new Date(Date.now() - dateRange * 24 * 60 * 60 * 1000).toISOString();
    const endDate = new Date().toISOString();
    
    // FIXED: Use callTogglAPI instead of direct fetch
    const entries = await callTogglAPI(
      apiToken, 
      `/me/time_entries?start_date=${startDate}&end_date=${endDate}`
    );
    
    console.log(`Fetched ${entries.length} time entries from Toggl`);
    
    // Match entries to this card by name
    const cleanCardName = cardName.toLowerCase().trim();
    const matchedEntries = entries.filter(entry => {
      const description = (entry.description || '').toLowerCase();
      return description.includes(cleanCardName);
    });
    
    console.log(`Found ${matchedEntries.length} entries matching "${cardName}"`);
    
    // Calculate total hours
    let totalSeconds = 0;
    matchedEntries.forEach(entry => {
      if (entry.duration > 0) {
        totalSeconds += entry.duration;
      }
    });
    
    const totalHours = totalSeconds / 3600;
    
    // Save to card
    await t.set('card', 'shared', 'togglHours', totalHours);
    await t.set('card', 'shared', 'lastTogglSync', new Date().toISOString());
    
    // Get hourly rate
    const customRate = await t.get('card', 'shared', 'hourlyRate');
    let hourlyRate = customRate || 100;
    
    // Check labels for default rate
    if (!customRate) {
      const defaultRates = {
        'Pierce GAL': 125,
        'Pierce MG GAL': 125,
        'Kitsap GAL': 200,
        'Kitsap MG GAL': 200,
        'Pierce CV': 200,
        'Kitsap CV': 75
      };
      
      for (const label of card.labels) {
        if (defaultRates[label.name]) {
          hourlyRate = defaultRates[label.name];
          break;
        }
      }
    }
    
    // Display results
    document.getElementById('totalHours').textContent = formatHours(totalHours);
    document.getElementById('hourlyRate').textContent = formatCurrency(hourlyRate);
    document.getElementById('timeValue').textContent = formatCurrency(totalHours * hourlyRate);
    document.getElementById('hoursDisplay').style.display = 'block';
    
    if (customRate) {
      document.getElementById('customRate').value = customRate;
    }
    
    // Display matched entries
    displayMatchedEntries(matchedEntries);
    
    showStatus(`Synced ${matchedEntries.length} entries (${formatHours(totalHours)})`, 'green');
    
  } catch (error) {
    console.error('Sync error:', error);
    showStatus('Error: ' + error.message, 'red');
  }
});

// Save custom rate
document.getElementById('saveRateBtn').addEventListener('click', async function() {
  const rate = parseFloat(document.getElementById('customRate').value);
  
  if (!rate || rate <= 0) {
    alert('Please enter a valid hourly rate');
    return;
  }
  
  await t.set('card', 'shared', 'hourlyRate', rate);
  
  const togglHours = await t.get('card', 'shared', 'togglHours', 0);
  document.getElementById('hourlyRate').textContent = formatCurrency(rate);
  document.getElementById('timeValue').textContent = formatCurrency(togglHours * rate);
  
  showStatus('Hourly rate updated!', 'green');
});

function showStatus(message, color) {
  const statusDiv = document.getElementById('syncStatus');
  statusDiv.innerHTML = `<div style="padding: 8px; background: ${color === 'green' ? '#d4edda' : color === 'red' ? '#f8d7da' : '#d1ecf1'}; color: ${color === 'green' ? '#155724' : color === 'red' ? '#721c24' : '#0c5460'}; border-radius: 3px; font-size: 12px;">${message}</div>`;
}

function displayMatchedEntries(entries) {
  const container = document.getElementById('matchedEntries');
  
  if (entries.length === 0) {
    container.innerHTML = '<p class="no-data">No matching time entries found. Make sure your Toggl entry descriptions include the card name.</p>';
    return;
  }
  
  let html = '<h4 style="font-size: 14px; margin: 12px 0 8px 0;">Matched Time Entries:</h4>';
  html += '<div style="max-height: 200px; overflow-y: auto;">';
  
  entries.forEach(entry => {
    const hours = entry.duration / 3600;
    const date = new Date(entry.start).toLocaleDateString();
    html += `
      <div style="padding: 8px; margin-bottom: 4px; background: #f4f5f7; border-radius: 3px; font-size: 12px;">
        <div style="display: flex; justify-content: space-between;">
          <span style="font-weight: 600;">${entry.description || 'No description'}</span>
          <span style="color: #0079bf; font-weight: 600;">${formatHours(hours)}</span>
        </div>
        <div style="color: #5e6c84; font-size: 11px;">${date}</div>
      </div>
    `;
  });
  
  html += '</div>';
  container.innerHTML = html;
}

// Initial load
loadSettings();
t.sizeTo('body').done();
