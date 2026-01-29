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
    let tomorrowSchedule = result.tomorrowSchedule;
    let updateTime = result.updateTime;
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
    let nextOutage = getNextOutage(todaySchedule, tomorrowSchedule);

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
      let rightStack = headerStack.addStack();
      rightStack.layoutVertically();

      let labelText = rightStack.addText("Next outage:");
      labelText.font = Font.systemFont(12);
      labelText.textColor = Color.black();
      labelText.rightAlignText();

      let timeText = nextOutage.isTomorrow
        ? `Tomorrow ${nextOutage.start} - ${nextOutage.end}`
        : `${nextOutage.start} - ${nextOutage.end}`;
      let outageTime = rightStack.addText(timeText);
      outageTime.font = Font.boldSystemFont(14);
      outageTime.textColor = Color.black();
      outageTime.rightAlignText();
    }

    widget.addSpacer(8);

    // Large status text
    let statusText = widget.addText(status.isOutage ? "Outage" : "Okay");
    statusText.font = Font.systemFont(36, true);
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

  widget.addSpacer(6);

  // Draw hour labels starting from 0
  let labelsStack = widget.addStack();
  labelsStack.layoutHorizontally();

  // Labels evenly spaced
  let labels = ["0", "6", "12", "18", "24"];

  for (let i = 0; i < labels.length; i++) {
    if (i > 0) {
      labelsStack.addSpacer(); // Flexible spacer
    }

    let labelText = labelsStack.addText(labels[i]);
    labelText.font = Font.boldSystemFont(12);
    labelText.textColor = new Color("#8E8E93");
  }
}

// Get next upcoming outage (not current), checking tomorrow if needed
function getNextOutage(todaySchedule, tomorrowSchedule) {
  let now = new Date();
  let currentTimeInMinutes = now.getHours() * 60 + now.getMinutes();

  // Check today's schedule first
  for (let outage of todaySchedule) {
    let [startHour, startMin] = outage.start.split(':').map(Number);
    let startTimeInMinutes = startHour * 60 + startMin;

    // Find next outage that hasn't started yet
    if (currentTimeInMinutes < startTimeInMinutes) {
      return { ...outage, isTomorrow: false };
    }
  }

  // No more outages today, check tomorrow's schedule
  if (tomorrowSchedule && tomorrowSchedule.length > 0) {
    // Return the first outage from tomorrow
    return { ...tomorrowSchedule[0], isTomorrow: true };
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

    // Find today's schedule - look for items matching today's date ONLY
    let today = new Date();
    let dateStr = formatDate(today);

    console.log(`Today's date: ${dateStr}`);
    console.log(`Total menu items: ${menu.menuItems.length}`);

    // Find all items that match today's date in rawHtml
    let matchingItems = menu.menuItems.filter(item => {
      if (!item.rawHtml) return false;

      // Extract the date from the schedule header
      let dateMatch = item.rawHtml.match(/Графік погодинних відключень на\s*(\d{2}\.\d{2}\.\d{4})/);
      let scheduleDate = dateMatch ? dateMatch[1] : null;

      console.log(`Item ${item.id} (${item.name}): schedule date = ${scheduleDate}`);

      // Only match if the schedule date exactly matches today's date
      if (scheduleDate === dateStr) {
        console.log(`✓ Matched! Using item ${item.id} for ${dateStr}`);
        return true;
      }

      return false;
    });

    // Sort by ID (descending) to get the latest schedule for today
    matchingItems.sort((a, b) => b.id - a.id);

    let todayItem = matchingItems[0];

    if (!todayItem || !todayItem.rawHtml) {
      // No schedule found for today - don't fall back to other dates
      throw new Error(`Schedule not available for ${dateStr} yet`);
    }

    console.log(`Using schedule from item: ${todayItem.name} (${dateStr})`);

    // Parse the rawHtml to extract schedule
    let scheduleData = parseRawHtml(todayItem.rawHtml);

    // Extract update time from rawHtml
    let updateTime = extractUpdateTime(todayItem.rawHtml);

    console.log(`Fetched schedule for ${Object.keys(scheduleData).length} groups`);
    console.log(`Group ${GROUP_ID} schedule:`, JSON.stringify(scheduleData[GROUP_ID]));
    console.log(`Last updated: ${updateTime}`);

    // Also try to fetch tomorrow's schedule
    let tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    let tomorrowDateStr = formatDate(tomorrow);

    console.log(`Looking for tomorrow's schedule: ${tomorrowDateStr}`);

    let tomorrowItems = menu.menuItems.filter(item => {
      if (!item.rawHtml) return false;
      let dateMatch = item.rawHtml.match(/Графік погодинних відключень на\s*(\d{2}\.\d{2}\.\d{4})/);
      let scheduleDate = dateMatch ? dateMatch[1] : null;
      return scheduleDate === tomorrowDateStr;
    });

    tomorrowItems.sort((a, b) => b.id - a.id);
    let tomorrowItem = tomorrowItems[0];

    let tomorrowScheduleData = null;
    if (tomorrowItem && tomorrowItem.rawHtml) {
      console.log(`Found tomorrow's schedule: ${tomorrowItem.name}`);
      let tomorrowData = parseRawHtml(tomorrowItem.rawHtml);
      tomorrowScheduleData = tomorrowData[GROUP_ID] || [];
    } else {
      console.log(`Tomorrow's schedule not available yet`);
      tomorrowScheduleData = [];
    }

    return {
      scheduleData: scheduleData,
      tomorrowSchedule: tomorrowScheduleData,
      updateTime: updateTime
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

// Extract update time from rawHtml
function extractUpdateTime(html) {
  // Pattern: "Інформація станом на HH:MM DD.MM.YYYY"
  let timePattern = /Інформація станом на\s*(\d{1,2}:\d{2})\s*(\d{1,2}\.\d{1,2}\.\d{4})/i;
  let match = html.match(timePattern);

  if (match) {
    return `${match[1]} ${match[2]}`; // Return "HH:MM DD.MM.YYYY"
  }

  return null;
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
