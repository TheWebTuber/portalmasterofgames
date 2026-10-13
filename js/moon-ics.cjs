const fs = require("fs");
const path = require("path");

const {
  availability,
  SCHEDULE,
} = require("../js/calendar.js");

const OUTPUT = path.join(__dirname, "..", "calendar", "moon.ics");

function parseDate(s) {
  return new Date(`${s}T12:00:00Z`);
}

function iso(d) {
  return d.toISOString().slice(0, 10);
}

function shiftDate(date, days) {
  const d = parseDate(date);
  d.setUTCDate(d.getUTCDate() + days);
  return iso(d);
}

function compactDate(date, time) {
  return `${date.replaceAll("-", "")}T${time.replace(":", "")}00`;
}

function escapeICS(text) {
  return String(text)
    .replaceAll("\\", "\\\\")
    .replaceAll("\n", "\\n")
    .replaceAll(",", "\\,")
    .replaceAll(";", "\\;");
}

const windows = new Map();

let date = SCHEDULE.start;

while (date <= SCHEDULE.end) {
  const info = availability(date);

  if (info.free && info.window) {
    const w = info.window;

    const key =
      `${w.start}-${w.startTime}-` +
      `${w.end}-${w.endTime}`;

    if (!windows.has(key)) {
      windows.set(key, w);
    }
  }

  date = shiftDate(date, 1);
}

const now = new Date()
  .toISOString()
  .replace(/[-:]/g, "")
  .replace(/\.\d{3}Z$/, "Z");

const lines = [
  "BEGIN:VCALENDAR",
  "VERSION:2.0",
  "PRODID:-//PortalMasterOfGames//Howling Hours//EN",
  "CALSCALE:GREGORIAN",
  "METHOD:PUBLISH",
  "X-WR-CALNAME:Howling Hours",
  "X-WR-TIMEZONE:Europe/Amsterdam",
  "REFRESH-INTERVAL;VALUE=DURATION:PT6H",
  "X-PUBLISHED-TTL:PT6H",

  "BEGIN:VTIMEZONE",
  "TZID:Europe/Amsterdam",

  "BEGIN:DAYLIGHT",
  "TZOFFSETFROM:+0100",
  "TZOFFSETTO:+0200",
  "TZNAME:CEST",
  "DTSTART:19700329T020000",
  "RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=-1SU",
  "END:DAYLIGHT",

  "BEGIN:STANDARD",
  "TZOFFSETFROM:+0200",
  "TZOFFSETTO:+0100",
  "TZNAME:CET",
  "DTSTART:19701025T030000",
  "RRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU",
  "END:STANDARD",

  "END:VTIMEZONE",
];

for (const w of windows.values()) {
  const uid =
    `howling-hours-${w.start}-` +
    `${w.startTime.replace(":", "")}` +
    "@pmog.creatorpromote.com";

  lines.push(
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${now}`,
    `DTSTART;TZID=Europe/Amsterdam:${compactDate(w.start, w.startTime)}`,
    `DTEND;TZID=Europe/Amsterdam:${compactDate(w.end, w.endTime)}`,
    "SUMMARY:Portal is free to play",
    `DESCRIPTION:${escapeICS(
      `Continuous gaming availability. Amsterdam time. ` +
      `See https://pmog.creatorpromote.com/moon for the live schedule.`
    )}`,
    "URL:https://pmog.creatorpromote.com/moon",
    "STATUS:CONFIRMED",
    "TRANSP:TRANSPARENT",
    "END:VEVENT"
  );
}

lines.push("END:VCALENDAR");

fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });

fs.writeFileSync(
  OUTPUT,
  lines.join("\r\n") + "\r\n",
  "utf8"
);

console.log(
  `Generated ${windows.size} free-time windows → ${OUTPUT}`
);