/* global TrelloPowerUp */

const t = TrelloPowerUp.iframe();

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

async function loadData() {
  const charges = await t.get('card', 'shared', 'charges', []);
  const payments = await t.get('card', 'shared', 'payments', []);
  
  // Calculate totals
  const totalCharges = charges.reduce((sum, c) => sum + c.amount, 0);
  const totalPayments = payments.reduce((sum, p) => sum + p.amount, 0);
  const balance = totalCharges - totalPayments;
  
  // Update summary
  document.getElementById('totalCharges').textContent = formatCurrency(totalCharges);
  document.getElementById('totalPayments').textContent = formatCurrency(totalPayments);
  document.getElementById('balance').textContent = formatCurrency(Math.abs(balance));
  
  const balanceEl = document.getElementById('balance');
  balanceEl.className = balance > 0 ? 'amount-red' : (balance < 0 ? 'amount-green' : '');
  
  // Display transactions
  displayTransactions(charges, payments);
}

function displayTransactions(charges, payments) {
  const list = document.getElementById('transactionList');
  list.innerHTML = '';
  
  // Combine and sort by date
  const transactions = [
    ...charges.map(c => ({ ...c, transactionType: 'charge' })),
    ...payments.map(p => ({ ...p, transactionType: 'payment' }))
  ].sort((a, b) => new Date(b.date) - new Date(a.date));
  
  if (transactions.length === 0) {
    list.innerHTML = '<p class="no-data">No transactions yet</p>';
    return;
  }
  
  transactions.forEach((tx, index) => {
    const div = document.createElement('div');
    div.className = 'transaction-item';
    
    if (tx.transactionType === 'charge') {
      div.innerHTML = `
        <div class="transaction-header">
          <span class="transaction-type charge">Charge: ${tx.type}</span>
          <span class="amount-red">${formatCurrency(tx.amount)}</span>
        </div>
        <div class="transaction-details">
          <span>${formatDate(tx.date)}</span>
          ${tx.description ? `<span> • ${tx.description}</span>` : ''}
        </div>
        <button class="delete-btn" data-type="charge" data-index="${index}">Delete</button>
      `;
    } else {
      div.innerHTML = `
        <div class="transaction-header">
          <span class="transaction-type payment">Payment</span>
          <span class="amount-green">${formatCurrency(tx.amount)}</span>
        </div>
        <div class="transaction-details">
          <span>${formatDate(tx.date)}</span>
          ${tx.note ? `<span> • ${tx.note}</span>` : ''}
        </div>
        <button class="delete-btn" data-type="payment" data-index="${index}">Delete</button>
      `;
    }
    
    list.appendChild(div);
  });
  
  // Add delete handlers
  document.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', async function() {
      const type = this.dataset.type;
      const originalIndex = parseInt(this.dataset.index);
      
      // Find the actual index in the original array
      const charges = await t.get('card', 'shared', 'charges', []);
      const payments = await t.get('card', 'shared', 'payments', []);
      
      const combinedTransactions = [
        ...charges.map(c => ({ ...c, transactionType: 'charge' })),
        ...payments.map(p => ({ ...p, transactionType: 'payment' }))
      ].sort((a, b) => new Date(b.date) - new Date(a.date));
      
      const toDelete = combinedTransactions[originalIndex];
      
      if (type === 'charge') {
        const actualIndex = charges.findIndex(c => 
          c.date === toDelete.date && 
          c.type === toDelete.type && 
          c.amount === toDelete.amount
        );
        if (actualIndex !== -1) {
          charges.splice(actualIndex, 1);
          await t.set('card', 'shared', 'charges', charges);
        }
      } else {
        const actualIndex = payments.findIndex(p => 
          p.date === toDelete.date && 
          p.amount === toDelete.amount
        );
        if (actualIndex !== -1) {
          payments.splice(actualIndex, 1);
          await t.set('card', 'shared', 'payments', payments);
        }
      }
      
      await loadData();
    });
  });
}

// Set today's date as default
document.getElementById('paymentDate').valueAsDate = new Date();

// Add Charge button
document.getElementById('addChargeBtn').addEventListener('click', async function() {
  const type = document.getElementById('chargeType').value;
  const description = document.getElementById('chargeDescription').value;
  const amount = parseFloat(document.getElementById('chargeAmount').value);
  
  if (!amount || amount <= 0) {
    alert('Please enter a valid amount');
    return;
  }
  
  const charges = await t.get('card', 'shared', 'charges', []);
  charges.push({
    date: new Date().toISOString(),
    type: type,
    description: description,
    amount: amount
  });
  
  await t.set('card', 'shared', 'charges', charges);
  
  // Clear inputs
  document.getElementById('chargeDescription').value = '';
  document.getElementById('chargeAmount').value = '';
  
  await loadData();
});

// Add Payment button
document.getElementById('addPaymentBtn').addEventListener('click', async function() {
  const date = document.getElementById('paymentDate').value;
  const amount = parseFloat(document.getElementById('paymentAmount').value);
  const note = document.getElementById('paymentNote').value;
  
  if (!date) {
    alert('Please select a date');
    return;
  }
  
  if (!amount || amount <= 0) {
    alert('Please enter a valid amount');
    return;
  }
  
  const payments = await t.get('card', 'shared', 'payments', []);
  payments.push({
    date: new Date(date).toISOString(),
    amount: amount,
    note: note
  });
  
  await t.set('card', 'shared', 'payments', payments);
  
  // Clear inputs
  document.getElementById('paymentAmount').value = '';
  document.getElementById('paymentNote').value = '';
  document.getElementById('paymentDate').valueAsDate = new Date();
  
  await loadData();
});

// Initial load
loadData();

// Auto-resize
t.sizeTo('body').done();
