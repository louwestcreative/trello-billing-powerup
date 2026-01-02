/* global TrelloPowerUp */

var t = TrelloPowerUp.iframe();

const HOURLY_RATES = {
  'Kitsap GAL': 200,
  'Pierce GAL': 125,
  'Kitsap MG GAL': 200,
  'Pierce CV': 126,
  'Kitsap CV': 75,
  'Pierce MG GAL': 125
};

// Load Toggl integration module
let togglIntegration;
const script = document.createElement('script');
script.src = './toggl-integration.js';
script.onload = function() {
  togglIntegration = window.TogglIntegration;
  loadTogglHours();
};
document.head.appendChild(script);

function getPrimaryLabel(labels) {
  const labelOrder = [
    'Kitsap GAL', 'Pierce GAL', 'Kitsap MG GAL', 
    'Pierce CV', 'Kitsap CV', 'Pierce MG GAL'
  ];
  
  for (let labelName of labelOrder) {
    if (labels.some(l => l.name === labelName)) {
      return labelName;
    }
  }
  return null;
}

async function loadChargesAndPayments() {
  const charges = await t.get('card', 'shared', 'charges', []);
  const payments = await t.get('card', 'shared', 'payments', []);
  
  renderChargesAndPayments(charges, payments);
}

function renderChargesAndPayments(charges, payments) {
  var chargesHTML = '';
  var paymentsHTML = '';
  
  if (charges.length === 0) {
    chargesHTML = '<p style="text-align: center; color: #999;">No charges yet</p>';
  } else {
    charges.forEach(function(charge) {
      var date = new Date(charge.date).toLocaleDateString();
      chargesHTML += '<div class="log-entry">';
      chargesHTML += '<strong>' + charge.type + '</strong>: $' + charge.amount.toFixed(2);
      if (charge.description) {
        chargesHTML += ' - ' + charge.description;
      }
      chargesHTML += '<br><small>' + date + '</small>';
      chargesHTML += '</div>';
    });
  }
  
  if (payments.length === 0) {
    paymentsHTML = '<p style="text-align: center; color: #999;">No payments yet</p>';
  } else {
    payments.forEach(function(payment) {
      var date = new Date(payment.date).toLocaleDateString();
      paymentsHTML += '<div class="log-entry">';
      paymentsHTML += '<strong>Payment</strong>: $' + payment.amount.toFixed(2);
      if (payment.method) {
        paymentsHTML += ' - ' + payment.method;
      }
      paymentsHTML += '<br><small>' + date + '</small>';
      paymentsHTML += '</div>';
    });
  }
  
  document.getElementById('chargesList').innerHTML = chargesHTML;
  document.getElementById('paymentsList').innerHTML = paymentsHTML;
  
  var totalCharged = charges.reduce(function(sum, c) { return sum + c.amount; }, 0);
  var totalPaid = payments.reduce(function(sum, p) { return sum + p.amount; }, 0);
  var balance = totalCharged - totalPaid;
  
  var balanceElement = document.getElementById('balance');
  document.getElementById('totalCharged').textContent = '$' + totalCharged.toFixed(2);
  document.getElementById('totalPaid').textContent = '$' + totalPaid.toFixed(2);
  balanceElement.textContent = '$' + balance.toFixed(2);
  
  balanceElement.className = 'summary-value ' + (balance > 0 ? 'negative' : 'positive');
}

