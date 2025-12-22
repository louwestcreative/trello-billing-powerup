const t = TrelloPowerUp.iframe();

async function loadBillingData() {
  const data = await t.get('card', 'shared', 'billingData');
  return data || { charges: [], payments: [] };
}

function calculateBalance(data) {
  const totalCharges = data.charges.reduce((sum, c) => sum + (parseFloat(c.amount) || 0), 0);
  const totalPayments = data.payments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
  return totalCharges - totalPayments;
}

function formatCurrency(amount) {
  return `$${amount.toFixed(2)}`;
}

async function render() {
  const data = await loadBillingData();
  const balance = calculateBalance(data);

  document.getElementById('balance-display').textContent = `Balance Owed: ${formatCurrency(balance)}`;

  const chargesSummary = data.charges.length > 0
    ? data.charges.map(c => `${c.date} - ${c.type || 'N/A'} - ${formatCurrency(parseFloat(c.amount) || 0)}`).join('<br>')
    : 'No charges';
  document.getElementById('charges-summary').innerHTML = `<h3>Charges</h3>${chargesSummary}`;

  const paymentsSummary = data.payments.length > 0
    ? data.payments.map(p => `${p.date} - ${p.type || 'N/A'} - ${formatCurrency(parseFloat(p.amount) || 0)}`).join('<br>')
    : 'No payments';
  document.getElementById('payments-summary').innerHTML = `<h3>Payments</h3>${paymentsSummary}`;

  t.sizeTo(document.body);
}

t.render(() => {
  render();
  t.on('modal:close', async e => {
    if (e && e.refresh) {
      await render();
    }
  });
});
