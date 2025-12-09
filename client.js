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
    chargesDiv.innerHTML = data.charges.map(c =>
      `<div class="log-entry">${escapeHTML(c.date)} — <strong>${escapeHTML(c.type)}</strong> — $${parseFloat(c.amount).toFixed(2)}</div>`
    ).join('');
  }

  if (data.payments.length === 0) {
    paymentsDiv.innerHTML = '<em>No payments recorded</em>';
  } else {
    paymentsDiv.innerHTML = data.payments.map(p =>
      `<div class="log-entry">${escapeHTML(p.date)} — <strong>${escapeHTML(p.type)}</strong> — $${parseFloat(p.amount).toFixed(2)}</div>`
    ).join('');
  }
}

// Setup form handlers
function setupFormHandlers() {
  document.getElementById('charge-form').addEventListener('submit', e => {
    e.preventDefault();
    const type = document.getElementById('charge-type').value;
    const date = document.getElementById('charge-date').value;
    const amount = parseFloat(document.getElementById('charge-amount').value);

    if (!type || !date || isNaN(amount) || amount <= 0) {
      alert('Please complete all charge fields correctly.');
      return;
    }

    loadBillingData().then(data => {
      data.charges.push({ type, date, amount });
      return saveBillingData(data);
    }).then(() => loadBillingData())
      .then(updatedData => {
        renderLogs(updatedData);
        alert('Charge added successfully!');
        e.target.reset();
        t.notifyParent('billingDataChanged');
      });
  });

  document.getElementById('payment-form').addEventListener('submit', e => {
    e.preventDefault();
    const type = document.getElementById('payment-type').value;
    const date = document.getElementById('payment-date').value;
    const amount = parseFloat(document.getElementById('payment-amount').value);

    if (!type || !date || isNaN(amount) || amount <= 0) {
      alert('Please complete all payment fields correctly.');
      return;
    }

    loadBillingData().then(data => {
      data.payments.push({ type, date, amount });
      return saveBillingData(data);
    }).then(() => loadBillingData())
      .then(updatedData => {
        renderLogs(updatedData);
        alert('Payment recorded successfully!');
        e.target.reset();
        t.notifyParent('billingDataChanged');
      });
  });
}

// Initialize the app
function init() {
  loadBillingData().then(renderLogs);
  setupFormHandlers();
}

// Run on page load
document.addEventListener('DOMContentLoaded', init);
