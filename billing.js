const t = TrelloPowerUp.iframe();

(async function init() {
  let data = await t.get('card', 'shared', 'billingData');
  if (!data) {
    data = { charges: [], payments: [], totalOwed: 0 };
  }
  render(data);
})();

function render(data) {
  const root = document.getElementById('billing-root');

  function formatDate(d) {
    return d ? new Date(d).toLocaleDateString() : '';
  }

  const chargesHTML = data.charges.map((c, i) => `
    <tr>
      <td>${c.type}</td>
      <td>${formatDate(c.date)}</td>
      <td>$${c.amount.toFixed(2)}</td>
    </tr>`).join('');

  const paymentsHTML = data.payments.map((p, i) => `
    <tr>
      <td>${formatDate(p.date)}</td>
      <td>$${p.amount.toFixed(2)}</td>
    </tr>`).join('');

  root.innerHTML = `
    <div class="section">
      <h3>Add Charge</h3>
      <label>Charge Type</label>
      <select id="charge-type">
        <option value="Retainer">Retainer</option>
        <option value="Added Fees">Added Fees</option>
        <option value="Testimony">Testimony</option>
      </select>
      <label>Date</label>
      <input id="charge-date" type="date" />
      <label>Amount</label>
      <input id="charge-amount" type="number" step="0.01" />
      <button id="add-charge">Add Charge</button>
    </div>

    <div class="section">
      <h3>Record Payment</h3>
      <label>Date</label>
      <input id="payment-date" type="date" />
      <label>Amount</label>
      <input id="payment-amount" type="number" step="0.01" />
      <button id="add-payment">Add Payment</button>
    </div>

    <div class="section">
      <h3>Summary</h3>
      <p><strong>Total Owed:</strong> $${data.totalOwed.toFixed(2)}</p>
    </div>

    <div class="section">
      <h3>Charges Log</h3>
      <table>
        <thead>
          <tr><th>Type</th><th>Date</th><th>Amount</th></tr>
        </thead>
        <tbody>${chargesHTML}</tbody>
      </table>
    </div>

    <div class="section">
      <h3>Payments Log</h3>
      <table>
        <thead>
          <tr><th>Date</th><th>Amount</th></tr>
        </thead>
        <tbody>${paymentsHTML}</tbody>
      </table>
    </div>
  `;

  document.getElementById('add-charge').onclick = () => saveCharge(data);
  document.getElementById('add-payment').onclick = () => savePayment(data);
}

async function saveCharge(data) {
  const type = document.getElementById('charge-type').value;
  const dateInput = document.getElementById('charge-date').value;
  const amount = parseFloat(document.getElementById('charge-amount').value);

  if (!amount || amount <= 0) return;

  const date = dateInput || new Date().toISOString().slice(0,10);

  data.charges.push({ type, date, amount });
  data.totalOwed += amount;

  await t.set('card', 'shared', 'billingData', data);
  t.closePopup();
}

async function savePayment(data) {
  const dateInput = document.getElementById('payment-date').value;
  const amount = parseFloat(document.getElementById('payment-amount').value);

  if (!amount || amount <= 0) return;

  const date = dateInput || new Date().toISOString().slice(0,10);

  data.payments.push({ date, amount });
  data.totalOwed -= amount;

  await t.set('card', 'shared', 'billingData', data);
  t.closePopup();
}
