var Promise = TrelloPowerUp.Promise;

TrelloPowerUp.initialize({
  'card-buttons': function(t, options) {
    return [
      {
        icon: "https://louwestcreative.github.io/trello-billing-powerup/icon.png",
        text: "Add Payment",

        callback: function(t) {
          return t.modal({
            title: "Record Payment",
            url: "https://louwestcreative.github.io/trello-billing-powerup/payment-entry.html",
            height: 420
          });
        }
      }
    ];
  },

  'card-badges': function(t, options) {
    return t.get('card', 'shared', 'payment')
      .then(function(payment) {
        if (!payment) return [];
        return [{
          text: `$${payment.amount}`,
          color: "blue"
        }];
      });
  }
});
