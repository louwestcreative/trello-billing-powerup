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
    const data = awa
