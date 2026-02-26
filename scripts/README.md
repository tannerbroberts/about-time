# About Time - Scripts

This directory contains utility scripts for managing and migrating data.

## Export localStorage Data

The `export-localStorage.html` file is a standalone HTML tool for exporting your About Time data from the browser's localStorage.

### Usage

1. **Open the file in your browser:**
   - Double-click `export-localStorage.html` to open it in your default browser
   - OR use the same browser where you use About Time

2. **Analyze your data:**
   - Click "Analyze Data" to see what data is available
   - The tool will show:
     - Number of templates
     - Number of scheduled days
     - Whether daily goals exist
     - Number of days with meal tracking data

3. **Export to JSON:**
   - Click "Export to JSON" to download your data
   - The file will be saved to your Downloads folder
   - File name format: `about-time-export-YYYY-MM-DD.json`

### What Gets Exported

The export includes:
- **Templates**: All meal templates (busy and lane types)
- **Schedule Lanes**: All scheduled days with assigned lanes
- **Daily Goals**: Your daily nutrition goals (calories, protein, carbs, fats)
- **Daily States**: All days with completed/skipped meal tracking

### Export Format

```json
{
  "exportDate": "2024-02-26T12:00:00.000Z",
  "version": "1.0",
  "data": {
    "templates": { ... },
    "scheduleLanes": { ... },
    "dailyGoals": { ... },
    "dailyStates": [ ... ]
  }
}
```

## Use Cases

### 1. Backup Before Migration

Export your data before migrating to the cloud:
```bash
# 1. Open export-localStorage.html
# 2. Click "Export to JSON"
# 3. Save the file as backup
# 4. Login to About Time and use the migration banner
```

### 2. Manual Data Import

If automatic migration fails, you can manually import the exported JSON:
```bash
# Use the exported JSON with the migration API
curl -X POST https://api.about-time.app/api/migrate \
  -H "Content-Type: application/json" \
  -H "Cookie: session_id=..." \
  -d @about-time-export-2024-02-26.json
```

### 3. Transfer Between Browsers

Export data from one browser and import to another:
```bash
# Browser A: Export data
# Browser B: Login and use migration banner with exported file (manual upload feature to be added)
```

### 4. Data Recovery

If you accidentally clear your browser data:
```bash
# Restore from a previous export
# (requires manual API call or future restore feature)
```

## Migration Flow

The typical migration flow is:

```
┌─────────────────┐
│  localStorage   │ ← Old storage (browser-only)
└────────┬────────┘
         │
         │ 1. Export (optional backup)
         │
         ▼
┌─────────────────┐
│  JSON File      │ ← Backup copy
└─────────────────┘
         │
         │ 2. Migrate (automatic in app)
         │
         ▼
┌─────────────────┐
│  Backend API    │ ← New storage (cloud + sync)
│  + IndexedDB    │    (with offline support)
└─────────────────┘
```

## Troubleshooting

### No data found

**Problem:** The export tool shows 0 items.

**Solutions:**
- Make sure you're using the same browser where you use About Time
- Check if you're using the same browser profile (not incognito/private mode)
- Verify localStorage is enabled in your browser settings

### Export fails

**Problem:** Clicking "Export to JSON" shows an error.

**Solutions:**
- Check browser console for error details (F12 → Console)
- Try exporting with a different browser
- Contact support with the error message

### Exported file is empty

**Problem:** The exported JSON file has no data in the `data` field.

**Solutions:**
- You may not have any data in localStorage yet
- Try creating some templates in the app first
- Check if you're exporting from the correct browser

## Security Note

The export file contains your personal nutrition data. Keep it secure:
- Don't share exported files publicly
- Store backups in a secure location
- Delete old export files you no longer need
- Use encryption if storing exports in the cloud

## Future Features

Planned improvements:
- [ ] Import from JSON file (manual restore)
- [ ] Automatic scheduled backups
- [ ] Data validation before import
- [ ] Conflict resolution for duplicate data
- [ ] Progress indicator for large exports
- [ ] Selective export (choose what to export)
