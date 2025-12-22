const t = TrelloPowerUp.iframe();

function formatCurrency(amount) {
  return `$${amount.toFixed(2)}`;
}

async function loadAllCardData() {
  const cards = await t.cards('all');
  let totalCharges = 0;
  let totalPayments = 0;

  for (const card of cards) {
    const data = await t.get(card.id, 'shared', 'billingData') || { charges: [], payments: [] };
    totalCharges += data.charges.reduce((sum, c) => sum + (parseFloat(c.amount) || 0), 0);
    totalPayments += data.payments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
  }

  return { totalCharges, totalPayments };
}

async function render() {
  const { totalCharges, totalPayments } = await loadAllCardData();
  const balance = totalCharges - totalPayments;

  const summaryDiv = document.getElementById('summary');
  summaryDiv.innerHTML = `
    <p>Total Charges: ${formatCurrency(totalCharges)}</p>
    <p>Total Payments: ${formatCurrency(totalPayments)}</p>
    <p><strong>Balance Owed: ${formatCurrency(balance)}</strong></p>
  `;

  t.sizeTo(document.body);
}

t.render(() => {
  render();
});
