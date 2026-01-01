# Trello Billing Power-Up with Toggl Integration

## 🎯 Features

### Billing Features
- **Auto-charge** for GAL labels when applied to cards
  - Pierce GAL: $2,000
  - Pierce MG GAL: $2,000
  - Kitsap GAL: $4,000
  - Kitsap MG GAL: $4,000
- **Manual charges**: Retainer, added fees, testimony, hours, other
- **Payment tracking** with date and method
- **Balance badge** on card front showing current balance
- **Transaction log** of all charges and payments

### Time Tracking Features
- **Toggl integration** with hourly rate mapping
  - Kitsap GAL: $200/hour
  - Pierce GAL: $125/hour
  - Kitsap MG GAL: $200/hour
  - Pierce CV: $126/hour
  - Kitsap CV: $75/hour
  - Pierce MG GAL: $125/hour
- **Auto-create Toggl projects** from Trello cards
- **Sync hours** from Toggl to calculate billable amounts
- **Time entry display** showing recent tracked time
- **Add hours as charges** directly from Toggl data
- **Real-time hour tracking** displayed on card back

## 🚀 Setup Instructions

### 1. Get Your Toggl API Key

1. Log in to [Toggl Track](https://track.toggl.com)
2. Go to **Profile Settings** (click your avatar in top-right)
3. Scroll down to **API Token** section
4. Copy your API token

### 2. Install the Power-Up

1. Host all files on your web server or GitHub Pages
2. Update URLs in `manifest.json` to point to your hosted location
3. Go to [Trello Power-Up Admin](https://trello.com/power-ups/admin)
4. Create a new Power-Up or edit your existing one
5. Set the manifest URL to your hosted `manifest.json`
6. Enable the Power-Up on your board

### 3. Configure Toggl in Your Board

1. Open your Trello board
2. Click **"Configure Toggl"** button in the board menu (top-right)
3. Paste your Toggl API key
4. Click **Save API Key**

### 4. Using the Power-Up

#### Creating a New Case

1. Create a new card with the case name (e.g., "Smith vs. Jones")
2. Add the appropriate label (e.g., "Pierce GAL")
3. Open the card
4. Click **"Billing & Hours"** button
5. Go to the **Time Tracking** tab
6. Click **"Create Toggl Project"** to set up time tracking

#### Tracking Time

1. In Toggl Track, select the project matching your card name
2. Track your time as usual
3. Time entries will automatically sync to your Trello card

#### Viewing Time & Billing

1. Open the card
2. The **Time Tracking** section on the card back shows:
   - Total hours tracked
   - Hourly rate (based on label)
   - Total billable amount
   - Recent time entries
3. Click **"Billing & Hours"** for detailed view

#### Adding Charges from Toggl

1. Open the card
2. Click **"Billing & Hours"**
3. Go to **Time Tracking** tab
4. Click **"Sync Hours from Toggl"** to refresh data
5. Click **"Add Hours as Charge"** to add time to billing
6. View the charge in the **Billing** tab

#### Manual Billing

1. Open the card
2. Click **"Billing & Hours"**
3. In the **Billing** tab:
   - Add charges (retainer, fees, testimony, other)
   - Add payments with date and method
   - View transaction log

#### Summary View

1. Click **"Billing & Hours"**
2. Go to **Summary** tab to see:
   - Case name and label
   - Hourly rate
   - Total charged
   - Total paid
   - Current balance

## 📋 Label to Client Mapping

The Power-Up automatically maps Trello labels to Toggl clients:

| Trello Label | Toggl Client | Hourly Rate | Auto-Charge |
|--------------|--------------|-------------|-------------|
| Kitsap GAL | Kitsap GAL | $200/hour | $4,000 |
| Pierce GAL | Pierce GAL | $125/hour | $2,000 |
| Kitsap MG GAL | Kitsap MG GAL | $200/hour | $4,000 |
| Pierce CV | Pierce CV | $126/hour | - |
| Kitsap CV | Kitsap CV | $75/hour | - |
| Pierce MG GAL | Pierce MG GAL | $125/hour | $2,000 |

## 🔧 Technical Details

### Files Included

- `index.js` - Main Power-Up logic with Toggl integration
- `modal.html` - Billing & time tracking modal interface
- `toggl-config.html` - Toggl API key configuration popup
- `toggl-section.html` - Time tracking section for card back
- `manifest.json` - Power-Up manifest
- `style.css` - Styling

### Data Storage

- **Board level**: Toggl API key (shared across all cards)
- **Card level**: Charges, payments (private to each card)

### API Integration

- Uses Toggl Track API v9
- Authentication via API token (Basic Auth)
- Automatically creates clients and projects in Toggl
- Syncs time entries on-demand

## 🎨 Customization

### Changing Hourly Rates

Edit the `HOURLY_RATES` object in `index.js`:

```javascript
const HOURLY_RATES = {
  'Kitsap GAL': 200,      // Change to your rate
  'Pierce GAL': 125,
  // ... etc
};
```

### Changing Auto-Charges

Edit the `AUTO_CHARGES` object in `index.js`:

```javascript
const AUTO_CHARGES = {
  'Pierce GAL': 2000,     // Change amount
  'Pierce MG GAL': 2000,
  // ... etc
};
```

### Adding New Labels

1. Add the label in Trello
2. Add it to `HOURLY_RATES` in `index.js`
3. Optionally add to `AUTO_CHARGES` if it should auto-charge

## 🐛 Troubleshooting

### "Toggl API key not configured"
- Click "Configure Toggl" in board menu
- Enter your API key and save

### "No billing label found"
- Add one of the supported labels to your card
- Supported: Kitsap GAL, Pierce GAL, Kitsap MG GAL, Pierce CV, Kitsap CV, Pierce MG GAL

### "Project not found in Toggl"
- Open card → Billing & Hours → Time Tracking tab
- Click "Create Toggl Project"

### Time entries not showing
- Make sure you're tracking time in Toggl under the correct project name
- Project name must exactly match your Trello card name
- Click "Refresh" in the time tracking section

## 📞 Support

For questions or issues, contact Lou West Creative.

## 📄 License

© Lou West Creative. All rights reserved.
