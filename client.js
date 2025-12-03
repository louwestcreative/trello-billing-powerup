/* client.js */

TrelloPowerUp.initialize({

  // Card Buttons - includes the "Add Payment" button to open modal
  'card-buttons': function (t, opts) {
    return [{
      icon: 'https://cdn-icons-png.flaticon.com/512/1828/1828817.png', // payment icon or your custom icon URL
      text: 'Add Payment',
      callback: function (t) {
        return t.modal({
          url: t.signUrl('./payment-entry.html'),
          title: 'Add Payment',
          height: 370,
        });
      }
    }];
  },

  // Card Badges (optional - show count of payments)
  'card-badges': async function (t, opts) {
    const payments = await t.get('card', 'shared', 'payments') || [];
    return payments.length > 0 ? [{
      text: `Payments: ${payments.length}`,
      color: 'green',
      refresh: 10 // refresh badge every 10 seconds
    }] : [];
  },

  // Card Back Section to show payment log
  'card-back-section': async function (t, opts) {
    return {
      title: 'Payment Log',
      icon: 'https://cdn-icons-png.flaticon.com/512/1828/1828817.png',
      content: {
        type: 'iframe',
        url: t.signUrl('./payment-log.html'), // We'll create this below
        height: 300
      }
    };
  },

});

// Listen for messages from modal to receive new payment data
window.addEventListener('message', async function (event) {
  if (event.data && event.data.type === 'new-payment') {
    const t = TrelloPowerUp.iframe();

    let payments = await t.get('card', 'shared', 'payments') || [];
    payments.push(event.data.payment);
    await t.set('card', 'shared', 'payments', payments);

    // Close modal after saving
    t.closeModal();
  }
});
