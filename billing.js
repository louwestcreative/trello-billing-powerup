const t = TrelloPowerUp.iframe();

// Load billing data or default empty arrays
function loadBillingData() {
  return t.get('card', 'shared', 'billingData')
    .then(data => data || { charges: [], payments: [] });
}

// Save billing data to Trello card shared storage
function saveBillingData(data) {
  return t.set('card', 'shared', 'billingData', data);
}

// Escape HTML helper for safety
function escapeHTML(str) {
  return str.replace(/[&<>"']/g, function(m) {
    return ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    })[m];
  });
}

// Render logs to the UI
function renderLogs(data) {
  const chargesDiv = document.getElementById('charges-log');
  const paymentsDiv = document.getElementById('payments-log');

  if (data.charges.length === 0) {
    chargesDiv.innerHTML = '<em>No charges recorded</em>';
  } else {
    chargesDiv.innerHTML = da
