const t = TrelloPowerUp.iframe();

function todayISO() { return new Date().toISOString().slice(0,10); }
function safeNum(v){ return (v===undefined||v===null||v===''?0:parseFloat(v)||0); }
function formatMoney(n){ return '$' + Number(n||0).toFixed(2); }
function escapeHTML(s){ return (''+s).replace(/[&<>"']/g, m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[m]); }

async function loadBillingData(){
  const data = await t.get('card','shared','billingData');
  return data || { charges: [], payments: [], hourlyRates: {}, county: null };
}
async function saveBillingData(data){
  return t.set('card','shared','billingData', data);
}

const infoEl = document.getElementById('info');
const galFields = document.getElementById('gal-fields');
const cvFields = document.getElementById('cv-fields');
const rateNote = document.getElementById('rate-note');
const chargeTypeEl = document.getElementById('charge-type');
const chargeAmountEl = document.getElementById('charge-amount');
const hoursEl = document.getElementById('hours');
const chargeDateEl = document.getElementById('charge-date');
const addChargeBtn = document.getElementById('add-charge-btn');

const paymentDateEl = document.getElementById('payment-date');
const paymentAmountEl = document.getElementById('payment-amount');
const addPaymentBtn = document.getElementById('add-payment-btn');

const summaryEl = document.getElementById('summary');
const chargesTableBody = document.querySelector('#charges-table tbody');
const paymentsTableBody = document.querySelector('#payments-table tbody');

let mode = { kind: 'unknown', county: null, rate: 0 };

// detect mode from labels (GAL labels: 'Pierce GAL','Pierce MG GAL','Kitsap GAL','Kitsap MG GAL'; CV labels: 'Pierce CV','Kitsap CV')
function detectModeFromLabels(labels){
  const names = (labels||[]).map(l=>l.name || '');
  const pierceGal = names.some(n => n === 'Pierce GAL' || n === 'Pierce MG GAL');
  const kitsapGal = names.some(n => n === 'Kitsap GAL' || n === 'Kitsap MG GAL');
  const pierceCv = names.includes('Pierce CV');
  const kitsapCv = names.includes('Kitsap CV');

  if (pierceCv || kitsapCv) {
    return { kind: 'CV', county: pierceCv ? 'Pierce' : 'Kitsap', rate: pierceCv ? 125 : 200 };
  }
  if (pierceGal || kitsapGal) {
    return { kind: 'GAL', county: pierceGal ? 'Pierce' : 'Kitsap', rate: pierceGal ? 125 : 200 };
  }
  return { kind: 'unknown', county: null, rate: 0 };
}

function renderSummary(data){
  const totalCharges = (data.charges||[]).reduce((s,c)=> s + safeNum(c.amount), 0);
  const totalPayments = (data.payments||[]).reduce((s,p)=> s + safeNum(p.amount), 0);
  const balance = totalCharges - totalPayments;
  summaryEl.innerHTML = `
    <div>Total Charges: <strong>${formatMoney(totalCharges)}</strong></div>
    <div>Total Payments: <strong>${formatMoney(totalPayments)}</strong></div>
    <div>Balance: <strong>${formatMoney(balance)}</strong></div>
  `;
}

function renderLogs(data){
  chargesTableBody.innerHTML = '';
  (data.charges||[]).forEach(c => {
    const tr = document.createElement('tr');
    const labelCell = document.createElement('td');
    labelCell.innerHTML = escapeHTML(c.type || (c.hours ? `${c.hours} hr` : 'Charge'));
    tr.appendChild(labelCell);
    const dateCell = document.createElement('td'); dateCell.textContent = c.date || ''; tr.appendChild(dateCell);
    const amountCell = document.createElement('td'); amountCell.textContent = formatMoney(c.amount); tr.appendChild(amountCell);
    const delCell = document.createElement('td');
    const delBtn = document.createElement('button'); delBtn.className='delete-btn'; delBtn.textContent='Delete';
    delBtn.addEventListener('click', async () => {
      if (!confirm('Delete this charge?')) return;
      const d = await loadBillingData();
      d.charges = d.charges.filter(x => x.id !== c.id);
      await saveBillingData(d); await refreshAll();
    });
    delCell.appendChild(delBtn); tr.appendChild(delCell);
    chargesTableBody.appendChild(tr);
  });

  paymentsTableBody.innerHTML = '';
  (data.payments||[]).forEach(p => {
    const tr = document.createElement('tr');
    const dateCell = document.createElement('td'); dateCell.textContent = p.date || ''; tr.appendChild(dateCell);
    const amountCell = document.createElement('td'); amountCell.textContent = formatMoney(p.amount); tr.appendChild(amountCell);
    const delCell = document.createElement('td');
    const delBtn = document.createElement('button'); delBtn.className='delete-btn'; delBtn.textContent='Delete';
    delBtn.addEventListener('click', async () => {
      if (!confirm('Delete this payment?')) return;
      const d = await loadBillingData();
      d.payments = d.payments.filter(x => x.id !== p.id);
      await saveBillingData(d); await refreshAll();
    });
    delCell.appendChild(delBtn); tr.appendChild(delCell);
    paymentsTableBody.appendChild(tr);
  });

  renderSummary(data);
}

async function refreshAll(){
  const data = await loadBillingData();
  const cardInfo = await t.card('labels');
  const detected = detectModeFromLabels(cardInfo.labels || []);
  mode = detected;

  if (mode.kind === 'CV') {
    galFields.style.display = 'none';
    cvFields.style.display = 'block';
    rateNote.textContent = `Rate: $${mode.rate}/hr — Amount will be auto-calculated from hours.`;
    document.getElementById('charge-title').textContent = 'Add Hourly Charge (CV)';
  } else if (mode.kind === 'GAL') {
    galFields.style.display = 'block';
    cvFields.style.display = 'none';
    document.getElementById('charge-title').textContent = `Add Charge (GAL · ${mode.county})`;
  } else {
    galFields.style.display = 'block';
    cvFields.style.display = 'none';
    document.getElementById('charge-title').textContent = 'Add Charge';
    rateNote.textContent = 'No county label detected — enter amount or add label (Pierce/Kitsap).';
  }

  if (!chargeDateEl.value) chargeDateEl.value = todayISO();
  if (!paymentDateEl.value) paymentDateEl.value = todayISO();

  renderLogs(data);

  t.notifyParent('billingDataChanged');
}

addChargeBtn.addEventListener('click', async () => {
  const d = await loadBillingData();
  if (mode.kind === 'CV') {
    const hrs = safeNum(hoursEl.value);
    if (hrs <= 0) { alert('Enter hours > 0'); return; }
    const amount = hrs * (mode.rate || 0);
    const date = chargeDateEl.value || todayISO();
    const entry = { id: `ch_${Date.now()}`, type: `${mode.county} CV Hourly`, hours: hrs, date, amount };
    d.charges.push(entry);
    await saveBillingData(d); await refreshAll();
    hoursEl.value = ''; alert('Hourly charge added.');
  } else {
    const type = chargeTypeEl.value;
    const amount = safeNum(chargeAmountEl.value);
    const date = chargeDateEl.value || todayISO();
    if (!type) { alert('Select a charge type'); return; }
    if (amount <= 0) { alert('Enter a positive amount'); return; }
    const entry = { id: `ch_${Date.now()}`, type, date, amount };
    d.charges.push(entry);
    await saveBillingData(d); await refreshAll();
    chargeAmountEl.value = ''; chargeTypeEl.selectedIndex = 0; alert('Charge added.');
  }
});

addPaymentBtn.addEventListener('click', async () => {
  const d = await loadBillingData();
  const amount = safeNum(paymentAmountEl.value);
  const date = paymentDateEl.value || todayISO();
  if (amount <= 0) { alert('Enter a positive payment amount'); return; }
  d.payments.push({ id: `p_${Date.now()}`, date, amount });
  await saveBillingData(d); await refreshAll();
  paymentAmountEl.value = ''; alert('Payment recorded.');
});

document.addEventListener('DOMContentLoaded', () => {
  refreshAll().catch(err => { console.error('Error initializing billing UI', err); infoEl.textContent = 'Error loading billing info — check console.'; });
  setInterval(() => refreshAll().catch(()=>{}), 30000);
});
