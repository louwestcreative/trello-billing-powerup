/* global TrelloPowerUp */

const t = TrelloPowerUp.iframe();

function formatCurrency(amount) {
  return '$' + amount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function formatHours(hours) {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

const labelColors = {
  'Pierce GAL': '#eb5a46',
  'Pierce MG GAL': '#ff9f1a',
  'Kitsap GAL': '#c377e0',
  'Kitsap MG GAL': '#00c2e0',
  'Pierce CV': '#61bd4f',
  'Kitsap CV': '#0079bf'
};

let allCasesData = [];

async function loadAnalytics() {
  try {
    // Get all cards on the board
    const cards = await t.cards('id', 'name', 'labels');
    
    allCasesData = [];
    
    for (const card of cards) {
      // Get billing data for each card
      const charges = await t.get(card.id, 'shared', 'charges', []);
      const payments = await t.get(card.id, 'shared', 'payments', []);
      const togglHours = await t.get(card.id, 'shared', 'togglHours', 0);
      const hourlyRate = await t.get(card.id, 'shared', 'hourlyRate', 100);
      
      const totalCharges = charges.reduce((sum, c) => sum + c.amount, 0);
      const totalPayments = payments.reduce((sum, p) => sum + p.amount, 0);
      const balance = totalCharges - totalPayments;
      
      // Get primary label (GAL or CV)
      let primaryLabel = '';
      for (const label of card.labels) {
        if (labelColors[label.name]) {
          primaryLabel = label.name;
          break;
        }
      }
      
      allCasesData.push({
        id: card.id,
        name: card.name,
        label: primaryLabel,
        charges: totalCharges,
        payments: totalPayments,
        balance: balance,
        hours: togglHours,
        rate: hourlyRate,
        timeValue: togglHours * hourlyRate
      });
    }
    
    displayAnalytics();
    
  } catch (error) {
    console.error('Error loading analytics:', error);
    document.getElementById('casesTable').innerHTML = '<div class="loading">Error loading data. Please try again.</div>';
  }
}

function displayAnalytics() {
  const filteredData = getFilteredData();
  
  // Calculate summary stats
  const totalCases = filteredData.length;
  const totalRevenue = filteredData.reduce((sum, c) => sum + c.charges, 0);
  const totalPaid = filteredData.reduce((sum, c) => sum + c.payments, 0);
  const outstandingBalance = filteredData.reduce((sum, c) => sum + Math.max(0, c.balance), 0);
  const totalHours = filteredData.reduce((sum, c) => sum + c.hours, 0);
  const timeValue = filteredData.reduce((sum, c) => sum + c.timeValue, 0);
  
  // Update stats
  document.getElementById('totalCases').textContent = totalCases;
  document.getElementById('totalRevenue').textContent = formatCurrency(totalRevenue);
  document.getElementById('totalPaid').textContent = formatCurrency(totalPaid);
  document.getElementById('outstandingBalance').textContent = formatCurrency(outstandingBalance);
  document.getElementById('totalHours').textContent = formatHours(totalHours);
  document.getElementById('timeValue').textContent = formatCurrency(timeValue);
  
  // Display label breakdown
  displayLabelBreakdown(filteredData);
  
  // Display cases table
  displayCasesTable(filteredData);
}

function displayLabelBreakdown(data) {
  const breakdown = {};
  
  data.forEach(caseData => {
    if (!caseData.label) return;
    
    if (!breakdown[caseData.label]) {
      breakdown[caseData.label] = {
        count: 0,
        charges: 0,
        payments: 0,
        balance: 0,
        hours: 0
      };
    }
    
    breakdown[caseData.label].count++;
    breakdown[caseData.label].charges += caseData.charges;
    breakdown[caseData.label].payments += caseData.payments;
    breakdown[caseData.label].balance += caseData.balance;
    breakdown[caseData.label].hours += caseData.hours;
  });
  
  let html = '<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px;">';
  
  for (const [label, stats] of Object.entries(breakdown)) {
    const color = labelColors[label] || '#5e6c84';
    html += `
      <div style="padding: 16px; background: #f9fafc; border-left: 4px solid ${color}; border-radius: 3px;">
        <div style="font-weight: 600; color: #172b4d; margin-bottom: 8px;">${label}</div>
        <div style="font-size: 12px; color: #5e6c84; line-height: 1.6;">
          <div>${stats.count} cases</div>
          <div>${formatCurrency(stats.charges)} charged</div>
          <div>${formatCurrency(stats.balance)} outstanding</div>
          <div>${formatHours(stats.hours)} tracked</div>
        </div>
      </div>
    `;
  }
  
  html += '</div>';
  document.getElementById('labelBreakdown').innerHTML = html;
}

function displayCasesTable(data) {
  let html = `
    <div class="case-row header">
      <div>Case Name</div>
      <div>Label</div>
      <div>Charges</div>
      <div>Payments</div>
      <div>Balance</div>
      <div>Hours</div>
    </div>
  `;
  
  // Sort by balance (highest first)
  const sorted = [...data].sort((a, b) => b.balance - a.balance);
  
  sorted.forEach(caseData => {
    const labelHtml = caseData.label 
      ? `<span class="label-tag" style="background: ${labelColors[caseData.label]}">${caseData.label}</span>`
      : '<span style="color: #5e6c84;">No label</span>';
    
    const balanceClass = caseData.balance > 0 ? 'amount-negative' : (caseData.balance < 0 ? 'amount-positive' : '');
    
    html += `
      <div class="case-row">
        <div class="case-name">${caseData.name}</div>
        <div>${labelHtml}</div>
        <div>${formatCurrency(caseData.charges)}</div>
        <div>${formatCurrency(caseData.payments)}</div>
        <div class="${balanceClass}">${formatCurrency(Math.abs(caseData.balance))}</div>
        <div>${caseData.hours > 0 ? formatHours(caseData.hours) : '-'}</div>
      </div>
    `;
  });
  
  document.getElementById('casesTable').innerHTML = html;
}

function getFilteredData() {
  const labelFilter = document.getElementById('filterLabel').value;
  const statusFilter = document.getElementById('filterStatus').value;
  
  return allCasesData.filter(caseData => {
    if (labelFilter && caseData.label !== labelFilter) return false;
    if (statusFilter === 'active' && caseData.balance <= 0) return false;
    if (statusFilter === 'paid' && caseData.balance > 0) return false;
    return true;
  });
}

function exportToCSV() {
  const data = getFilteredData();
  
  let csv = 'Case Name,Label,Charges,Payments,Balance,Hours,Hourly Rate,Time Value\n';
  
  data.forEach(caseData => {
    csv += `"${caseData.name}","${caseData.label}",${caseData.charges},${caseData.payments},${caseData.balance},${caseData.hours},${caseData.rate},${caseData.timeValue}\n`;
  });
  
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `case-analytics-${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
}

// Event listeners
document.getElementById('filterLabel').addEventListener('change', displayAnalytics);
document.getElementById('filterStatus').addEventListener('change', displayAnalytics);
document.getElementById('exportBtn').addEventListener('click', exportToCSV);
document.getElementById('refreshBtn').addEventListener('click', loadAnalytics);

// Initial load
loadAnalytics();
t.sizeTo('body').done();
