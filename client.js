// client.js

TrelloPowerUp.initialize({
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
            url: t.signUrl('./modal.html?type=charge'),
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
            url: t.signUrl('./modal.html?type=payment'),
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
    const balance = (data.charges.reduce((sum, c) => sum + (parseFloat(c.amount) || 0), 0)) -
                    (data.payments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0));
    return [{
      text: `Balance: $${balance.toFixed(2)}`,
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
          url: t.signUrl('./board-summary.html'),
          title: 'Billing Summary',
          height: 400,
          fullscreen: false
        });
      }
    }];
  }
});
