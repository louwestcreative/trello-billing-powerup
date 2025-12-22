const t = TrelloPowerUp.iframe();

function getQueryParam(param) {
  const params = new URLSearchParams(window.location.search);
  return params.get(param);
}

async function loadData() {
  const data = await t.get('card', 'shared', 'billingData');
  return data || { charges: [], payments: [] };
}

async function saveData(data) {
  await t.set('card', 'shared', 'billingData', data);
}

async function handleSubmit(event) {
  event.preventDefault();

  const type = getQueryParam('type'); // "charge" or "payment"
  const date = document.getElementById('date').value;
  const typeInput = document.getElementById('type').value.trim();
  const amount = parseFloat(document.getElementById('amount').value);

  if (!date || !typeInput || isNaN(amount)) {
    document.getElementById('status').textContent = 'Please fill all fields correctly.';
    return;
  }

  const data = await loadData();

  if (type === 'charge') {
    data.charges.push({ date, type: typeInput, amount });
  } else if (type === 'payment') {
    data.payments.push({ date, type: typeInput, amount });
  }

  await saveData(data);

  // Close modal and request parent refresh
  t.closeModal({ refresh: true });
}

window.addEventListener('DOMContentLoaded', () => {
  const type = getQueryParam('type');
  document.getElementById('modal-title').textContent = type === 'charge' ? 'Add Charge' : 'Add Payment';

  document.getElementById('billing-form').addEventListener('submit', handleSubmit);
});
