TrelloPowerUp.initialize({
  'card-buttons': (t, opts) => [{
    text: 'Billing',
    callback: t => t.modal({
      url: 'https://louwestcreative.github.io/trello-billing-powerup/client.html',
      height: 420,
      title: 'Billing'
    })
  }]
});
