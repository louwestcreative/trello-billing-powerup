var t = TrelloPowerUp.iframe();

TrelloPowerUp.initialize({
  'card-buttons': function(t, options) {
    return cardButtonsCallback(t, options);
  },
  'card-badges': function(t, options) {
    return cardBadgesCallback(t, options);
  },
  'card-back-section': function(t, options) {
    return {
      title: 'Billing Info',
      url: 'payment-entry.html',
      height: 250,
    };
  },
});

