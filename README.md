# Trello Billing & Time Tracking Power-Up

A comprehensive Trello Power-Up for tracking billing, payments, and time with Toggl integration, plus board-wide analytics dashboard.

## 🎯 Features

### 💰 Billing Management
- **Auto-Charge Based on Labels**: Automatically adds charges when specific labels are applied
  - Pierce GAL / Pierce MG GAL: $1,875
  - Kitsap GAL / Kitsap MG GAL: $4,000
- **Manual Charges**: Add retainer fees, added fees, testimony charges, and custom charges
- **Payment Tracking**: Record payments with dates and notes
- **Transaction History**: View complete history with delete capability
- **Balance Display**: Color-coded badges on cards (red=owed, green=credit, blue=paid)

### ⏱️ Time Tracking (Toggl Integration)
- **Automatic Time Sync**: Connect Toggl and sync hours to specific cards
- **Smart Matching**: Matches Toggl entries to cards by name in description
- **Hourly Rates**: Set custom rates per card or use label-based defaults
  - Pierce GAL: $125/hr
  - Pierce MG GAL: $125/hr
  - Kitsap GAL: $200/hr
  - Kitsap MG GAL: $200/hr
  - Pierce CV: $200/hr
  - Kitsap CV: $75/hr
- **Time Value Calculation**: Automatically calculates billable value (hours × rate)
- **Time Badges**: Display tracked hours on card front and back

### 📊 Analytics Dashboard
- **Board-Wide Summary**: See totals across all cases
  - Total cases, revenue, payments, outstanding balance
  - Total hours tracked and time value
- **Filter by Label**: View analytics for specific case types
- **Filter by Status**: Active cases vs. paid cases
- **Label Breakdown**: Stats grouped by case type
- **Detailed Case Table**: Sortable table with all case details
- **CSV Export**: Export filtered data for external analysis

## 📦 Installation

### Step 1: Deploy to GitHub Pages

1. **Update your repository** with all the new files:
   - index.html, index.js
   - manifest.json
   - modal.html, modal.js
   - toggl-sync.html, toggl-sync.js
   - analytics.html, analytics.js
   - settings.html
   - style.css
   - coin.png (your existing icon)

2. **Delete old files** (if they exist):
   - auth.html
   - board-summary.js
   - client.html
   - client.js

3. **Enable GitHub Pages**:
   - Go to repository Settings → Pages
   - Source: Deploy from branch `main`
   - Folder: `/ (root)`
   - Click Save

4. **Wait 1-2 minutes** for deployment

5. **Verify it's working**:
   - Visit: `https://louwestcreative.github.io/trello-billing-powerup/`
   - You should see a blank page (this is correct!)
   - Visit: `https://louwestcreative.github.io/trello-billing-powerup/manifest.json`
   - You should see JSON content

### Step 2: Create Power-Up in Trello

