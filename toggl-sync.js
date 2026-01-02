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
  statusDiv.innerHTML = `<div class="status-${type}">${message}</di
