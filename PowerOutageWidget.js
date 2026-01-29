// Power Outage Schedule Widget for Scriptable
// Displays power outage schedule from poweron.loe.lviv.ua

// CONFIGURATION
const GROUP_ID = "5.1"; // Change this to your group number (e.g., "1.1", "2.3", etc.)
const API_URL = "https://api.loe.lviv.ua/api/menus?page=1&type=photo-grafic";

// Create and configure widget
let widget = await createWidget();

if (config.runsInWidget) {
  Script.setWidget(widget);
} else {
  await widget.presentMedium();
}

Script.complete();

// Main function to create the widget
async function createWidget() {
  let widget = new ListWidget();

  try {
    // Fetch and parse schedule data
    let result = await fetchSchedule();
    let scheduleData = result.scheduleData;
    let todaySchedule = getTodaySchedule(scheduleData);

    // Configure widget appearance - Light theme
    widget.backgroundColor = new Color("#FFFFFF");
    widget.setPadding(16, 16, 16, 16);

    if (todaySchedule === null) {
      // Group not found - show error
      return createErrorWidget(widget, `Group ${GROUP_ID} not found`, "Check your group number");
    }

    // Get current status
    let status = getCurrentStatus(todaySchedule);
    let nextOutage = getNextOutage(todaySchedule);

    // Create header row with group and next outage
    let headerStack = widget.addStack();
    headerStack.layoutHorizontally();
    headerStack.centerAlignContent();

    // Left: Group number
    let groupText = headerStack.addText(`Group: ${GROUP_ID}`);
    groupText.font = Font.systemFont(16);
    groupText.textColor = Color.black();

    headerStack.addSpacer();

    // Right: Next outage info
    if (nextOutage) {
      let nextOutageText = headerStack.addText(`Next outage:\n${nextOutage.start} - ${nextOutage.end}`);
      nextOutageText.font = Font.systemFont(14);
      nextOutageText.textColor = Color.black();
      nextOutageText.rightAlignText();
    }

    widget.addSpacer(8);

    // Large status text
    let statusText = widget.addText(status.isOutage ? "Outage" : "Okay");
    statusText.font = Font.systemFont(48, true);
    statusText.textColor = status.isOutage ? new Color("#FF3B30") : new Color("#34C759");

    widget.addSpacer(16);

    // Timeline visualization
    createTimeline(widget, todaySchedule);

  } catch (error) {
    return createErrorWidget(widget, "Error loading", error.message);
  }

  return widget;
}

// Create error widget
function createErrorWidget(widget, title, message) {
  widget.backgroundColor = new Color("#FFFFFF");
  let errorText = widget.addText(`⚠️ ${title}`);
  errorText.font = Font.systemFont(14);
  errorText.textColor = new Color("#FF3B30");

  widget.addSpacer(4);

  let errorDetail = widget.addText(message);
  errorDetail.font = Font.systemFont(12);
  errorDetail.textColor = new Color("#8E8E93");

  return widget;
}

