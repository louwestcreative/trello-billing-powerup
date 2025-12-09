const BASE_URL = "https://louwestcreative.github.io/trello-billing-powerup/";

window.TrelloPowerUp.initialize({
  "card-badges": function(t) {
    return t.get('card', 'shared', 'billingData')
      .then(function(billingData) {
        if (!billingData) billingData = { charges: [], payments: [] };

        const totalCharged = billingData.charges.reduce((sum, c) => sum + parseFloat(c.amount || 0), 0);
        const totalPaid = billingData.payments.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
        const balance = totalCharged - totalPaid;

        return [{
          text: `$${balance.toFixed(2)}`,
          color: balance > 0 ? 'red' : 'green',
          callback: function(t) {
            return t.popup({
              title: 'Billing Details',
              url: BASE_URL + 'billing.html',
              height: 350
            });
          }
        }];
      });
  }
});
