/* global TrelloPowerUp */

var t = TrelloPowerUp.iframe();

const HOURLY_RATES = {
  'Kitsap GAL': 200,
  'Pierce GAL': 125,
  'Kitsap MG GAL': 200,
  'Pierce CV': 126,
  'Kitsap CV': 75,
  'Pierce MG GAL': 125
};

// Import Toggl integration functions
let togglIntegration;

// Load the integration module
const script = document.createElement('script');
script.src = './toggl-integration.js';
script.onload = function() {
  togglIntegration = window.TogglIntegration;
  initializePage();
};
document.head.appendChild(script);

function showStatus(message, type = 'success') {
  const statusDiv = document.getElementById('statusMessage');
  statusDiv.innerHTML = `<div class="status-${type}">${message}</div>`;
  
  setTimeout(() => {
    statusDiv.innerHTML = '';
  }, 5000);
}

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

async function syncCardHours(cardId, cardName, labelName, hourlyRate, button) {
  try {
    button.disabled = true;
    button.textContent = 'Syncing...';

    const result = await togglIntegration.getTimeEntries(t, cardName);
    
    if (!result || !result.project) {
      showStatus('Toggl project not found for: ' + cardName, 'error');
      button.disabled = false;
      button.textContent = 'Sync';
      return;
    }

    const totalSeconds = result.entries.reduce((sum, e) => sum + (e.duration || 0), 0);
    const totalHours = (totalSeconds / 3600).toFixed(2);
    const billableAmount = (totalHours * hourlyRate).toFixed(2);

    if (parseFloat(totalHours) === 0) {
      showStatus('No hours to sync for: ' + cardName, 'error');
      button.disabled = false;
      button.textContent = 'Sync';
      return;
    }

    // Get existing charges for this card
    const charges = await t.get(cardId, 'shared', 'charges', []);
    
    // Add new charge
    charges.push({
      type: 'Hours',
      amount: parseFloat(billableAmount),
      description: `${totalHours} hours @ $${hourlyRate}/h (Toggl sync)`,
      date: new Date().toISOString()
    });

    await t.set(cardId, 'shared', 'charges', charges);

    showStatus(`✓ Synced ${totalHours}h ($${billableAmount}) to ${cardName}`, 'success');
    button.textContent = '✓ Synced';
    
    setTimeout(() => {
      button.disabled = false;
      button.textContent = 'Sync';
    }, 3000);

  } catch (error) {
    showStatus('Error syncing ' + cardName + ': ' + error.message, 'error');
    button.disabled = false;
    button.textContent = 'Sync';
  }
}

async function loadCardsWithTogglProjects() {
  const contentDiv = document.getElementById('content');
  
  try {
    // Check if Toggl is configured
    const apiKey = await t.get('board', 'shared', 'togglApiKey');
    if (!apiKey) {
      contentDiv.innerHTML = `
        <div class="empty-state">
          <h2>Toggl Not Configured</h2>
          <p>Please configure your Toggl API key first.</p>
          <button id="configureBtn" class="btn-primary">Configure Toggl</button>
        </div>
      `;
      
      document.getElementById('configureBtn').addEventListener('click', function() {
        t.popup({
          title: 'Toggl Configuration',
          url: './toggl-config.html',
          height: 150
        });
      });
      return;
    }

    // Get all cards on the board
    const lists = await t.lists('all');
    const allCards = [];
    
    for (const list of lists) {
      const cards = await t.cards('id', 'name', 'labels', list.id);
      allCards.push(...cards);
    }

    // Filter cards with billing labels
    const cardsWithLabels = allCards.filter(card => {
      const primaryLabel = getPrimaryLabel(card.labels);
      return primaryLabel !== null;
    });

    if (cardsWithLabels.length === 0) {
      contentDiv.innerHTML = `
        <div class="empty-state">
          <h2>No Cards Found</h2>
          <p>No cards with billing labels (GAL/CV) were found on this board.</p>
        </div>
      `;
      return;
    }

    // Get Toggl projects
    const workspace = await togglIntegration.getWorkspace(t);
    const projects = await togglIntegration.getProjects(t, workspace.id);

    // Match cards with Toggl projects
    const matchedCards = [];
    
    for (const card of cardsWithLabels) {
      const project = projects.find(p => p.name === card.name);
      if (project) {
        const primaryLabel = getPrimaryLabel(card.labels);
        const hourlyRate = HOURLY_RATES[primaryLabel];
        
        matchedCards.push({
          ...card,
          primaryLabel,
          hourlyRate,
          togglProject: project
        });
      }
    }

    if (matchedCards.length === 0) {
      contentDiv.innerHTML = `
        <div class="empty-state">
          <h2>No Matching Projects</h2>
          <p>No Toggl projects found matching your card names.</p>
          <p style="font-size: 12px; color: #5e6c84;">Card names must match Toggl project names exactly.</p>
        </div>
      `;
      return;
    }

    // Render matched cards
    let html = '<div class="card-list">';
    
    for (const card of matchedCards) {
      // Get time entries for this project
      const result = await togglIntegration.getTimeEntries(t, card.name);
      const totalSeconds = result.entries.reduce((sum, e) => sum + (e.duration || 0), 0);
      const totalHours = (totalSeconds / 3600).toFixed(2);
      const billableAmount = (totalHours * card.hourlyRate).toFixed(2);
      
      html += `
        <div class="card-item" data-card-id="${card.id}">
          <div class="card-info">
            <div class="card-name">${card.name}</div>
            <div>
              <span class="card-label">${card.primaryLabel}</span>
              <span class="card-label">$${card.hourlyRate}/h</span>
            </div>
            <div class="card-hours">
              ${totalHours}h tracked = $${billableAmount}
            </div>
          </div>
          <div class="card-actions">
            <button class="btn-primary sync-card-btn" 
                    data-card-id="${card.id}"
                    data-card-name="${card.name}"
                    data-label="${card.primaryLabel}"
                    data-rate="${card.hourlyRate}">
              Sync
            </button>
          </div>
        </div>
      `;
    }
    
    html += '</div>';
    contentDiv.innerHTML = html;

    // Show sync all button
    document.getElementById('syncAllSection').style.display = 'block';

    // Add event listeners to sync buttons
    const syncButtons = document.querySelectorAll('.sync-card-btn');
    syncButtons.forEach(button => {
      button.addEventListener('click', function() {
        const cardId = this.dataset.cardId;
        const cardName = this.dataset.cardName;
        const labelName = this.dataset.label;
        const hourlyRate = parseFloat(this.dataset.rate);
        
        syncCardHours(cardId, cardName, labelName, hourlyRate, this);
      });
    });

    // Sync all button
    document.getElementById('syncAllBtn').addEventListener('click', async function() {
      this.disabled = true;
      this.textContent = 'Syncing All...';
      
      for (const button of syncButtons) {
        await syncCardHours(
          button.dataset.cardId,
          button.dataset.cardName,
          button.dataset.label,
          parseFloat(button.dataset.rate),
          button
        );
        
        // Small delay between syncs
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      this.disabled = false;
      this.textContent = 'Sync All Cards';
      showStatus('✓ All cards synced successfully!', 'success');
    });

  } catch (error) {
    contentDiv.innerHTML = `
      <div class="empty-state">
        <h2>Error Loading Cards</h2>
        <p style="color: #eb5a46;">${error.message}</p>
      </div>
    `;
  }
}

function initializePage() {
  if (togglIntegration) {
    loadCardsWithTogglProjects();
  } else {
    console.error('Toggl integration not loaded');
  }
}
