/* client.js */

var t = TrelloPowerUp.iframe();

document.addEventListener('DOMContentLoaded', async function () {
  // Load and display payment history when modal loads
  const payments = await t.get('card', 'shared', 'payments') || [];
  const paymentList = document.getElementById('payment-list');

  if (payments.length === 0) {
    paymentList.innerHTML = '<p>No payments recorded yet.</p>';
  } else {
    paymentList.innerHTML = payments
      .map(p => {
        const payDate = new Date(p.date).toLocaleDateString();
        const loggedDate = new Date(p.loggedAt).toLocaleString();
        return `
          <div style="border-bottom:1px solid #ccc; padding:5px 0;">
            <strong>Type:</strong> ${p.type} <br/>
            <strong>Amount:</strong> $${p.amount.toFixed(2)} <br/>
            <strong>Payment Date:</strong> ${payDate} <br/>
            <small><em>Logged: ${loggedDate}</em></small>
          </div>
        `;
      })
      .join('');
  }
});

// Listen for form submission from payment-entry modal
window.addEventListener('message', async (event) => {
  if (event.data && event.data.type === 'new-payment') {
    let payments = await t.get('card', 'shared', 'payments') || [];
    payments.push(event.data.payment);
    await t.set('card', 'shared', 'payments', payments);
    t.closeModal();
  }
});
