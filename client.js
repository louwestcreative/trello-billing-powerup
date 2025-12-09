const t = TrelloPowerUp.iframe();

// Define your GAL label groups and automatic charges
const LABEL_CHARGES = {
  "Pierce GAL": 2000,
  "Pierce MG GAL": 2000,
  "Kitsap GAL": 4000,
  "Kitsap MG GAL": 4000,
};

// Utility: get all labels on card as array of label names
async function getCardLabels() {
  const labels = await t.card('labels');
  return labels.labels.map(label => label.name);
}

// Load billing data or default structure
async function loadBillingData() {
  const data = await t.get('card', 'shared', 'billingData');
  return data || { charges: [], payments: [] };
}

// Save billing data
async function saveBillingData(data) {
  await t.set('card', 'shared', 'billingData', data);
  t.notifyParent('billingDataChanged'); // notify to refresh badge
}

// Sum amounts in array
function sumAmounts(entries) {
  return entries.reduce((sum, e) => sum + Number(e.amount || 0), 0);
}

// Calculate balance
function calculateBalance(data) {
  return sumAmounts(data.charges) - sumAmounts(data.payments);
}

// Check if any label needs automatic charge
function findApplicableLabel(labels) {
  for (const label of labels) {
    if (LABEL_CHARGES[label]) return label;
  }
  return null;
}

// Add auto charge if missing
async function addAutomaticChargeIfNeeded(labelName, data) {
  const chargeAmount = LABEL_CHARGES[labelName];
  if (!chargeAmount) return data;

  const exists = data.charges.some(
    c => c.type === labelName && c.auto === true
  );
  if (!exists) {
    const today = new Date().toISOString().slice(0, 10);
    data.charges.push({
      type: labelName,
      date: today,
      amount: chargeAmount,
      auto: true,
    });
  }
  return data;
}

// Remove auto charges if label removed
function removeAutomaticChargesForLabel(labelName, data) {
  return {
    ...data,
    charges: data.charges.filter(c => !(c.type === labelName && c.auto === true))
  };
}

// Badge callback
async function badgeCallback(t) {
  let data = await loadBillingData();
  const labels = await getCardLabels();

  // Add auto charges for current labels
  for (const label of Object.keys(LABEL_CHARGES)) {
    if (labels.includes(label)) {
      data = await addAutomaticChargeIfNeeded(label, data);
    } else {
      data = removeAutomaticChargesForLabel(label, data);
    }
  }

  await saveBillingData(data);

  const balance = calculateBalance(data);

  if (balance <= 0) return null;

  return {
    text: `$${balance.toFixed(2)}`,
    color: 'red',
    refresh: 10,
  };
}

// Listen for label changes to update charges
async function handleLabelChange() {
  const labels = await getCardLabels();
  let data = await loadBillingData();

  for (const label of Object.keys(LABEL_CHARGES)) {
    if (labels.includes(label)) {
      data = await addAutomaticChargeIfNeeded(label, data);
    } else {
      data = removeAutomaticChargesForLabel(label, data);
    }
  }

  await saveBillingData(data);
}

t.render(() => {
  // Register badge
  t.card('id', 'labels').then(() => {
    t.attach({
      callback: badgeCallback,
    });
  });

  // Update charges on label change
  handleLabelChange();

  // Refresh on data changes
  t.on('billingDataChanged', () => {
    t.refresh();
  });

  t.sizeToParent();
});
