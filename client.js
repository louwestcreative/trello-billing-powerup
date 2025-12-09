TrelloPowerUp.initialize({
  'card-badges': function(t) {
    return t.get('card', 'shared', 'billingData').then(data => {
      if (!data) return [];

      let totalCharges = (data.charges || []).reduce((sum, c) => sum + c.amount, 0);
      let totalPayments = (data.payments || []).reduce((sum, p) => sum + p.amount, 0);
      let balance = totalCharges - totalPayments;

      if (balance <= 0) return [];

      return [{
        text: `$${balance.toFixed(2)} owed`,
        color: 'red'
      }];
    });
  },

  'card-buttons': function(t) {
    return [{
      text: 'Billing Panel',
      callback: function(t) {
        return t.popup({
          title: 'Billing',
          url: 'https://louwestcreative.github.io/trello-billing-powerup/billing.html',
          height: 500
        });
      }
    }];
  },

  'card-detail-badges': function(t) {
    return t.get('card', 'shared', 'billingData').then(data => {
      if (!data) return [];

      return [
        {
          title: 'Charges',
          text: `${(data.charges || []).length} charges`
        },
        {
          title: 'Payments',
          text: `${(data.payments || []).length} payments`
        }
      ];
    });
  },

  'callback': {
    'card-update': function(t) {
      return Promise.all([
        t.get('card', 'labels'),
        t.get('card', 'shared', 'billingData')
      ]).then(([labels, data]) => {
        data = data || { charges: [], payments: [], totalOwed: 0 };

        const label