// Create timeline visualization
function createTimeline(widget, schedule) {
  let now = new Date();
  let currentHour = now.getHours();
  let currentMinute = now.getMinutes();
  let currentTimeInMinutes = currentHour * 60 + currentMinute;

  // Create 24-hour timeline (0-1440 minutes)
  let timeline = new Array(24).fill('on'); // Default: power is on

  // Mark outage periods (past, current, and upcoming)
  for (let outage of schedule) {
    let [startHour, startMin] = outage.start.split(':').map(Number);
    let [endHour, endMin] = outage.end.split(':').map(Number);

    let startTimeInMinutes = startHour * 60 + startMin;
    let endTimeInMinutes = endHour * 60 + endMin;

    let startHourBlock = Math.floor(startTimeInMinutes / 60);
    let endHourBlock = Math.ceil(endTimeInMinutes / 60);

    // Mark hours as outage
    for (let h = startHourBlock; h < endHourBlock && h < 24; h++) {
      let blockStart = h * 60;
      let blockEnd = (h + 1) * 60;

      // Check if this hour block overlaps with the outage
      if (blockStart < endTimeInMinutes && blockEnd > startTimeInMinutes) {
        // Determine if this is past, current, or upcoming outage
        if (currentTimeInMinutes >= startTimeInMinutes && currentTimeInMinutes < endTimeInMinutes) {
          // Currently in this outage
          timeline[h] = 'outage-current';
        } else if (currentTimeInMinutes < startTimeInMinutes) {
          // Outage hasn't started yet
          timeline[h] = 'outage-upcoming';
        } else if (currentTimeInMinutes >= endTimeInMinutes) {
          // Outage has already passed
          timeline[h] = 'outage-past';
        }
      }
    }
  }

  // Container for timeline with indicator
  let timelineContainer = widget.addStack();
  timelineContainer.layoutVertically();

  // Current time indicator (dot above timeline)
  let indicatorRow = timelineContainer.addStack();
  indicatorRow.layoutHorizontally();
  indicatorRow.spacing = 2;

  for (let hour = 0; hour < 24; hour++) {
    let spacer = indicatorRow.addStack();
    spacer.size = new Size(11, 8);

    if (hour === currentHour) {
      let dotContainer = spacer;
      dotContainer.layoutVertically();
      dotContainer.bottomAlignContent();
      dotContainer.centerAlignContent();

      let dot = dotContainer.addStack();
      dot.size = new Size(6, 6);
      dot.cornerRadius = 3;
      dot.backgroundColor = new Color("#34C759");
    }
  }

  timelineContainer.addSpacer(2);

  // Draw timeline bars
  let barsRow = timelineContainer.addStack();
  barsRow.layoutHorizontally();
  barsRow.spacing = 2;

  for (let hour = 0; hour < 24; hour++) {
    let bar = barsRow.addStack();
    bar.size = new Size(11, 12);
    bar.cornerRadius = 2;

    // Color based on status
    if (timeline[hour] === 'outage-current') {
      bar.backgroundColor = new Color("#FF3B30"); // Red for current outage
    } else if (timeline[hour] === 'outage-upcoming') {
      bar.backgroundColor = new Color("#FF9500"); // Orange for upcoming outage
    } else if (timeline[hour] === 'outage-past') {
      bar.backgroundColor = new Color("#C7C7CC"); // Gray for past outage
    } else {
      bar.backgroundColor = new Color("#34C759"); // Green for power on
    }
  }

  widget.addSpacer(4);

  // Draw hour labels at 6, 12, 18, 24
  let labelsStack = widget.addStack();
  labelsStack.layoutHorizontally();

  // Calculate spacing for labels
  // Each bar is 11px wide + 2px spacing = 13px per hour
  let barWidth = 13;

  // Labels at hours 6, 12, 18, and 24 (end)
  let labelPositions = [
    { hour: 6, text: "6" },
    { hour: 12, text: "12" },
    { hour: 18, text: "18" },
    { hour: 24, text: "24" }  // Position at the end (after hour 23)
  ];

  let lastPosition = 0;

  for (let i = 0; i < labelPositions.length; i++) {
    let labelInfo = labelPositions[i];
    let position = labelInfo.hour;

    // Add spacer before label to position it correctly
    if (position > lastPosition) {
      labelsStack.addSpacer((position - lastPosition) * barWidth);
    }

    // Add label
    let labelText = labelsStack.addText(labelInfo.text);
    labelText.font = Font.systemFont(11);
    labelText.textColor = new Color("#8E8E93");
    labelText.textOpacity = 0.6;

    lastPosition = position;
  }
}

// Get next upcoming outage (not current)
function getNextOutage(schedule) {
  let now = new Date();
  let currentTimeInMinutes = now.getHours() * 60 + now.getMinutes();

  for (let outage of schedule) {
    let [startHour, startMin] = outage.start.split(':').map(Number);
    let startTimeInMinutes = startHour * 60 + startMin;

    // Find next outage that hasn't started yet
    if (currentTimeInMinutes < startTimeInMinutes) {
      return outage;
    }
  }

  return null;
}

