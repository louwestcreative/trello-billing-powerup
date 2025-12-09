window.TrelloPowerUp.initialize({
  'card-badges': function(t) {
    return t.get('card', 'shared', 'billingData')
      .then(data => {
        data = data || { charges: [], payments: [] };
        const totalCharges = (data.charges || []).reduce((s, c) => s + (parseFloat(c.amount) || 0), 0);
        const totalPayments = (data.payments || []).reduce((s, p) => s + (parseFloat(p.amount) || 0), 0);
        const balance = totalCharges - totalPayments;
        if (isNaN(balance)) return [];
        return [{
          text: `$${balance.toFixed(2)}`,
          color: balance > 0 ? 'red' : 'green',
          refresh: 30
        }];
      })
      .catch(() => []);
  },

  'card-back': function(t) {
    return {
      url: t.signUrl('./billing.html'),
      height: 600
    };
  },

  'callback': {
    'card-update': function(t) {
      return Promise.all([
        t.card('id', 'name', 'labels'),
        t.get('card', 'shared', 'billingData')
      ]).then(([cardObj, data]) => {
        const labels = (cardObj && cardObj.labels) || [];
        const labelNames = labels.map(l => (l && l.name) ? l.name : '');

        data = data || { charges: [], payments: [], hourlyRates: {}, county: null };

        let changed = false;

        // GAL automatic one-time charges (only add if not already present)
        const pierceGalLabels = ['Pierce GAL', 'Pierce MG GAL'];
        const kitsapGalLabels = ['Kitsap GAL', 'Kitsap MG GAL'];

        const hasPierceGal = labelNames.some(n => pierceGalLabels.includes(n));
        const hasKitsapGal = labelNames.some(n => kitsapGalLabels.includes(n));

        if (hasPierceGal && !data.charges.some(c => c.type === 'Default Pierce GAL Charge')) {
          data.charges.push({
            id: `ch_${Date.now()}_piercegal`,
            type: 'Default Pierce GAL Charge',
            date: new Date().toISOString().slice(0,10),
            amount: 2000
          });
          changed = true;
        }

        if (hasKitsapGal && !data.charges.some(c => c.type === 'Default Kitsap GAL Charge')) {
          data.charges.push({
            id: `ch_${Date.now()}_kitsapgal`,
            type: 'Default Kitsap GAL Charge',
            date: new Date().toISOString().slice(0,10),
            amount: 4000
          });
          changed = true;
        }

        // CV hourly rates detection (used in billing UI)
        // Pierce CV => $125/hr, Kitsap CV => $200/hr
        if (labelNames.includes('Pierce CV')) {
          data.hourlyRates = data.hourlyRates || {};
          if (data.hourlyRates.cvPierce !== 125) {
            data.hourlyRates.cvPierce = 125;
            changed = true;
          }
        }
        if (labelNames.includes('Kitsap CV')) {
          data.hourlyRates = data.hourlyRates || {};
          if (data.hourlyRates.cvKitsap !== 200) {
            data.hourlyRates.cvKitsap = 200;
            changed = true;
          }
        }

        // store county (Pierce or Kitsap) if detected (helps UI)
        const isPierce = labelNames.some(n => /pierce/i.test(n));
        const isKitsap = labelNames.some(n => /kitsap/i.test(n));
        const county = isPierce ? 'Pierce' : (isKitsap ? 'Kitsap' : null);
        if (county && data.county !== county) {
          data.county = county;
          changed = true;
        }

        if (changed) {
          return t.set('card', 'shared', 'billingData', data);
        }
        return;
      }).catch(err => {
        console.error('card-update callback error:', err);
      });
    }
  }
});
