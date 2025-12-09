const t = TrelloPowerUp.iframe();

function loadBillingData() {
  return t.get('card', 'shared', 'billingData').then(data => data || { charges: [], payments: [], autoChargesDone: false });
}

function saveBillingData(data) {
  return t.set('card', 'shared', 'billingData', data);
}

function escapeHTML(str) {
  return String(str).replace(/[&<>"']/g, m => ({
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

async function getCardLabelNames() {
  const card = await t.card('labels');
  return card.labels.map(label => label.name);
}

async function applyAutoCharges(data) {
  if (data.autoChargesDone) return data;

  const labels = await getCardLabelNames();
  const pierceGALLabels = ['Pierce GAL', 'Pierce MG GAL'];
  const kitsapGALLabels = ['Kitsap GAL', 'Kitsap MG GAL'];

  const newCharges = [];

  if (labels.some(l => pierceGALLabels.includes(l))) {
    newCharges.push({
      type: 'retainer (auto)',
      date: new Date().toISOString().slice(0, 10),
      amount: 2000,
    });
  }

  if (labels.some(l => kitsapGALLabels.includes(l))) {
    newCharges.push({
      type: 'retainer (auto)',
      date: new Date().toISOString().slice(0, 10),
      amount: 4000,
    });
  }

  data.charges = data.charges.concat(newCharges);
  data.autoChargesDone = true;

  await saveBillingData(data);
  return data;
}

function init() {
  loadBillingData()
    .then(applyAutoCharges)
    .then(renderLogs);
}

document.addEventListener('DOMContentLoaded', init);
