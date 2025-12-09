TrelloPowerUp.initialize({
  'card-badges': function (t) {
    return t.get('card', 'shared', 'billingData')
      .then(data => {
        if (!data || !data.totalOwed) return [];
        return [{
          text: `$${data.totalOwed} owed`,
          color: data.totalOwed > 0 ? 'red' : 'green'
        }];
      });
  },

  'card-buttons': function (t) {
    return [{
      text: 'Billing Panel',
      callback: function () {
        return t.popup({
          title: 'Billing',
          url: './billing.html',
          height: 400
        });
      }
    }];
  },

  'card-detail-badges': function (t) {
    return t.get('card', 'shared', 'billingData').then(data => {
      if (!data) return [];
      const charges = data.charges || [];
      const payments = data.payments || [];
      return [
        {
          title: 'Charges',
          text: `${charges.length} charges`,
          callback(t) {
            return t.popup({
              title: 'Charges',
              url: './billing.html',
              height: 400
            });
          }
        },
        {
          title: 'Payments',
          text: `${payments.length} payments`,
          callback(t) {
            return t.popup({
              title: 'Payments',
              url: './billing.html',
              height: 400
            });
          }
        }
      ];
    });
  },

  'callback': {
    'card-update': function (t) {
      return t.get('card', 'labels').then(labels => {
        return t.get('card', 'shared', 'billingData').then(data => {
          data = data || { charges: [], payments: [], totalOwed: 0 };
          let changed = false;

          const labelNames
