TrelloPowerUp.initialize({
  'card-buttons': function(t) {
    return [{
      icon: 'https://cdn-icons-png.flaticon.com/512/33/33622.png',
      text: 'Add Payment',
      callback: function(t) {
        return t.modal({
          url: './payment-entry.html',
          title: 'Add Payment',
          height: 300
        });
      }
    }];
  },

  'card-badges': function(t) {
    return t.get('card', 'shared', 'payments')
      .then(function(payments) {
        payments = payments || [];
        let total = payments.reduce((acc, p) => acc + (p.amount || 0), 0);
        return [{
          text: '$' + total.toFixed(2),
          color: total > 0 ? 'green' : 'red'
        }];
      })
      .catch(function(err) {
        console.error('Error fetching payments:', err);
        return [];
      });
  },

  // Add more capabilities as needed
});
