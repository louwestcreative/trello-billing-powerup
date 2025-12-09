window.TrelloPowerUp.initialize({
  // Card badges show the balance owed (charges - payments)
  'card-badges': function(t, opts) {
    return t.get('card', 'shared', 'billingData')
      .then(data => {
        data = data || { charges: [], payments: [] };

        const totalCharges = data.charges.reduce((sum, c) => sum + (parseFloat(c.amount) || 0), 0);
        const totalPayments = data.payments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
        const balance = totalCharges - totalPayments;

        return [{
          text: `$${balance.toFixed(2)}`,
          color: balance > 0 ? 'red' : 'green',
          refresh: 30 // refresh badge every 30 seconds
        }];
      })
      .catch(() => {
        // In case of error, don't show badge
        return [];
      });
  },

  // Card back loads the billing.html page from the same directory
  'card-back': function(t, opts) {
    return {
      url: t.signUrl('./billing.html'),  // Ensure URL is signed for Trello security
      height: 600
    };
  }
});
