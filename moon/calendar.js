'use strict';

// Shared schedule: edit these dates/rules here, then republish for all friends.
const SCHEDULE = {
  start: '2026-01-01',
  end: '2027-09-05',
  fridayStart: '18:30',
  stop: '23:00',
  zone: 'Europe/Amsterdam'
};

const SPECIAL_DAYS = [
  ['2026-01-01', '2026-01-01', 'New Year’s Day'],
  ['2026-04-03', '2026-04-03', 'Good Friday'],
  ['2026-04-06', '2026-04-06', 'Easter Monday'],
  ['2026-04-27', '2026-04-27', 'King’s Day'],
  ['2026-05-05', '2026-05-05', 'Liberation Day'],
  ['2026-05-14', '2026-05-14', 'Ascension Day'],
  ['2026-05-25', '2026-05-25', 'Whit Monday'],
  ['2026-12-25', '2026-12-25', 'Christmas Day'],
  ['2026-12-26', '2026-12-26', 'Second Christmas Day'],
  ['2027-01-01', '2027-01-01', 'New Year’s Day']
];

const BREAKS = [
  // Added: free from Monday 12 October through Sunday 18 October 2026.
  ['2026-10-12', '2026-10-18', 'October open week'],

  ['2026-12-21', '2027-01-03', 'Christmas break'],
  ['2027-03-26', '2027-03-26', 'Good Friday'],
  ['2027-03-28', '2027-03-29', 'Easter'],
  ['2027-04-26', '2027-04-26', 'AHA day off'],
  ['2027-04-27', '2027-04-27', 'King’s Day'],
  ['2027-04-28', '2027-05-02', 'May break'],
  ['2027-05-05', '2027-05-05', 'Liberation Day'],
  ['2027-05-06', '2027-05-06', 'Ascension Day'],
  ['2027-05-07', '2027-05-07', 'AHA day off'],
  ['2027-05-16', '2027-05-17', 'Pentecost'],
  ['2027-07-19', '2027-08-22', 'Summer break']
];

const BLOCKS = [
  ['2026-08-31', '2026-11-06', 'Hunting period 1'],
  ['2026-11-09', '2027-01-29', 'Hunting period 2'],
  ['2027-02-01', '2027-04-09', 'Hunting period 3'],
  ['2027-04-12', '2027-07-09', 'Hunting period 4'],
  ['2027-07-12', '2027-09-03', 'Hunting period 5'],
  ['2027-08-23', '2027-08-29', 'Back to the hunt'],
  ['2027-08-30', '2027-09-05', 'New trails']
];

const parse = s => new Date(s + 'T12:00:00Z');

const iso = d => d.toISOString().slice(0, 10);

const format = (s, options) =>
  new Intl.DateTimeFormat('en-GB', {
    timeZone: 'UTC',
    ...options
  }).format(parse(s));

function shiftDate(date, days) {
  const d = parse(date);
  d.setUTCDate(d.getUTCDate() + days);
  return iso(d);
}

function dayKind(date) {
  if (date < SCHEDULE.start || date > SCHEDULE.end) {
    return { kind: 'closed' };
  }

  const holiday = [...SPECIAL_DAYS, ...BREAKS].find(
    ([a, b]) => date >= a && date <= b
  );

  const weekday = parse(date).getUTCDay();

  return {
    kind:
      holiday || weekday === 0 || weekday === 6
        ? 'full'
        : weekday === 5
          ? 'evening'
          : 'closed',

    holiday: holiday?.[2]
  };
}

function freeWindow(date) {
  let start = date;
  let end = date;

  while (
    dayKind(start).kind === 'full' &&
    dayKind(shiftDate(start, -1)).kind !== 'closed'
  ) {
    start = shiftDate(start, -1);
  }

  while (dayKind(shiftDate(end, 1)).kind === 'full') {
    end = shiftDate(end, 1);
  }

  return {
    start,
    end,
    startTime:
      dayKind(start).kind === 'evening'
        ? SCHEDULE.fridayStart
        : '00:00',
    endTime: SCHEDULE.stop
  };
}

