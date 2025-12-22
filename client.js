var t = TrelloPowerUp.iframe();

t.initialize({
  'card-back-section': function(t, opts) {
    return {
      title: 'Billing Info',
      icon: 'https://louwestcreative.github.io/trello-billing-powerup/coin.png',
      content: {
        type: 'iframe',
        url: t.signUrl('./index.html'),
        height: 200
      }
    };
  }
});
