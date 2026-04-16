# Order Reconciliation Dashboard 📊

A web-based dashboard for visualizing and analyzing Purchase Order (PO) reconciliation data across multiple sources.

## Features

✅ **Real-time Statistics**
- Total PO count across all sources
- Common POs found in all three files
- Missing POs identification
- Source-wise distribution

📊 **Interactive Visualizations**
- Bar chart showing PO distribution by source
- Doughnut chart displaying match status overview
- Dynamic data tables with search functionality

🔍 **Detailed Analysis**
- Missing PO numbers in Inflight
- Missing PO numbers in SWFRoutMail
- POs found in all three files
- Partial matches (found in 2 out of 3 files)

## Quick Start

### Prerequisites

- Python 3.7 or higher
- Required Python packages:
  ```bash
  pip install pandas openpyxl
  ```

### Step 1: Generate Dashboard Data

1. Ensure you have the following Excel files in the `Order Recon` directory:
   - `Webforms.xlsx`
   - `inflight.xlsx`
   - `swfroutmail.xlsx`

2. Run the data generation script:
   ```bash
   cd "C:\Users\SARAVANANPS\Desktop\Innvo_26\Order Recon"
   python generate_dashboard_data.py
   ```

   This will create/update `dashboard/data/po_data.json` with the latest comparison data.

### Step 2: View the Dashboard

**Option A: Using Python HTTP Server (Recommended)**
```bash
cd "C:\Users\SARAVANANPS\Desktop\Innvo_26\Order Recon\dashboard"
python -m http.server 8000
```
Then open your browser to: `http://localhost:8000`

**Option B: Using VS Code Live Server**
1. Install "Live Server" extension in VS Code
2. Right-click on `index.html`
3. Select "Open with Live Server"

**Option C: Direct File Access**
- Simply open `dashboard/index.html` in your web browser
- Note: Some browsers may block local file access for security reasons

## Project Structure

```
Order Recon/
├── compare_po_numbers.py          # Original PO comparison script
├── extract_outlook_mail.py        # Outlook email extraction
├── generate_dashboard_data.py     # Dashboard data generator (NEW)
├── Webforms.xlsx                  # Source file 1
├── inflight.xlsx                  # Source file 2
├── swfroutmail.xlsx              # Source file 3
└── dashboard/                     # Web dashboard (NEW)
    ├── index.html                 # Main dashboard page
    ├── css/
    │   └── styles.css            # Dashboard styles
    ├── js/
    │   └── app.js                # Dashboard logic
    └── data/
        └── po_data.json          # Generated data file
```

## Deploying to GitHub Pages

### Step 1: Create GitHub Repository

1. Go to [GitHub](https://github.com) and create a new repository
2. Name it: `order-recon-dashboard`
3. Keep it public (required for free GitHub Pages)

### Step 2: Initialize Git and Push

```bash
cd "C:\Users\SARAVANANPS\Desktop\Innvo_26\Order Recon\dashboard"

# Initialize git repository
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit: Order Reconciliation Dashboard"

# Add remote (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/order-recon-dashboard.git

# Push to GitHub
git branch -M main
git push -u origin main
```

### Step 3: Enable GitHub Pages

1. Go to your repository on GitHub
2. Click **Settings** → **Pages**
3. Under "Source", select **main** branch
4. Click **Save**
5. Your dashboard will be available at: `https://YOUR_USERNAME.github.io/order-recon-dashboard/`

### Step 4: Update Data Regularly

To update the dashboard with new data:

```bash
# Generate new data
cd "C:\Users\SARAVANANPS\Desktop\Innvo_26\Order Recon"
python generate_dashboard_data.py

# Commit and push changes
cd dashboard
git add data/po_data.json
git commit -m "Update dashboard data - $(date)"
git push
```

The GitHub Pages site will automatically update within a few minutes.

## Automation Options

### Option 1: Windows Task Scheduler

Create a batch file `update_dashboard.bat`:

```batch
@echo off
cd "C:\Users\SARAVANANPS\Desktop\Innvo_26\Order Recon"
python generate_dashboard_data.py
cd dashboard
git add data/po_data.json
git commit -m "Auto-update dashboard data"
git push
```

Schedule it to run daily using Windows Task Scheduler.

### Option 2: GitHub Actions (Recommended)

Create `.github/workflows/update-data.yml` in your repository:

```yaml
name: Update Dashboard Data

on:
  schedule:
    - cron: '0 0 * * *'  # Run daily at midnight
  workflow_dispatch:  # Allow manual trigger

jobs:
  update:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.x'
      - name: Install dependencies
        run: pip install pandas openpyxl
      - name: Generate data
        run: python ../generate_dashboard_data.py
      - name: Commit changes
        run: |
          git config --local user.email "action@github.com"
          git config --local user.name "GitHub Action"
          git add data/po_data.json
          git commit -m "Auto-update dashboard data" || exit 0
          git push
```

## Customization

### Changing Data Sources

Edit `generate_dashboard_data.py` and update the file paths:

```python
WEBFORMS_FILE = r"path/to/your/Webforms.xlsx"
INFLIGHT_FILE = r"path/to/your/inflight.xlsx"
SWFROUTMAIL_FILE = r"path/to/your/swfroutmail.xlsx"
```

### Styling

Edit `dashboard/css/styles.css` to customize colors, fonts, and layout.

### Adding New Features

Edit `dashboard/js/app.js` to add new charts, tables, or functionality.

## Troubleshooting

### Issue: "Failed to load data"
**Solution:** Run `python generate_dashboard_data.py` to generate the data file.

### Issue: Charts not displaying
**Solution:** Ensure you're accessing the dashboard via HTTP server, not direct file access.

### Issue: CORS errors
**Solution:** Use Python HTTP server or VS Code Live Server instead of opening the HTML file directly.

### Issue: Data not updating on GitHub Pages
**Solution:** 
1. Clear your browser cache
2. Wait 5-10 minutes for GitHub Pages to rebuild
3. Check if the commit was successful on GitHub

## Technologies Used

- **Frontend:** HTML5, CSS3, JavaScript (ES6+)
- **Charts:** Chart.js 4.4.0
- **Backend:** Python 3.x
- **Data Processing:** pandas, openpyxl
- **Hosting:** GitHub Pages

## License

Created by Bob for Innvo_26 Order Reconciliation Project

## Support

For issues or questions, please create an issue on the GitHub repository.

---

**Last Updated:** 2026-04-16