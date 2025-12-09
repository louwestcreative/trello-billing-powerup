const t = TrelloPowerUp.iframe();

function loadBillingData() {
  return t.get('card', 'shared', 'billingData')
    .then(data => data || { charges: [], payments: [] })
    .catch(err => {
      console.error('Error loading billing data:', err);
      return { charges: [], payments: [] };
    });
}

function saveBillingData(data) {
  return t.set('card', 'shared', 'billingData', data)
    .catch(err => {
      console.error('Error saving billing data:', err);
    });
}

function escapeHTML(str) {
  if (!str) return '';
  return str.replace(/[&<>"']/g, m => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[m]);
}

function renderLogs(data) {
  const chargesDiv = document.getElementById('charges-log');
  const paymentsDiv = document.getElementById('payments-log');

  if (!chargesDiv || !paymentsDiv) {
    console.error('Missing charges-log or payments-log elements in the DOM');
    return;
  }

  if (!data.charges || data.charges.length === 0) {
    chargesDiv.innerHTML = '<em>No charges recorded</em>';
  } else {
    chargesDiv.innerHTML = data.charges.map(c =>
      `<div class="log-entry">${escapeHTML(c.date)} — <strong>${escapeHTML(c.type)}</strong> — $${parseFloat(c.amount).toFixed(2)}</div>`
    ).join('');
  }

  if (!data.payments || data.payments.length === 0) {
    paymentsDiv.innerHTML = '<em>No payments