// Fetch schedule from API
async function fetchSchedule() {
  try {
    let req = new Request(API_URL);
    let json = await req.loadJSON();

    // Find the menu with type "photo-grafic"
    let menu = json["hydra:member"]?.find(m => m.type === "photo-grafic");
    if (!menu || !menu.menuItems) {
      throw new Error("Menu not found");
    }

    // Find today's schedule - look for items matching today's date
    let today = new Date();
    let dateStr = formatDate(today);

    console.log(`Looking for schedule for date: ${dateStr}`);
    console.log(`Total menu items: ${menu.menuItems.length}`);

    // Find all items that match today's date in rawHtml
    let matchingItems = menu.menuItems.filter(item => {
      if (!item.rawHtml) return false;

      // Check if rawHtml contains today's date
      let hasDate = item.rawHtml.includes(dateStr);

      if (hasDate) {
        console.log(`Found matching item: ${item.name}, id: ${item.id}`);
      }

      return hasDate;
    });

    // Sort by ID (descending) to get the latest schedule
    matchingItems.sort((a, b) => b.id - a.id);

    let todayItem = matchingItems[0];

    if (!todayItem || !todayItem.rawHtml) {
      // Fallback: try item named "Today" or first item
      todayItem = menu.menuItems.find(item =>
        item.name === "Today" || item.name === "Сьогодні"
      ) || menu.menuItems[0];

      if (!todayItem || !todayItem.rawHtml) {
        throw new Error(`Schedule not found for ${dateStr}`);
      }

      console.log(`Using fallback item: ${todayItem.name}`);
    } else {
      console.log(`Using schedule from item: ${todayItem.name} (${dateStr})`);
    }

    // Parse the rawHtml to extract schedule
    let scheduleData = parseRawHtml(todayItem.rawHtml);

    console.log(`Fetched schedule for ${Object.keys(scheduleData).length} groups`);
    console.log(`Group ${GROUP_ID} schedule:`, JSON.stringify(scheduleData[GROUP_ID]));

    return {
      scheduleData: scheduleData
    };
  } catch (error) {
    console.error("Error fetching schedule:", error);
    throw new Error("Failed to load schedule");
  }
}

// Format date as DD.MM.YYYY
function formatDate(date) {
  let day = String(date.getDate()).padStart(2, '0');
  let month = String(date.getMonth() + 1).padStart(2, '0');
  let year = date.getFullYear();
  return `${day}.${month}.${year}`;
}

// Parse rawHtml to extract schedule for all groups
function parseRawHtml(html) {
  let scheduleData = {};

  // Pattern: "Група X.X. Електроенергія є." (power available - no outages)
  // Pattern: "Група X.X. Електроенергії немає з HH:MM до HH:MM." (power unavailable)
  // Pattern: "Група X.X. Електроенергії немає з HH:MM до HH:MM, з HH:MM до HH:MM." (multiple outages)

  // Remove HTML tags for easier parsing
  let text = html.replace(/<[^>]*>/g, '\n').replace(/\s+/g, ' ').trim();

  console.log("Parsed text sample:", text.substring(0, 200));

  // Find all group entries - simpler pattern that splits by lines
  let lines = html.split(/<\/?p>/g);

  for (let line of lines) {
    // Clean the line
    line = line.replace(/<[^>]*>/g, '').trim();

    // Skip empty lines and headers
    if (!line || line.includes('Графік') || line.includes('Інформація')) {
      continue;
    }

    // Match group pattern: "Група X.X. ..."
    let groupMatch = line.match(/Група\s*([\d\.]+)\.\s*(.+)/i);

    if (groupMatch) {
      let groupId = groupMatch[1];
      let groupText = groupMatch[2];

      console.log(`Found group ${groupId}: ${groupText.substring(0, 50)}`);

      // Check if power is available (no outages)
      if (groupText.includes('Електроенергія є') || groupText.includes('електроенергія є')) {
        scheduleData[groupId] = [];
        continue;
      }

      // Extract outage times
      let times = [];
      let timePattern = /з\s*(\d{1,2}:\d{2})\s*до\s*(\d{1,2}:\d{2})/gi;
      let timeMatch;

      while ((timeMatch = timePattern.exec(groupText)) !== null) {
        times.push({
          start: timeMatch[1],
          end: timeMatch[2]
        });
      }

      scheduleData[groupId] = times;
    }
  }

  console.log("Total groups found:", Object.keys(scheduleData).length);

  return scheduleData;
}

// Get today's schedule for configured group
function getTodaySchedule(scheduleData) {
  let groupSchedule = scheduleData[GROUP_ID];

  if (groupSchedule === undefined) {
    console.log(`No schedule found for group ${GROUP_ID}`);
    console.log("Available groups:", Object.keys(scheduleData).join(", "));
    return null;
  }

  // scheduleData[GROUP_ID] is already an array of {start, end} objects
  // or an empty array if no outages
  return groupSchedule;
}

// Determine current outage status
function getCurrentStatus(schedule) {
  let now = new Date();
  let currentHour = now.getHours();
  let currentMinute = now.getMinutes();
  let currentTime = currentHour * 60 + currentMinute; // Current time in minutes

  let isOutage = false;

  for (let event of schedule) {
    let [startHour, startMin] = event.start.split(':').map(Number);
    let [endHour, endMin] = event.end.split(':').map(Number);

    let startTime = startHour * 60 + startMin;
    let endTime = endHour * 60 + endMin;

    // Check if we're currently in an outage
    if (currentTime >= startTime && currentTime < endTime) {
      isOutage = true;
      break;
    }
  }

  return {
    isOutage: isOutage
  };
}
