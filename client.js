TrelloPowerUp.initialize({
  'card-buttons': function(t, opts) {
    return [{
      text: 'Billing',
      callback: function(t) {
        return t.modal({
          url: 'https://louwestcreative.github.io/trello-billing-powerup/client.html',
          height: 420,
          title: 'Billing'
        });
      }
    }];
  }
});
