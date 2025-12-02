window.TrelloPowerUp.initialize({
  // Add buttons on the card
  'card-buttons': function(t, options) {
    return [{
      icon: 'https://cdn-icons-png.flaticon.com/512/126/126510.png', // Example icon URL
      text: 'Add Payment',
      callback: function(t) {
        return t.popup({
          title: 'Add a Payment',
          url: 'https://louwestcreative.github.io/trello-billing-powerup/payment-entry.html',
          height: 300,
        });
      }
    }];
  },

  // Add badges on the card showing summary info
  'card-badges': function(t, options) {
    return t.get('card', 'shared', 'billingData')
      .then(function(billingData) {
        if (!billingData || !billingData.totalOwed) {
          return [];
        }
        return [{
          text: `Owed: $${billingData.totalOwed}`,
          color: billingData.totalOwed > 0 ? 'red' : 'green',
          refresh: 10, // refresh badge every 10 seconds
        }];
      });
  }
});
