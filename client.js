const t = TrelloPowerUp.iframe();

function loadBillingData() {
  return t.get('card', 'shared', 'billingData').then(data => data || { charges: [], payments: [], autoChargesDone: false });
}

function saveBillingData(data) {
  return t.set('card', 'shared', 'billingData', data);
}

function notifyParent() {
  t.notifyParent('billingDataChanged');
}

// Get card labels
function getCardLabelNames() {
  return t.card('labels').then(card => card.labels.map(label => label.name));
}

// Automatically add GAL charges if relevant labels present and not already added
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

function clearForm(form) {
  form.reset();
}

function validateChargeForm(type, date, amount) {
  if (!type || !date || isNaN(amount) || amount <= 0) {
    alert('Please complete all charge fields correctly.');
    return false;
  }
  return true;
}

function validatePaymentForm(date, amount) {
  if (!date || isNaN(amount) || amount <= 0) {
    alert('Please complete all payment fields correctly.');
    return false;
  }
  return true;
}

function init() {
  // Disable charge type select if card is not GAL (based on labels)
  getCardLabelNames().then(labels => {
    const galLabels = ['Pierce GAL', 'Pierce MG GAL', 'Kitsap GAL', 'Kitsap MG GAL'];
    const isGAL = labels.some(l => galLabels.includes(l));
    const chargeTypeSelect = document.getElementById('charge-type');
    if (!isGAL) {
      chargeTypeSelect.disabled = true;
      chargeTypeSelect.value = '';
      chargeTypeSelect.innerHTML = '<option>No GAL labels on card</option>';
    }
  });

  // Apply auto charges on load
  loadBillingData()
    .then(applyAutoCharges)
    .then(() => {
      // Nothing else needed on load here
    });

  // Charge form submit handler
  document.getElementById('charge-form').addEventListener('submit', e => {
    e.preventDefault();
    const type = document.getElementById('charge-type').value;
    const date = document.getElementById('charge-date').value;
    const amount = parseFloat(document.getElementById('charge-amount').value);

    if (!validateChargeForm(type, date, amount)) return;

    loadBillingData().then(data => {
      data.charges.push({ type, date, amount });
      return saveBillingData(data);
    }).then(() => {
      alert('Charge added successfully!');
      clearForm(e.target);
      notifyParent();
    });
  });

  // Payment form submit handler
  document.getElementById('payment-form').addEventListener('submit', e => {
    e.preventDefault();
    const date = document.getElementById('payment-date').value;
    const amount = parseFloat(document.getElementById('payment-amount').value);

    if (!validatePaymentForm(date, amount)) return;

    loadBillingData().then(data => {
      data.payments.push({ type: 'GAL Payment', date, amount });
      return saveBillingData(data);
    }).then(() => {
      alert('Payment recorded successfully!');
      clearForm(e.target);
      notifyParent();
    });
  });
}

// Card Badge callback to show current balance
async function cardBadgeCallback(t, options) {
  const data = await loadBillingData();
  // Calculate balance: sum charges - sum payments
  const sumCharges = data.charges.reduce((acc, c) => acc + parseFloat(c.amount || 0), 0);
  const sumPayments = data.payments.reduce((acc, p) => acc + parseFloat(p.amount || 0), 0);
  const balance = sumCharges - sumPayments;

  return {
    text: `$${balance.toFixed(2)} owed`,
    color: balance > 0 ? 'red' : 'green',
    refresh: 10
  };
}

document.addEventListener('DOMContentLoaded', init);

// Export for manifest badge callback
window.cardBadgeCallback = cardBadgeCallback;
