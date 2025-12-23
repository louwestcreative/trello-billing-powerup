/* global TrelloPowerUp */

const ICON_URL = 'https://louwestcreative.github.io/trello-billing-powerup/coin.png';
const GRAY_ICON = 'https://cdn-icons-png.flaticon.com/512/565/565422.png';
const BLACK_ICON = 'https://cdn-icons-png.flaticon.com/512/10024/10024082.png';

// Label-based auto-charge configuration
const LABEL_CHARGES = {
  'Pierce GAL': 1875,
  'Pierce MG GAL': 1875,
  'Kitsap GAL': 4000,
  'Kitsap MG GAL': 4000
};

// Helper functions
function formatCurrency(amount) {
  return '$' + amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatDate(date) {
  return new Date(date).toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  });
}

async function getCardData(t) {
  const charges = await t.get('card', 'shared', 'charges', []);
  const payments = await t.get('card', 'shared', 'payments', []);
  return { charges, payments };
}

async function calculateBalance(t) {
  const { charges, payments } = await getCardData(t);
  const totalCharges = charges.reduce((sum, c) => sum + c.amount, 0);
  const totalPayments = payments.reduce((sum, p) => sum + p.amount, 0);
  return totalCharges - totalPayments;
}

async function autoChargeForLabels(t) {
  const card = await t.card('labels');
  const charges = await t.get('card', 'shared', 'charges', []);
  
  // Check which labels exist and if they've already been charged
  for (const label of card.labels) {
    const chargeAmount = LABEL_CHARGES[label.name];
    if (chargeAmount) {
      // Check if this label has already been charged
      const alreadyCharged = charges.some(c => 
        c.type === 'Auto-Charge' && c.description === label.name
      );
      
      if (!alreadyCharged) {
        // Add the charge
        charges.push({
          date: new Date().toISOString(),
          type: 'Auto-Charge',
          description: label.name,
          amount: chargeAmount
        });
      }
    }
  }
  
  await t.set('card', 'shared', 'charges', charges);
}

// Power-Up capabilities
TrelloPowerUp.initialize({
  
  // Card badges - show balance on card front
  'card-badges': async function(t) {
    await autoChargeForLabels(t);
    const balance = await calculateBalance(t);
    
    let color = 'blue';
    let icon = GRAY_ICON;
    
    if (balance > 0) {
      color = 'red';
      icon = BLACK_ICON;
    } else if (balance < 0) {
      color = 'green';
      icon = ICON_URL;
    }
    
    return [{
      text: formatCurrency(Math.abs(balance)),
      color: color,
      icon: icon
    }];
  },
  
  // Card buttons - add button to card back
  'card-buttons': function(t) {
    return [{
      icon: ICON_URL,
      text: 'Billing Details',
      callback: function(t) {
        return t.popup({
          title: 'Billing Tracker',
          url: './modal.html',
          height: 500
        });
      }
    }];
  },
  
  // Card detail badges - show detailed info on card back
  'card-detail-badges': async function(t) {
    await autoChargeForLabels(t);
    const { charges, payments } = await getCardData(t);
    const balance = await calculateBalance(t);
    
    const totalCharges = charges.reduce((sum, c) => sum + c.amount, 0);
    const totalPayments = payments.reduce((sum, p) => sum + p.amount, 0);
    
    return [{
      title: 'Total Charges',
      text: formatCurrency(totalCharges),
      color: 'red'
    }, {
      title: 'Total Payments',
      text: formatCurrency(totalPayments),
      color: 'green'
    }, {
      title: 'Balance',
      text: formatCurrency(Math.abs(balance)),
      color: balance > 0 ? 'red' : (balance < 0 ? 'green' : 'blue')
    }];
  },
  
  // Settings
  'show-settings': function(t) {
    return t.popup({
      title: 'Billing Tracker Settings',
      url: './settings.html',
      height: 184
    });
  }
  
});
