const t = TrelloPowerUp.iframe();

(async function init() {
  let data = await t.get('card', 'shared', 'billingData');
  if (!data) {
    data = { charges: [], payments: [], hourlyRates: {}, totalOwed: 0 };
  }
  render(data);
})();

function render(data) {
  const root = document.getElementById('billing-root');

  function formatDate(d) {
    if (!d) return '';
    const dateObj = new Date(d);
    if (isNaN(dateObj)) return d;
    return dateObj.toLocaleDateString();
  }

  const chargesRows = (data.charges || []).map(c => `
    <tr>
      <td>${c.type}</td>
      <td>${formatDate(c.date)}</td>
      <td>$${c.amount.toFixed(2)}</td>
    </tr>
  `).join('');

  const paymentsRows = (data.payments || []).map(p => `
    <tr>
      <td>${formatDate(p.date)}</td>
      <td>$${p.amount.toFixed(2)}</td>
    </tr>
  `).join('');

  const standardTypes = ['Retainer', 'Added Fees', 'Testimony'];
  const hourlyRates = data.hourlyRates || {};
  const hourlyTypes = Object.entries(hourlyRates).map(([label, rate]) => `${label} Hourly`);

  const allChargeTypes = [...standardTypes, ...hourlyTypes];

  const chargeTypeOptions = allChargeTypes.map(type => `<option value="${type}">${type}</option>`).join('');

  const totalCharges = (data.charges || []).reduce((sum, c) => sum + c.amount, 0);
  const totalPayments = (data.payments || []).reduce((sum, p) => sum + p.amount, 0);
  const balance = totalCharges - totalPayments;

  root.innerHTML = `
    <div class="section">
      <h3>Add Charge</h3>
      <label for="charge-type">Charge Type</label>
      <select id="charge-type">${chargeTypeOptions}</select>
      <label for="charge-date">Date</label>
      <input type="date" id="charge-date" />
      <label for="charge-amount">Amount</label>
      <input type="number" id="charge-amount" step="0.01" />
      <button id="add-charge">Add Charge</button>
    </div>

    <div class="section">
      <h3>Record Payment</h3>
      <label for="payment-date">Date</label>
      <input type="date" id="payment-date" />
      <label for="payment-amount">Amount</label>
      <input type="number" id="payment-amount" step="0.01" />
      <button id="add-payment">Add Payment</button>
    </div>

    <div class="section">
      <h3>Summary</h3>
      <p><strong>Total Charges:</strong> $${totalCharges.toFixed(2)}</p>
      <p><strong>Total Payments:</strong> $${totalPayments.toFixed(2)}</p>
      <p><strong>Balance Owed:</strong> $${balance.toFixed(2)}</p>
    </div>

    <div class="section">
      <h3>Charges Log</h3>
      <table>
        <thead>
          <tr><th>Type</th><th>Date</th><th>Amount</th></tr>
        </thead>
        <tbody>${chargesRows}</tbody>
      </table>
    </div>

    <div class="section">
      <h3>Payments Log</h3>
      <table>
        <thead>
          <tr><th>Date</th><th>Amount</th></tr>
        </thead>
        <tbody>${paymentsRows}</tbody>
      </table>
    </div>
  `;

  document.getElementById('add-charge').onclick = () => addCharge(data);
  document.getElementById('add-payment').onclick = () => addPayment(data);
}

async function addCharge(data) {
  const type = document.getElementById('charge-type').value;
  const date = document.getElementById('charge-date').value || new Date().toISOString().slice(0,10);
  let amount = parseFloat(document.getElementById('charge-amount').value);

  if (!type) {
    alert('Please select a charge type.');
    return;
  }
  if (!amount || amount <= 0) {
    alert('Please enter a valid positive amount.');
    return;
  }

  data.charges.push({ type, date, amount });

  await t.set('card', 'shared', 'billingData', data);
  render(data);
}

async function addPayment(data) {
  const date = document.getElementById('payment-date').value || new Date().toISOString().slice(0,10);
  let amount = parseFloat(document.getElementById('payment-amount').value);

  if (!amount || amount <= 0) {
    alert('Please enter a valid positive amount.');
    return;
  }

  data.payments.push({ date, amount });

  await t.set('card', 'shared', 'billingData', data);
  render(data);
}
