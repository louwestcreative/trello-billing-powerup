/* global TrelloPowerUp */

const ICON_URL = 'https://louwestcreative.github.io/trello-billing-powerup/coin.png';
const GRAY_ICON = 'https://cdn-icons-png.flaticon.com/512/565/565422.png';
const BLACK_ICON = 'https://cdn-icons-png.flaticon.com/512/10024/10024082.png';
const CLOCK_ICON = 'https://cdn-icons-png.flaticon.com/512/2088/2088617.png';

// Label-based auto-charge configuration
const LABEL_CHARGES = {
  'Pierce GAL': 1875,
  'Pierce MG GAL': 1875,
  'Kitsap GAL': 4000,
  'Kitsap MG GAL': 4000
};

// Default hourly rates by case type
const HOURLY_RATES = {
  'Pierce GAL': 125,
  'Pierce MG GAL': 125,
  'Kitsap GAL': 200,
  'Kitsap MG GAL': 200,
  'Pierce CV': 200,
  'Kitsap CV': 75
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

function formatHours(hours) {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

async function getCardData(t) {
  const charges = await t.get('card', 'shared', 'charges', []);
  const payments = await t.get('card', 'shared', 'payments', []);
  const togglHours = await t.get('card', 'shared', 'togglHours', 0);
  const lastTogglSync = await t.get('card', 'shared', 'lastTogglSync', null);
  return { charges, payments, togglHours, lastTogglSync };
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

async function getHourlyRate(t) {
  const customRate = await t.get('card', 'shared', 'hourlyRate');
  if (customRate) return customRate;
  
  const card = await t.card('labels');
  for (const label of card.labels) {
    if (HOURLY_RATES[label.name]) {
      return HOURLY_RATES[label.name];
    }
  }
  return 100; // Default rate
}

// Power-Up capabilities
TrelloPowerUp.initialize({
  
  // Card badges - show balance and hours on card front
  'card-badges': async function(t) {
    await autoChargeForLabels(t);
    const balance = await calculateBalance(t);
    const { togglHours } = await getCardData(t);
    
    const badges = [];
    
    // Balance badge
    let color = 'blue';
    let icon = GRAY_ICON;
    
    if (balance > 0) {
      color = 'red';
      icon = BLACK_ICON;
    } else if (balance < 0) {
      color = 'green';
      icon = ICON_URL;
    }
    
    badges.push({
      text: formatCurrency(Math.abs(balance)),
      color: color,
      icon: icon
    });
    
    // Hours badge (if there are tracked hours)
    if (togglHours > 0) {
      badges.push({
        text: formatHours(togglHours),
        color: 'purple',
        icon: CLOCK_ICON
      });
    }
    
    return badges;
  },
  
  // Card buttons - add buttons to card back
  'card-buttons': function(t) {
    return [{
      icon: ICON_URL,
      text: 'Billing Details',
      callback: function(t) {
        return t.popup({
          title: 'Billing Tracker',
          url: './modal.html',
          height: 600
        });
      }
    }, {
      icon: CLOCK_ICON,
      text: 'Sync Toggl Hours',
      callback: async function(t) {
        return t.popup({
          title: 'Toggl Time Tracking',
          url: './toggl-sync.html',
          height: 400
        });
      }
    }];
  },
  
  // Card detail badges - show detailed info on card back
  'card-detail-badges': async function(t) {
    await autoChargeForLabels(t);
    const { charges, payments, togglHours, lastTogglSync } = await getCardData(t);
    const balance = await calculateBalance(t);
    const hourlyRate = await getHourlyRate(t);
    
    const totalCharges = charges.reduce((sum, c) => sum + c.amount, 0);
    const totalPayments = payments.reduce((sum, p) => sum + p.amount, 0);
    
    const badges = [{
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
    
    // Add time tracking badges if hours exist
    if (togglHours > 0) {
      badges.push({
        title: 'Tracked Hours',
        text: formatHours(togglHours),
        color: 'purple'
      });
      
      badges.push({
        title: 'Time Value',
        text: formatCurrency(togglHours * hourlyRate),
        color: 'orange'
      });
    }
    
    if (lastTogglSync) {
      badges.push({
        title: 'Last Sync',
        text: formatDate(lastTogglSync),
        color: 'blue'
      });
    }
    
    return badges;
  },
  
  // Board buttons - add analytics dashboard
  'board-buttons': function(t) {
    return [{
      icon: 'https://cdn-icons-png.flaticon.com/512/2920/2920277.png',
      text: 'Case Analytics',
      callback: function(t) {
        return t.modal({
          title: 'Case Analytics & Summary',
          url: './analytics.html',
          fullscreen: true
        });
      }
    }];
  },
  
  // Settings
  'show-settings': function(t) {
    return t.popup({
      title: 'Billing Tracker Settings',
      url: './settings.html',
      height: 300
    });
  }
  
});
