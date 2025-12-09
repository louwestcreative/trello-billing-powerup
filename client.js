const t = TrelloPowerUp.iframe();

// Define your GAL label groups and automatic charges
const LABEL_CHARGES = {
  "Pierce GAL": 2000,
  "Pierce MG GAL": 2000,
  "Kitsap GAL": 4000,
  "Kitsap MG GAL": 4000,
};

// Hourly rates for CV (used in charges only, no badges)
const HOURLY_RATES = {
  "Pierce CV": 125,
  "Kitsap CV": 75,
};

// Utility: get all labels on card as array of label names
async function getCardLabels() {
  const labels = await t.card('labels');
  return labels.labels.map(label => label.name);
}

// Load billing data or return default structure
async function loadBillingData() {
  const data = await t.get('card', 'shared', 'billingData');
  return data || { charges: [], payments: [] };
}

// Save billing data
async function saveBillingData(data) {
  await t.set('card', 'shared', 'billingData', data);
  t.notifyParent('billingDataChanged'); // notify for badge refresh
}

// Calculate total amount from entries array
function sumAmounts(entries) {
  return entries.reduce((sum, e) => sum + Number(e.amount || 0), 0);
}

// Calculate balance = total charges - total payments
function calculateBalance(data) {
  const chargesTotal = sumAmounts(data.charges);
  const paymentsTotal = sumAmounts(data.payments);
  return chargesTotal - paymentsTotal;
}

// Check if any of the card labels match the GAL label groups (for automatic charge)
function findApplicableLabel(labels) {
  for (const label of labels) {
    if (LABEL_CHARGES[label]) return label;
  }
  return null;
}

// Add automatic charge if not already present for a label
async function addAutomaticChargeIfNeeded(labelName, data) {
  const chargeAmount = LABEL_CHARGES[labelName];
  if (!chargeAmount) return data; // no charge for this label

  // Check if charge already recorded for this label
  const exists = data.charges.some(
    c => c.type === labelName && c.auto === true
  );
  if (!exists) {
    // Add automatic charge entry for today
    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    data.charges.push({
      type: labelName,
      date: today,
      amount: chargeAmount,
      auto: true, // mark as auto-generated
    });
  }
  return data;
}

// Badge callback to show balance on card front
async function badgeCallback(t, opts) {
  const data = await loadBillingData();

  // Get card labels to determine automatic charges
  const labels = await getCardLabels();

  // Ensure automatic charges are present if labels require
  const dataWithAuto = await addAutomaticChargeIfNeeded(findApplicableLabel(labels), data);
  if (dataWithAuto !== data) {
    await saveBillingData(dataWithAuto);
  }

  const balance = calculateBalance(dataWithAuto);

  if (balance <= 0) {
    // No badge if no balance owed
    return null;
  }

  return {
    text: `$${balance.toFixed(2)}`,
    color: balance > 0 ? 'red' : 'green',
    // Optional icon: https://developer.atlassian.com/cloud/trello/images/power-up-icons/
    // icon: 'https://example.com/your-icon.png',
    refresh: 10 // refresh every 10 seconds or on notify
  };
}

// Function to listen for label changes and update automatic charges accordingly
async function handleLabelChange() {
  const labels = await getCardLabels();
  let data = await loadBillingData();

  // For each label that needs auto charge, add if missing
  for (const label of Object.keys(LABEL_CHARGES)) {
    if (labels.includes(label)) {
      data = await addAutomaticChargeIfNeeded(label, data);
    } else {
      // If label removed, remove related automatic charges
      data.charges = data.charges.filter(c => !(c.type === label && c.auto === true));
    }
  }

  await saveBillingData(data);
}

// Setup Power-Up client capabilities
t.render(() => {
  // Register badge callback
  t.card('id', 'labels')
    .then(() => {
      t.attach({
        callback: badgeCallback
      });
    });

  // Listen for label changes and update billing accordingly
  handleLabelChange();

  // Listen for billing data changed notifications
  t.on('billingDataChanged', () => {
    t.refresh();
  });

  // Notify Trello we’re ready
  t.sizeToParent();
});
