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
  try {
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
  } catch (err) {
    console.error('Error rendering billing data:', err);
  }
}

t.initialize({
  'card-back-section': function(t, opts) {
    return {
      title: 'Billing Information',
      icon: 'https://cdn-icons-png.flaticon.com/512/263/263115.png',
      content: {
        type: 'iframe',
        url: t.signUrl('./index.html'),
        height: 300
      }
    };
  },

  'card-buttons': function(t, options) {
    return [
      {
        icon: 'https://cdn-icons-png.flaticon.com/512/1828/1828919.png',
        text: 'Add Charge',
        callback: function(t) {
          return t.modal({
            url: './modal.html?type=charge',
            title: 'Add Charge',
            height: 320,
            fullscreen: false
          });
        }
      },
      {
        icon: 'https://cdn-icons-png.flaticon.com/512/1828/1828919.png',
        text: 'Add Payment',
        callback: function(t) {
          return t.modal({
            url: './modal.html?type=payment',
            title: 'Add Payment',
            height: 320,
            fullscreen: false
          });
        }
      }
    ];
  },

  'card-badges': async function(t, options) {
    const data = await t.get('card', 'shared', 'billingData') || { charges: [], payments: [] };
    const balance = calculateBalance(data);

    return [{
      text: `Balance: ${formatCurrency(balance)}`,
      color: balance > 0 ? 'red' : 'green',
      refresh: 10
    }];
  },

  'board-buttons': function(t, opts) {
    return [{
      icon: 'https://cdn-icons-png.flaticon.com/512/1828/1828919.png',
      text: 'Billing Summary',
      callback: function(t) {
        return t.modal({
          url: './board-summary.html',
          title: 'Billing Summary',
          height: 400,
          fullscreen: false
        });
      }
    }];
  }
});

t.render(() => {
  render();
  t.on('modal:close', async (e) => {
    if (e && e.refresh) {
      await render();
    }
  });
});
