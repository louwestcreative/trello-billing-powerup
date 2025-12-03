/* payment-entry.js */

const t = TrelloPowerUp.iframe();

document.addEventListener('DOMContentLoaded', () => {
  // Default payment date to today
  const dateInput = document.getElementById('date');
  const today = new Date().toISOString().split('T')[0];
  dateInput.value = today;

  document.getElementById('payment-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const type = document.getElementById('type').value;
    const amount = parseFloat(document.getElementById('amount').value);
    const date = document.getElementById('date').value;

    if (!type || isNaN(amount) || amount < 0 || !date) {
      alert('Please fill out all fields correctly.');
      return;
    }

    const payment = {
      type,
      amount,
      date: new Date(date).toISOString(),
      loggedAt: new Date().toISOString()
    };

    // Send payment data to the parent window
    window.parent.postMessage({ type: 'new-payment', payment }, '*');
  });
});
