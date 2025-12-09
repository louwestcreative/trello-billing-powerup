const t = TrelloPowerUp.iframe();

// Label names for automatic charges
const PIERCE_GAL_LABELS = ['Pierce GAL', 'Pierce MG GAL'];
const KITSAP_GAL_LABELS = ['Kitsap GAL', 'Kitsap MG GAL'];

// Automatic charge amounts
const PIERCE_GAL_CHARGE = 2000;
const KITSAP_GAL_CHARGE = 4000;

// Load billing data or return default
async function loadBillingData() {
  const data = await t.get('card', 'shared', 'billingData');
  return data || { charges: [], payments: [] };
}

// Save billing data to card shared storage
async function saveBillingData(data) {
  await t.set('card', 'shared', 'billingData', data);
  // Notify Trello to update badge etc.
  t.notifyParent('billingDataChanged');
}

// Escape HTML to prevent injection
function escapeHTML(str) {
  return String(str).replace(/[&<>"']/g, m => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[m]);
}

// Render charge and payment logs on the page
function renderLogs(data) {
  const chargesDiv = document.getElementById('charges-log');
  const paymentsDiv = document.getElementById('payments-log');

  if (!data.charges.length) {
    chargesDiv.innerHTML = '<em>No charges recorded</em>';
  } else {
    chargesDiv.innerHTML = data.charges.map(c =>
      `<div class="log-entry">${escapeHTML(c.date)} — <strong>${escapeHTML(c.type || 'Charge')}</strong> — $${parseFloat(c.amount).toFixed(2)}${c.auto ? ' (Auto)' : ''}</div>`
    ).join('');
  }

  if (!data.payments.length) {
    paymentsDiv.innerHTML = '<em>No payments recorded</em>';
  } else {
    paymentsDiv.innerHTML = data.payments.map(p =>
      `<div class="log-entry">${escapeHTML(p.date)} — <strong>Payment</strong> — $${parseFloat(p.amount).toFixed(2)}</div>`
    ).join('');
  }
}

// Check if an auto charge for label already exists in charges list
function hasAutoChargeForLabel(data, label) {
  return data.charges.some(c => c.auto && c.type === label);
}

// Add automatic charges if labels are present and not already charged
async function applyAutomaticCharges() {
  const cardLabels = await t.card('labels');
  const data = await loadBillingData();

  // Pierce GAL auto charge
  for (const label of PIERCE_GAL_LABELS) {
    if (cardLabels.labels.some(l => l.name === label) && !hasAutoChargeForLabel(data, label)) {
      data.charges.push({
        type: label,
        date: new Date().toISOString().split('T')[0],
        amount: PIERCE_GAL_CHARGE,
        auto: true
      });
    }
  }

  // Kitsap GAL auto charge
  for (const label of KITSAP_GAL_LABELS) {
    if (cardLabels.labels.some(l => l.name === label) && !hasAutoChargeForLabel(data, label)) {
      data.charges.push({
        type: label,
        date: new Date().toISOString().split('T')[0],
        amount: KITSAP_GAL_CHARGE,
        auto: true
      });
    }
  }

  await saveBillingData(data);
  return data;
}

// Setup form event handlers
function setupFormHandlers() {
  document.getElementById('charge-form').addEventListener('submit', async e => {
    e.preventDefault();
    const type = document.getElementById('charge-type').value;
    const date = document.getElementById('charge-date').value;
    const amount = parseFloat(document.getElementById('charge-amount').value);

    if (!type || !date || isNaN(amount) || amount <= 0) {
      alert('Please complete all charge fields correctly.');
      return;
    }

    const data = await loadBillingData();
    data.charges.push({ type, date, amount, auto: false });
    await saveBillingData(data);

    renderLogs(data);
    e.target.reset();
  });

  document.getElementById('payment-form').addEventListener('submit', async e => {
    e.preventDefault();
    const date = document.getElementById('payment-date').value;
    const amount = parseFloat(document.getElementById('payment-amount').value);

    if (!date || isNaN(amount) || amount <= 0) {
      alert('Please complete all payment fields correctly.');
      return;
    }

    const data = await loadBillingData();
    data.payments.push({ date, amount });
    await saveBillingData(data);

    renderLogs(data);
    e.target.reset();
  });
}

// Initialize: apply auto charges, load and render logs, setup forms
async function init() {
  const data = await applyAutomaticCharges();
  renderLogs(data);
  setupFormHandlers();
}

document.addEventListener('DOMContentLoaded', init);
