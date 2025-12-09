const t = TrelloPowerUp.iframe();

const PIERCE_GAL_LABELS = ['Pierce GAL', 'Pierce MG GAL'];
const KITSAP_GAL_LABELS = ['Kitsap GAL', 'Kitsap MG GAL'];

const AUTO_CHARGE_PIERCE = 2000;
const AUTO_CHARGE_KITSAP = 4000;

// Load billing data or default
async function loadBillingData() {
  const data = await t.get('card', 'shared', 'billingData');
  return data || { charges: [], payments: [] };
}

// Save billing data
function saveBillingData(data) {
  return t.set('card', 'shared', 'billingData', data);
}

// Escape HTML for safety
function escapeHTML(str) {
  return String(str).replace(/[&<>"']/g, function (m) {
    return {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    }[m];
  });
}

// Render charges and payments logs
function renderLogs(data) {
  const chargesDiv = document.getElementById('charges-log');
  const paymentsDiv = document.getElementById('payments-log');

  if (data.charges.length === 0) {
    chargesDiv.innerHTML = '<em>No charges recorded</em>';
  } else {
    chargesDiv.innerHTML = data.charges
      .map(
        (c) =>
          `<div class="log-entry">${escapeHTML(c.date)} — <strong>${escapeHTML(
            c.type
          )}</strong> — $${parseFloat(c.amount).toFixed(2)}</div>`
      )
      .join('');
  }

  if (data.payments.length === 0) {
    paymentsDiv.innerHTML = '<em>No payments recorded</em>';
  } else {
    paymentsDiv.innerHTML = data.payments
      .map(
        (p) =>
          `<div class="log-entry">${escapeHTML(p.date)} — Payment — $${parseFloat(
            p.amount
          ).toFixed(2)}</div>`
      )
      .join('');
  }
}

// Get all labels on the card
async function getCardLabels() {
  const card = await t.card('labels');
  return card.labels.map((label) => label.name);
}

// Check for auto charges based on labels
async function applyAutoChargesIfNeeded(data) {
  const labels = await getCardLabels();

  // Flags to avoid duplicates
  const hasPierceCharge = data.charges.some((c) =>
    ['Pierce GAL Auto Charge', 'Pierce MG GAL Auto Charge'].includes(c.type)
  );
  const hasKitsapCharge = data.charges.some((c) =>
    ['Kitsap GAL Auto Charge', 'Kitsap MG GAL Auto Charge'].includes(c.type)
  );

  const today = new Date().toISOString().slice(0, 10);

  if (
    labels.some((l) => PIERCE_GAL_LABELS.includes(l)) &&
    !hasPierceCharge
  ) {
    // Add Pierce GAL auto charge
    data.charges.push({
      type: 'Pierce GAL Auto Charge',
      date: today,
      amount: AUTO_CHARGE_PIERCE,
    });
  }

  if (
    labels.some((l) => KITSAP_GAL_LABELS.includes(l)) &&
    !hasKitsapCharge
  ) {
    // Add Kitsap GAL auto charge
    data.charges.push({
      type: 'Kitsap GAL Auto Charge',
      date: today,
      amount: AUTO_CHARGE_KITSAP,
    });
  }

  await saveBillingData(data);
  return data;
}

// Update badge with balance
async function updateBadge() {
  const data = await loadBillingData();
  const totalCharged = data.charges.reduce((acc, c) => acc + Number(c.amount), 0);
  const totalPaid = data.payments.reduce((acc, p) => acc + Number(p.amount), 0);
  const balance = totalCharged - totalPaid;

  t.card('labels').then((card) => {
    // Here you could update badges via t.set or notifyParent as needed
    // For demo, this just logs balance
    console.log('Balance:', balance.toFixed(2));
  });

  return {
    text: `$${balance.toFixed(2)}`,
    color: balance > 0 ? 'red' : 'green',
  };
}

// Setup event listeners for forms
function setupFormHandlers() {
  const chargeForm = document.getElementById('charge-form');
  const paymentForm = document.getElementById('payment-form');

  chargeForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const type = document.getElementById('charge-type').value;
    const date = document.getElementById('charge-date').value;
    const amount = parseFloat(document.getElementById('charge-amount').value);

    if (!type || !date || isNaN(amount) || amount <= 0) {
      alert('Please complete all charge fields correctly.');
      return;
    }

    let data = await loadBillingData();
    data.charges.push({ type, date, amount });
    await saveBillingData(data);

    data = await applyAutoChargesIfNeeded(data); // Ensure auto charges present

    renderLogs(data);
    alert('Charge added successfully!');
    chargeForm.reset();
    t.notifyParent('billingDataChanged');
  });

  paymentForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const date = document.getElementById('payment-date').value;
    const amount = parseFloat(document.getElementById('payment-amount').value);

    if (!date || isNaN(amount) || amount <= 0) {
      alert('Please complete all payment fields correctly.');
      return;
    }

    let data = await loadBillingData();
    data.payments.push({ type: 'Payment', date, amount });
    await saveBillingData(data);

    renderLogs(data);
    alert('Payment recorded successfully!');
    paymentForm.reset();
    t.notifyParent('billingDataChanged');
  });
}

// Initialize app
async function init() {
  let data = await loadBillingData();
  data = await applyAutoChargesIfNeeded(data);
  renderLogs(data);
  setupFormHandlers();
}

document.addEventListener('DOMContentLoaded', init);
