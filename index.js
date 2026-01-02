/* global TrelloPowerUp */

// Hourly rates by label
const HOURLY_RATES = {
  'Kitsap GAL': 200,
  'Pierce GAL': 125,
  'Kitsap MG GAL': 200,
  'Pierce CV': 126,
  'Kitsap CV': 75,
  'Pierce MG GAL': 125
};

// Auto-charge amounts for GAL labels
const AUTO_CHARGES = {
  'Pierce GAL': 2000,
  'Pierce MG GAL': 2000,
  'Kitsap GAL': 4000,
  'Kitsap MG GAL': 4000
};

var GRAY_ICON = './coin.png';

TrelloPowerUp.initialize({
  'board-buttons': function(t, options) {
    return [{
      icon: GRAY_ICON,
      text: 'Configure Toggl',
      callback: function(t) {
        return t.popup({
          title: 'Toggl Configuration',
          url: './toggl-config.html',
          height: 150
        });
      }
    }, {
      icon: GRAY_ICON,
      text: 'Sync All Hours',
      callback: function(t) {
        return t.modal({
          url: './toggl-sync.html',
          title: 'Sync Toggl Hours',
          fullscreen: true
        });
      }
    }];
  },
  
  'card-badges': function(t, options) {
    return Promise.all([
      t.get('card', 'shared', 'charges', []),
      t.get('card', 'shared', 'payments', [])
    ])
    .then(function([charges, payments]) {
      var totalCharged = charges.reduce((sum, c) => sum + c.amount, 0);
      var totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
      var balance = totalCharged - totalPaid;
      
      return [{
        icon: GRAY_ICON,
        text: '$' + balance.toFixed(2),
        color: balance > 0 ? 'red' : 'green'
      }];
    });
  },
  
  'card-buttons': function(t, options) {
    return [{
      icon: GRAY_ICON,
      text: 'Billing & Hours',
      callback: function(t) {
        return t.modal({
          url: './modal.html',
          fullscreen: false,
          title: 'Billing & Time Tracking'
        });
      }
    }];
  },
  
  'card-back-section': function(t, options) {
    return {
      title: 'Time Tracking',
      icon: GRAY_ICON,
      content: {
        type: 'iframe',
        url: t.signUrl('./toggl-section.html'),
        height: 300
      }
    };
  },
  
  'on-enable': function(t) {
    return t.modal({
      url: './auth.html',
      fullscreen: false,
      title: 'Setup Billing Power-Up'
    });
  }
}, {
  appKey: 'adb19533ff2ba076e2bcc1b3eed61e7e',
  appName: 'Billing & Time Tracking'
});
