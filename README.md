# Power Outage Widget for Scriptable

[![Platform](https://img.shields.io/badge/platform-iOS-lightgrey.svg)](https://www.apple.com/ios/)
[![Scriptable](https://img.shields.io/badge/Scriptable-compatible-blue.svg)](https://scriptable.app/)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

A beautiful iOS widget for [Scriptable](https://scriptable.app/) that displays power outage schedules from Lviv Oblast Energy (ЛьвівОбленерго) with a 24-hour timeline visualization.

## Preview

<!-- Add your widget screenshot here -->
The widget features a clean, light interface with a 24-hour timeline showing power status throughout the day.

## Features

- ⚡ **Real-time Status**: Clear "Okay" or "Outage" text in green/red
- 📊 **24-Hour Timeline**: Visual bar chart showing power status throughout the day
- ⏰ **Next Outage Display**: Shows the next scheduled outage, even if it's tomorrow
- 🎯 **Current Time Indicator**: Green dot showing your current position in the day
- 📅 **Multi-day Support**: Automatically fetches tomorrow's schedule when today's outages are done
- 🎨 **Clean Design**: Light theme with intuitive color coding
- 🔍 **Accurate Date Matching**: Always shows the correct day's schedule
- ⚙️ **Easy Configuration**: Just set your group number

## Design

The widget features a clean, light interface with:

- **Light background**: Clean white background for better visibility
- **Timeline visualization**: 24-hour bar chart showing the entire day
  - 🟢 **Green bars** = Power is ON
  - ⚪ **Gray bars** = Past outage (already happened earlier today)
  - 🔴 **Red bars** = Current outage (happening now)
  - 🟠 **Orange bars** = Upcoming outage (not started yet)
- **Current time indicator**: Green dot positioned above the current hour
- **Large status text**: "Okay" (green) or "Outage" (red) at a glance
- **Next outage info**: Shows when the next planned outage will occur

## Installation

### Step 1: Install Scriptable

Download [Scriptable](https://scriptable.app/) from the App Store (free).

### Step 2: Create the Script

1. Open the Scriptable app
2. Tap the **"+"** button (top right) to create a new script
3. Copy the entire content of `PowerOutageWidget.js`
4. Paste it into the new script
5. Tap the script name at the top and rename it (e.g., "Power Schedule")
6. Tap **Done** to save

### Step 3: Configure Your Group

1. In the script, find line 5:
   ```javascript
   const GROUP_ID = "1.1"; // Change this to your group number
   ```

2. Change `"1.1"` to your actual group number:
   - Format: `"1.1"`, `"2.3"`, `"3.2"`, etc.
   - Must match exactly what's shown on https://poweron.loe.lviv.ua/

3. Save the script

### Step 4: Add Widget to Home Screen

1. **Long press** on your iPhone home screen to enter edit mode
2. Tap the **"+"** button in the top-left corner
3. Search for **"Scriptable"**
4. Select the **Medium** widget size (required for this design)
5. Drag the widget to your desired position
6. Tap the widget while still in edit mode
7. In the widget configuration:
   - **Script**: Select your script name
   - **When Interacting**: Choose "Run Script" (optional)
8. Tap outside to exit edit mode

**Important**: This widget requires the **Medium** size to display properly. Small or Large sizes won't look correct.

## Usage

### Reading the Widget

**Top Left:**
- **Group: X.X** - Your configured group number

**Top Right:**
- **Power back: HH:MM** - Shown **only** when you're currently in an outage (end time of the current outage)
- **Next outage: HH:MM - HH:MM** - Shown when you're **not** in an outage and there is an upcoming outage
- If there are no upcoming outages today, it can show **Tomorrow HH:MM - HH:MM**

**Center:**
- **Okay** (green) - Power is currently on
- **Outage** (red) - Power is currently off

**Timeline Bar:**
- Shows all 24 hours of the day (00:00 to 23:59)
- Each block represents one hour
- Green dot indicates the **current hour** (not minute-accurate)
- Hour labels below show key times (0, 6, 12, 18, 24)

**Example Timeline:**
```
        •  (green dot at current hour)
████ ██ ██ ░░░░ ████ ████
0    6  12 18   24
```
- █ = Power ON (green)
- █ = Upcoming outage (orange)
- ░ = Current outage (red)

### Special Messages

- **Group X.X not found** - Your GROUP_ID doesn't match any group in today's schedule
- **Error loading** - Network error or API unavailable

## Troubleshooting

### Widget Shows "Group not found"

**Solutions:**
1. Verify your group number format: `"1.1"`, `"2.3"`, etc. (must include quotes)
2. Check https://poweron.loe.lviv.ua/ for your correct group number
3. Make sure there are no spaces or extra characters in GROUP_ID
4. Run the script in Scriptable app and check console logs for available groups

**To see all available groups:**
1. Open Scriptable app
2. Tap your script to run it
3. Check the console output for "Available groups: ..."
4. Use one of the listed group IDs

### Timeline Colors Don't Look Right

The timeline uses three colors:
- **Green**: Normal operation (power available)
- **Orange**: Outage scheduled but not started yet
- **Red**: Outage happening right now

If colors seem wrong:
1. Check your device time is correct
2. Verify the schedule data is for today
3. Run the script manually to see console output

### Widget Doesn't Fit / Looks Broken

This widget is designed for **Medium** size only:
1. Long press the widget
2. Edit Widget
3. Remove and re-add as Medium size
4. Don't use Small or Large sizes

### Widget Shows Old Data

iOS controls widget refresh timing. You cannot force constant updates, but you can:

**Manual refresh:**
1. Open Scriptable app
2. Run the script manually to see latest data
3. Long press widget → Edit Widget → Done (sometimes triggers refresh)

**Improve refresh rate:**
1. Settings → Scriptable → Background App Refresh (enable)
2. Keep your device charged (iOS refreshes more often when plugged in)
3. Use the widget regularly (iOS learns your usage patterns)

### Next Outage Not Showing

This is normal if:
- All scheduled outages for today have already passed
- There are no outages scheduled for today
- Currently in the last outage of the day

The "Next outage" field only shows **upcoming** outages (not current or past). If you're currently in an outage, the widget shows **Power back: HH:MM** instead.

## Customization

### Change Widget Language

Replace English text with your preferred language in the script:

```javascript
// Find these lines and change the text:
`Group: ${GROUP_ID}` → `Група: ${GROUP_ID}`
"Next outage:" → "Наступне вимкнення:"
"Okay" → "Увімкнено"
"Outage" → "Вимкнено"
"not found" → "не знайдена"
"Error loading" → "Помилка завантаження"
```

### Change Colors

Edit the color codes in the `createTimeline` function:

```javascript
// Green (power on)
new Color("#34C759")

// Orange (upcoming outage)
new Color("#FF9500")

// Red (current outage)
new Color("#FF3B30")

// Background
widget.backgroundColor = new Color("#FFFFFF")
```

### Adjust Timeline Bar Size

In the `createTimeline` function, find:

```javascript
bar.size = new Size(11, 12);
```

Change `11` (width) and `12` (height) to your preferred dimensions. Note: Smaller bars may make the timeline harder to read.

## Technical Details

### Data Source

Uses the official Lviv Oblast Energy API:
```
https://api.loe.lviv.ua/api/menus?page=1&type=photo-grafic
```

### How It Works

1. **Fetch**: Downloads today's schedule from the API in JSON format
2. **Parse**: Extracts schedule from the `rawHtml` field in the response
3. **Process**: Converts time ranges into hourly blocks for the 24-hour timeline
4. **Classify**: Determines if each hour is on/upcoming outage/current outage
5. **Render**: Draws the widget with appropriate colors and current time indicator

### Schedule Format

The API returns Ukrainian text in rawHtml:
```
Група 1.1. Електроенергія є.
Група 1.2. Електроенергії немає з 03:00 до 06:30.
Група 2.1. Електроенергії немає з 08:00 до 11:00, з 16:00 до 19:00.
```

Parsed as:
- **"Електроенергія є"** → No outages (empty array)
- **"немає з HH:MM до HH:MM"** → Outage period
- Multiple periods separated by commas are supported

### Timeline Algorithm

- Divides the day into 24 hour-blocks
- Each outage period marks affected hours
- Current time determines color:
  - Before outage start → Orange
  - During outage → Red
  - No outage → Green
- Past outages are Gray

### Privacy

- All data processing happens locally on your device
- Only connects to official Lviv Oblast Energy API
- No analytics, tracking, or third-party services
- Your group number is only used for filtering display data

## FAQ

**Q: Can I monitor multiple groups?**
A: Create separate copies of the script with different GROUP_ID values, then add multiple widgets to your home screen.

**Q: Why Medium widget size only?**
A: The timeline with 24 hour-blocks needs horizontal space. Small widgets are too narrow, and the design isn't optimized for Large widgets.

**Q: Does this work for other regions?**
A: No, this is specifically for Lviv Oblast (ЛьвівОбленерго). Other Ukrainian regions use different systems.

**Q: How accurate is the timeline?**
A: Very accurate - it uses official data from the energy provider. However, unplanned outages won't appear.

**Q: Can I see tomorrow's schedule?**
A: Yes! The widget automatically fetches tomorrow's schedule. When all of today's outages have passed, the "Next outage" section will show the first outage from tomorrow with a "Tomorrow" prefix.

**Q: The timeline shows all green but "Next outage" says 15:00?**
A: The current time indicator might not be visible if it's at the beginning of the day. The green dot only appears above the current hour.

**Q: Why are some bars orange and some red?**
A: Orange = scheduled outage that hasn't started yet. Red = outage happening right now.

**Q: What happens at midnight?**
A: The widget will show an error until the API updates with the new day's schedule (usually happens early morning).

## Support

If you encounter issues:

1. **Run in Scriptable**: Open the app and run the script to see console logs
2. **Check group ID**: Verify GROUP_ID matches exactly
3. **Test API**: Open the API URL in Safari to confirm it's accessible
4. **Check time**: Make sure your device time/date is correct

## Version History

**v2.1** - Enhanced features (January 2026)
- Tomorrow's schedule support - shows next outage even if it's tomorrow
- Improved date matching - prevents showing wrong day's schedule
- Past outage visualization - gray bars for outages that already happened
- Update time tracking - logs when schedule was last updated
- Better layout - optimized spacing and text sizes
- Hour labels starting from 0 (0, 6, 12, 18, 24)

**v2.0** - Design update
- Light theme design
- 24-hour timeline visualization
- Current time indicator
- Color-coded outage status (green/orange/red/gray)
- English language by default

**v1.0** - Initial release
- Basic schedule display
- Dark theme
- Ukrainian language

## Credits

- Data provided by ЛьвівОбленерго (Lviv Oblast Energy)
- Widget created for iOS Scriptable app
- Design inspired by modern power monitoring dashboards

## License

Free to use and modify for personal use.