async function loadTogglHours() {
  const togglSection = document.getElementById('togglSection');
  
  if (!togglIntegration) {
    togglSection.innerHTML = '<p style="text-align: center; color: #999;">Loading Toggl integration...</p>';
    return;
  }
  
  try {
    const card = await t.card('name', 'labels');
    const primaryLabel = getPrimaryLabel(card.labels);
    
    if (!primaryLabel) {
      togglSection.innerHTML = '<p style="text-align: center; color: #999;">Add a billing label to track hours</p>';
      return;
    }
    
    const hourlyRate = HOURLY_RATES[primaryLabel];
    const summary = await togglIntegration.getProjectSummary(t, card.name, hourlyRate);
    
    if (!summary) {
      togglSection.innerHTML = `
        <p style="text-align: center; color: #999;">Toggl project not found</p>
        <button id="createTogglBtn" class="mod-primary" style="width: 100%;">Create Toggl Project</button>
      `;
      document.getElementById('createTogglBtn').addEventListener('click', async function() {
        try {
          this.disabled = true;
          this.textContent = 'Creating...';
          await togglIntegration.createProjectForCard(t, card.name, primaryLabel, hourlyRate);
          alert('Toggl project created!');
          loadTogglHours();
        } catch (error) {
          alert('Error: ' + error.message);
          this.disabled = false;
          this.textContent = 'Create Toggl Project';
        }
      });
      return;
    }
    
    const totalHours = summary.totalHours;
    const billableAmount = summary.billableAmount;
    
    togglSection.innerHTML = `
      <div style="background: #f4f5f7; padding: 12px; border-radius: 3px; margin-bottom: 12px;">
        <div style="display: flex; justify-content: space-between; margin: 6px 0;">
          <span>Hours Tracked:</span>
          <strong>${totalHours}h</strong>
        </div>
        <div style="display: flex; justify-content: space-between; margin: 6px 0;">
          <span>Rate:</span>
          <strong>$${hourlyRate}/h</strong>
        </div>
        <div style="display: flex; justify-content: space-between; margin: 6px 0; font-size: 16px; border-top: 1px solid #ddd; padding-top: 8px;">
          <span>Billable:</span>
          <strong>$${billableAmount}</strong>
        </div>
      </div>
      <button id="addTogglChargeBtn" class="mod-primary" style="width: 100%; margin-bottom: 8px;">Add Hours as Charge</button>
      <button id="refreshTogglBtn" style="width: 100%; background: #e2e4e6; color: #172b4d;">Refresh Hours</button>
    `;
    
    document.getElementById('addTogglChargeBtn').addEventListener('click', async function() {
      if (parseFloat(totalHours) === 0) {
        alert('No hours to add');
        return;
      }
      
      const charges = await t.get('card', 'shared', 'charges', []);
      charges.push({
        type: 'Hours',
        amount: parseFloat(billableAmount),
        description: totalHours + ' hours @ $' + hourlyRate + '/hour',
        date: new Date().toISOString()
      });
      
      await t.set('card', 'shared', 'charges', charges);
      alert('Added $' + billableAmount + ' charge');
      loadChargesAndPayments();
    });
    
    document.getElementById('refreshTogglBtn').addEventListener('click', function() {
      loadTogglHours();
    });
    
  } catch (error) {
    if (error.message.includes('not configured')) {
      togglSection.innerHTML = '<p style="text-align: center; color: #999;">Configure Toggl API key in board settings</p>';
    } else {
      togglSection.innerHTML = '<p style="text-align: center; color: #eb5a46;">Error: ' + error.message + '</p>';
    }
  }
}

document.getElementById('addChargeBtn').addEventListener('click', async function() {
  var type = document.getElementById('chargeType').value;
  var amount = parseFloat(document.getElementById('chargeAmount').value);
  var description = document.getElementById('chargeDescription').value;
  
  if (!type || !amount || amount <= 0) {
    alert('Please fill in all required fields');
    return;
  }
  
  var charges = await t.get('card', 'shared', 'charges', []);
  charges.push({
    type: type,
    amount: amount,
    description: description,
    date: new Date().toISOString()
  });
  
  await t.set('card', 'shared', 'charges', charges);
  
  document.getElementById('chargeType').value = '';
  document.getElementById('chargeAmount').value = '';
  document.getElementById('chargeDescription').value = '';
  
  loadChargesAndPayments();
  alert('Charge added successfully!');
});

document.getElementById('addPaymentBtn').addEventListener('click', async function() {
  var date = document.getElementById('paymentDate').value;
  var amount = parseFloat(document.getElementById('paymentAmount').value);
  var method = document.getElementById('paymentMethod').value;
  
  if (!date || !amount || amount <= 0) {
    alert('Please fill in all required fields');
    return;
  }
  
  var payments = await t.get('card', 'shared', 'payments', []);
  payments.push({
    amount: amount,
    date: new Date(date).toISOString(),
    method: method
  });
  
  await t.set('card', 'shared', 'payments', payments);
  
  document.getElementById('paymentDate').value = '';
  document.getElementById('paymentAmount').value = '';
  document.getElementById('paymentMethod').value = '';
  
  loadChargesAndPayments();
  alert('Payment added successfully!');
});

document.getElementById('paymentDate').valueAsDate = new Date();

loadChargesAndPayments();