function availability(date) {
  if (date < SCHEDULE.start || date > SCHEDULE.end) {
    return {
      free: false,
      reason: 'Outside this hunting roster',
      hours: 'Not scheduled'
    };
  }

  const { kind, holiday } = dayKind(date);
  const continues = dayKind(shiftDate(date, 1)).kind === 'full';

  if (kind !== 'closed') {
    const hours =
      kind === 'evening'
        ? `From ${SCHEDULE.fridayStart}`
        : continues
          ? 'All day & night'
          : 'Until 23:00';

    const reason = holiday
      ? holiday + ' · the hunt is on pause'
      : kind === 'evening'
        ? 'Hunting until 18:30, then back with the pack'
        : 'Weekend · free to play';

    return {
      free: true,
      holiday,
      reason:
        reason +
        (continues
          ? ' · continues overnight'
          : ' · free stretch ends at 23:00'),
      hours,
      label:
        kind === 'evening'
          ? `From ${SCHEDULE.fridayStart}`
          : continues
            ? 'All day'
            : 'Until 23:00',
      window: freeWindow(date)
    };
  }

  return {
    free: false,
    reason: 'Hunting day · catch me on Friday or the weekend',
    hours: 'Unavailable',
    label: 'Hunting day'
  };
}

const $ = id => document.getElementById(id);

let selected;
let month;

const ALL_BREAKS = [...SPECIAL_DAYS, ...BREAKS].sort((a, b) =>
  a[0].localeCompare(b[0])
);

const months = [];

for (
  let d = new Date(SCHEDULE.start + 'T12:00:00Z');
  iso(d).slice(0, 7) <= SCHEDULE.end.slice(0, 7);
  d.setUTCMonth(d.getUTCMonth() + 1)
) {
  months.push(iso(d).slice(0, 7));
}

function today() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: SCHEDULE.zone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(new Date());
}