1. Go to [Trello Power-Ups Admin](https://trello.com/power-ups/admin)
2. Click **"Create new Power-Up"**
3. Fill in:
   - **Name**: Billing & Time Tracker
   - **Workspace**: Select your workspace
   - **Iframe connector URL**: `https://louwestcreative.github.io/trello-billing-powerup/index.html`
   - **Support email**: Your email
4. Click **Save**

### Step 3: Enable on Board

1. Open your Trello board
2. Click **Show Menu** (top right) → **Power-Ups**
3. Scroll to **Custom** section
4. Find **"Billing & Time Tracker"**
5. Click **Add**

## 🚀 Usage Guide

### Card-Level Features

#### Viewing Billing Info
- **Front Badge**: Shows current balance (charges - payments)
- **Back Badges**: Shows detailed breakdown
- **Billing Details Button**: Click coin icon for full interface

#### Adding Charges
1. Click **"Billing Details"** on card back
2. Select charge type (Retainer, Added Fee, Testimony, Other)
3. Add description (optional)
4. Enter amount
5. Click **"Add Charge"**

#### Adding Payments
1. Click **"Billing Details"** on card back
2. Select payment date
3. Enter amount
4. Add note (optional)
5. Click **"Add Payment"**

#### Auto-Charges from Labels
When you add these labels, charges are automatically created (once per label):
- **Pierce GAL** → $1,875
- **Pierce MG GAL** → $1,875
- **Kitsap GAL** → $4,000
- **Kitsap MG GAL** → $4,000

### Time Tracking with Toggl

#### Initial Setup
1. Click **"Sync Toggl Hours"** button on any card
2. Enter your Toggl API token
   - Find at: [Toggl Profile](https://track.toggl.com/profile)
   - Scroll to "API Token" section
3. Click **"Save Token"**

#### Syncing Hours
1. **In Toggl**: Log time with the card name in the description
   - Example: If card is "Smith v. Jones", include "Smith v. Jones" in your Toggl entry description
2. **In Trello**: Click **"Sync Toggl Hours"** on the card
3. Select date range (7 days, 30 days, 90 days, or 1 year)
4. Click **"Sync Hours from Toggl"**
5. Matched entries appear with total hours calculated

#### Custom Hourly Rates
1. After syncing, enter custom rate in the field
2. Click **"Update Rate"**
3. Time value recalculates automatically

#### Time Display
- **Front Badge**: Purple badge shows total hours
- **Back Badges**: Shows hours and time value
- **Billing Modal**: Shows hourly rate and total value

### Board Analytics Dashboard

#### Accessing Dashboard
1. Open your board
2. Click **"Case Analytics"** button in board menu (top)
3. Full-screen dashboard opens

#### Dashboard Features

**Summary Stats (Top)**
- Total Cases
- Total Revenue (all charges)
- Total Paid (all payments)
- Outstanding Balance (money still owed)
- Total Hours (from Toggl)
- Time Value (hours × rates)

**Filters**
- **By Label**: View specific case types
- **By Status**: Active (positive balance) or Paid (zero/negative balance)

**Label Breakdown**
- Cases grouped by label type
- Shows count, charges, outstanding balance, and hours per label

**All Cases Table**
- Complete list of all cases
- Columns: Name, Label, Charges, Payments, Balance, Hours
- Sorted by balance (highest first)
- Color-coded balances

**Export**
- Click **"Export to CSV"** to download filtered data
- Includes all case details for spreadsheet analysis

## ⚙️ Customization

### Changing Auto-Charge Amounts

Edit `index.js`, find this section:

```javascript
const LABEL_CHARGES = {
  'Pierce GAL': 1875,
  'Pierce MG GAL': 1875,
  'Kitsap GAL': 4000,
  'Kitsap MG GAL': 4000
};
```

Change the amounts as needed.

### Changing Default Hourly Rates

Edit `index.js`, find this section:

```javascript
const HOURLY_RATES = {
  'Pierce GAL': 125,
  'Pierce MG GAL': 125,
  'Kitsap GAL': 200,
  'Kitsap MG GAL': 200,
  'Pierce CV': 200,
  'Kitsap CV': 75
};
```

### Adding New Labels

1. Add to `LABEL_CHARGES` (if you want auto-charging)
2. Add to `HOURLY_RATES` (if you want default rate)
3. Add to `labelColors` in `analytics.js` for dashboard colors

## 🔧 Troubleshooting

### Power-Up Not Showing
1. Verify GitHub Pages is enabled and accessible
2. Check Power-Up connector URL is correct
3. Make sure Power-Up is enabled on the specific board
4. Clear browser cache and refresh

### Toggl Not Syncing
1. Verify API token is correct
2. Check Toggl entry descriptions include the card name exactly
3. Try a longer date range
4. Verify you have time entries in Toggl for that period

### Analytics Not Loading
1. Check browser console (F12) for errors
2. Verify all cards are accessible
3. Try clicking "Refresh Data" button
4. Make sure you have proper permissions on the board

### Auto-Charges Not Working
1. Verify label names match exactly (case-sensitive)
2. Each label only charges once per card
3. Check browser console for errors
4. Make sure labels are added after Power-Up is enabled

## 📝 Best Practices

### Naming Convention for Toggl
Use consistent naming in Toggl descriptions:
- ✅ "Smith v. Jones - Research" (matches "Smith v. Jones" card)
- ✅ "Working on Smith v. Jones case" (matches "Smith v. Jones" card)
- ❌ "Case research" (no card name, won't match)

### Card Organization
- Use labels consistently for all cases
- Name cards clearly (client names, case numbers)
- Add labels before doing time tracking
- Keep card names short for easier Toggl matching

### Regular Syncing
- Sync Toggl hours weekly
- Review analytics dashboard monthly
- Export CSV for accounting records
- Update payments promptly

## 🔒 Privacy & Security

- **Toggl API Token**: Stored privately per board (not shared with other users)
- **Billing Data**: Stored on card level, visible to all board members
- **No External Servers**: All data stays in Trello and Toggl
- **No Tracking**: Power-Up doesn't track or store data elsewhere

## 📄 File Structure

```
trello-billing-powerup/
├── manifest.json          # Power-Up configuration
├── index.html             # Main connector
├── index.js               # Core logic
├── modal.html             # Billing interface
├── modal.js               # Billing logic
├── toggl-sync.html        # Toggl interface
├── toggl-sync.js          # Toggl integration
├── analytics.html         # Dashboard interface
├── analytics.js           # Analytics logic
├── settings.html          # Settings page
├── style.css              # Styles
└── coin.png               # Icon
```

## 🆘 Support

For issues:
1. Check browser console (F12) for errors
2. Verify all files are accessible via GitHub Pages
3. Check Trello Power-Up admin settings
4. Contact Lou West Creative

## 📜 License

MIT License - Free to modify and use for your needs!
