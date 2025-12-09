const t = TrelloPowerUp.iframe();

async function loadBillingData() {
  const data = await t.get('card', 'shared', 'billingData');
  return data || { charges: [], payments: [] };
}

async function saveBillingData(data) {
  await t.set('card', 'shared', 'billingData', data);
}

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

function renderLogs(data) {
  const chargesDiv = document.getElementById('charges-log');
  const paymentsDiv = document.getElementById('payments-log');

  if (data.charges.length === 0) {
    chargesDiv.innerHTML = '<em>No charges recorded</em>';
  } else {
    chargesDiv.innerHTML = data.charges.map(c =>
      `<div class="log-entry">${escapeHTML(c.date)} — <strong>${escapeHTML(c.type || 'N/A')}</strong> — $${parseFloat(c.amount).toFixed(2)}</div>`
    ).join('');
  }

  if (data.payments.length === 0) {
    paymentsDiv.innerHTML = '<em>No payments recorded</em>';
  } else {
    paymentsDiv.innerHTML = data.payments.map(p =>
      `<div class="log-entry">${escapeHTML(p.date)} — $${parseFloat(p.amount).toFixed(2)}</div>`
    ).join('');
  }
}

async function addCharge(type, date, amount) {
  const data = await loadBillingData();
  data.charges.push({ type, date, amount });
  await saveBillingData(data);
  return data;
}

async function addPayment(date, amount) {
  const data = await loadBillingData();
  data.payments.push({ date, amount });
  await saveBillingData(data);
  return data;
}

function setupFormHandlers() {
  const chargeForm = document.getElementById('charge-form');
  chargeForm.addEventListener('submit', async e => {
    e.preventDefault();
    const type = document.getElementById('charge-type').value;
    const date = document.getElementById('charge-date').value;
    const amount = parseFloat(document.getElementById('charge-amount').value);

    if (!date || isNaN(amount) || amount <= 0) {
      alert('Please complete all charge fields correctly.');
      return;
    }

    const updatedData = await addCharge(type, date, amount);
    renderLogs(updatedData);
    alert('Charge added successfully!');
    chargeForm.reset();
    t.notifyParent('billingDataChanged');
  });

  const paymentForm = document.getElementById('payment-form');
  paymentForm.addEventListener('submit', async e => {
    e.preventDefault();
    const date = document.getElementById('payment-date').value;
    const amount = parseFloat(document.getElementById('payment-amount').value);

    if (!date || isNaN(amount) || amount <= 0) {
      alert('Please complete all payment fields correctly.');
      return;
    }

    const updatedData = await addPayment(date, amount);
    renderLogs(updatedData);
    alert('Payment recorded successfully!');
    paymentForm.reset();
    t.notifyParent('billingDataChanged');
  });
}

async function init() {
  const data = await loadBillingData();
  renderLogs(data);
  setupFormHandlers();
}

document.addEventListener('DOMContentLoaded', init);