function choose(date) {
  selected = date;

  const a = availability(date);

  $('selected-date').textContent = format(date, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  $('selected-title').textContent = a.free
    ? 'A red-moon kind of day.'
    : 'The wolf is away.';

  $('selected-reason').textContent = a.reason;
  $('selected-hours').textContent = a.hours;

  $('selected-window').textContent = a.window
    ? `Continuous free time: ${format(a.window.start, {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      })} at ${a.window.startTime} → ${format(a.window.end, {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      })} at ${a.window.endTime}.`
    : '';

  $('selected-window').hidden = !a.window;

  $('detail-icon').innerHTML =
    `<i class="moon ${a.free ? 'half' : 'full'}"></i>`;

  document.querySelectorAll('.day').forEach(el => {
    const active = el.dataset.date === date;

    el.classList.toggle('selected', active);
    el.setAttribute('aria-pressed', String(active));
  });
}

function render() {
  renderBreakSummary();

  const grid = $('calendar-grid');

  grid.replaceChildren();

  $('month-title').textContent = format(month + '-01', {
    month: 'long',
    year: 'numeric'
  });

  $('month-select').value = month;

  const [year, m] = month.split('-').map(Number);

  const first = new Date(Date.UTC(year, m - 1, 1));

  const days = new Date(
    Date.UTC(year, m, 0)
  ).getUTCDate();

  const offset = (first.getUTCDay() + 6) % 7;

  let available = 0;

  const total = Math.ceil((offset + days) / 7) * 7;

  for (let i = 0; i < total; i++) {
    const day = i - offset + 1;

    const date =
      month + '-' + String(day).padStart(2, '0');

    if (
      day < 1 ||
      day > days ||
      date < SCHEDULE.start ||
      date > SCHEDULE.end
    ) {
      const blank = document.createElement('div');

      blank.className = 'outside';
      blank.setAttribute('aria-hidden', 'true');

      grid.append(blank);
      continue;
    }

    const a = availability(date);

    if (a.free) {
      available++;
    }

    const button = document.createElement('button');

    button.className =
      `day ${a.free ? 'free' : ''} ` +
      `${a.holiday ? 'holiday' : ''} ` +
      `${date === today() ? 'is-today' : ''}`;

    button.dataset.date = date;

    button.setAttribute(
      'aria-label',
      `${format(date, {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      })}: ${a.hours}.
${a.reason}`
    );

    if (date === today()) {
      button.setAttribute('aria-current', 'date');
    }

    button.innerHTML =
      `<span class="date-number">${day}</span>` +
      `<i class="moon ${a.free ? 'half' : 'full'}" aria-hidden="true"></i>` +
      `<span class="day-status">${a.label}</span>` +
      (
        a.holiday
          ? '<span class="holiday-star" aria-hidden="true">✦</span>' +
            '<span class="break-badge">AHA break</span>'
          : ''
      );

    button.onclick = () => choose(date);

    grid.append(button);
  }

  $('month-summary').textContent =
    `${available} DAYS WITH GAMING TIME`;

  $('previous').disabled = month === months[0];
  $('next').disabled = month === months.at(-1);

  if (!selected?.startsWith(month)) {
    selected = [...grid.querySelectorAll('.day')][0].dataset.date;
  }

  choose(selected);
}

function changeMonth(value) {
  if (!months.includes(value)) {
    return;
  }

  month = value;
  render();
}

function renderBreakSummary() {
  const first = month + '-01';

  const last = iso(
    new Date(
      Date.UTC(
        Number(month.slice(0, 4)),
        Number(month.slice(5, 7)),
        0
      )
    )
  );

  const visible = ALL_BREAKS.filter(
    ([a, b]) => a <= last && b >= first
  );

  const summary = $('break-summary');

  summary.replaceChildren();

  if (visible.length) {
    summary.textContent =
      '✦ AHA breaks this month: ' +
      visible
        .map(([a, b, name]) =>
          name +
          ' · ' +
          format(a, {
            day: 'numeric',
            month: 'short'
          }) +
          (
            a === b
              ? ''
              : ' – ' +
                format(b, {
                  day: 'numeric',
                  month: 'short'
                })
          )
        )
        .join(' / ') +
      '. Gold-marked days are free, even on weekdays.';
  } else {
    const next = ALL_BREAKS.find(([a]) => a > last);

    summary.append(
      document.createTextNode(
        'No AHA break this month. Your usual weekend hours still apply. '
      )
    );

    if (next) {
      const button = document.createElement('button');

      button.type = 'button';
      button.className = 'next-break';

      button.textContent =
        'See ' +
        next[2] +
        ' · ' +
        format(next[0], {
          day: 'numeric',
          month: 'short'
        });

      button.onclick = () => {
        selected = next[0];
        changeMonth(selected.slice(0, 7));
        $('break-select').value = selected;
      };

      summary.append(button);
    }
  }
}

function initialize() {
  for (const [start, end, name] of ALL_BREAKS) {
    const option = document.createElement('option');

    option.value = start;

    option.textContent =
      name +
      ' · ' +
      format(start, {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });

    $('break-select').append(option);
  }

  $('break-select').onchange = e => {
    if (!e.target.value) {
      return;
    }

    selected = e.target.value;
    changeMonth(selected.slice(0, 7));
  };

  for (const value of months) {
    const option = document.createElement('option');

    option.value = value;

    option.textContent = format(value + '-01', {
      month: 'short',
      year: 'numeric'
    });

    $('month-select').append(option);
  }

  const now = today();

  selected =
    now < SCHEDULE.start
      ? SCHEDULE.start
      : now > SCHEDULE.end
        ? SCHEDULE.end
        : now;

  month = selected.slice(0, 7);

  $('month-select').onchange = e =>
    changeMonth(e.target.value);

  $('previous').onclick = () =>
    changeMonth(
      months[months.indexOf(month) - 1]
    );

  $('next').onclick = () =>
    changeMonth(
      months[months.indexOf(month) + 1]
    );

  $('today').onclick = () => {
    const date = today();

    selected =
      date < SCHEDULE.start
        ? SCHEDULE.start
        : date > SCHEDULE.end
          ? SCHEDULE.end
          : date;

    changeMonth(selected.slice(0, 7));
  };

  const rows = [
    ...BLOCKS.map(b => [
      ...b,
      'Usual weekly rhythm; breaks below override hunting days'
    ]),

    ...ALL_BREAKS.map(b => [
      ...b,
      'Continuous free days, including nights; 23:00 on the final free day'
    ])
  ].sort((a, b) => a[0].localeCompare(b[0]));

  for (const [a, b, name, rule] of rows) {
    const row = document.createElement('tr');

    for (
      const [column, value] of [
        name,
        format(a, {
          day: 'numeric',
          month: 'short',
          year: 'numeric'
        }) +
          (
            a === b
              ? ''
              : ' — ' +
                format(b, {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric'
                })
          ),
        rule
      ].entries()
    ) {
      const cell = document.createElement('td');

      cell.dataset.label = [
        'Period',
        'Dates',
        'Availability'
      ][column];

      cell.textContent = value;

      row.append(cell);
    }

    $('period-body').append(row);
  }

  render();
}

if (typeof document !== 'undefined') {
  initialize();
}

if (typeof module !== 'undefined') {
  module.exports = {
    availability,
    BREAKS,
    SPECIAL_DAYS,
    BLOCKS,
    months,
    SCHEDULE
  };
}