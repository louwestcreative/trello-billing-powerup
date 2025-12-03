/* payment-log.js */

const t = TrelloPowerUp.iframe();

async function renderPayments() {
  const payments = await t.get('card', 'shared', 'payments') || [];
  const container = document.getElementById('payments');

  if (payments.length === 0) {
    container.innerHTML = '<p>No payments recorded yet.</p>';
    return;
  }

  container.innerHTML = payments
    .map(p => {
      const payDate = new Date(p.date).toLocaleDateString();
      const loggedAt = new Date(p.loggedAt).toLocaleString();
      return `
        <div class="payment-entry">
          <div><strong>Type:</strong> ${p.type}</div>
          <div><strong>Amount:</strong> $${p.amount.toFixed(2)}</div>
          <div><strong>Payment Date:</strong> ${payDate}</div>
          <div><small>Logged at: ${loggedAt}</small></div>
        </div>
      `;
    })
    .join('');
}

document.addEventListener('DOMContentLoaded', renderPayments);
