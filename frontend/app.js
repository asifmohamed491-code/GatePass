// Shared utilities

function togglePwd(fieldId, btn) {
  const input = document.getElementById(fieldId);
  if (input.type === 'password') {
    input.type = 'text';
    btn.innerHTML = `<svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M1 9s3-6 8-6 8 6 8 6-3 6-8 6-8-6-8-6z" stroke="#9ca3af" stroke-width="1.5"/><circle cx="9" cy="9" r="2.5" stroke="#9ca3af" stroke-width="1.5"/><line x1="2" y1="2" x2="16" y2="16" stroke="#9ca3af" stroke-width="1.5"/></svg>`;
  } else {
    input.type = 'password';
    btn.innerHTML = `<svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M1 9s3-6 8-6 8 6 8 6-3 6-8 6-8-6-8-6z" stroke="#9ca3af" stroke-width="1.5"/><circle cx="9" cy="9" r="2.5" stroke="#9ca3af" stroke-width="1.5"/></svg>`;
  }
}

function getToken() {
  return localStorage.getItem('token');
}

function apiHeaders() {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${getToken()}`
  };
}

// Short month names array
const SHORT_MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

/**
 * formatDate — always returns: "Mar 12 2026" (short month, no hyphen, no full month)
 * Accepts: ISO string, Date object, or "YYYY-MM-DD"
 */
function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d)) return dateStr;
  const day = d.getDate();
  const month = SHORT_MONTHS[d.getMonth()];
  const year = d.getFullYear();
  return `${month} ${day} ${year}`;
}

/**
 * formatDateFromParts — build formatted date from day/month index/year
 */
function formatDateFromParts(day, monthIndex, year) {
  if (!day || monthIndex === '' || !year) return '';
  return `${SHORT_MONTHS[monthIndex]} ${parseInt(day)} ${year}`;
}

/**
 * formatTime — always returns: "10:30 AM" or "06:45 PM"
 * Accepts "HH:MM" (24h)
 */
function formatTime(timeStr) {
  if (!timeStr) return '';
  const [h, m] = timeStr.split(':');
  const hour = parseInt(h);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const h12 = hour % 12 || 12;
  return `${String(h12).padStart(2,'0')}:${m} ${ampm}`;
}

/**
 * formatDateTime — "Mar 12 2026 10:30 AM"
 */
function formatDateTime(dateStr, timeStr) {
  const d = formatDate(dateStr);
  const t = formatTime(timeStr);
  if (!d && !t) return '';
  if (!t) return d;
  if (!d) return t;
  return `${d} ${t}`;
}

/**
 * ordinalSuffix — returns "1st","2nd","3rd","4th"... etc
 */
function ordinalSuffix(n) {
  const s = ['th','st','nd','rd'];
  const v = n % 100;
  return n + (s[(v-20)%10] || s[v] || s[0]);
}

/**
 * formatOrdinalDateTimeCompact — "28th Mar,2026-10:48 AM"
 * Used for Requested On label in View Gate Pass popup
 */
function formatOrdinalDateTimeCompact(dateStr, timeStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d)) return dateStr;
  const day   = ordinalSuffix(d.getDate());
  const month = SHORT_MONTHS[d.getMonth()];
  const year  = d.getFullYear();
  const time  = formatTime(timeStr);
  return `${day} ${month},${year}-${time}`;
}

/**
 * formatOrdinalDateTime — "28th Mar,2026 at 04:30 PM"
 * Used for Departure / Return Date and Time in View Gate Pass popup
 */
function formatOrdinalDateTime(dateStr, timeStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d)) return dateStr;
  const day   = ordinalSuffix(d.getDate());
  const month = SHORT_MONTHS[d.getMonth()];
  const year  = d.getFullYear();
  const time  = formatTime(timeStr);
  return time ? `${day} ${month},${year} at ${time}` : `${day} ${month},${year}`;
}

/**
 * toDateInput — convert any date string to YYYY-MM-DD for <input type="date">
 */
function toDateInput(dateStr) {
  if (!dateStr) return '';
  if (dateStr.includes('-') && dateStr.length === 10) return dateStr;
  const d = new Date(dateStr);
  if (isNaN(d)) return '';
  return d.toISOString().split('T')[0];
}

/**
 * toTimeInput — convert "04:30 PM" → "16:30" for <input type="time">
 */
function toTimeInput(timeStr) {
  if (!timeStr) return '';
  if (!timeStr.includes(' ')) return timeStr;
  const [hm, ap] = timeStr.split(' ');
  let [h, m] = hm.split(':');
  h = parseInt(h);
  if (ap === 'PM' && h !== 12) h += 12;
  if (ap === 'AM' && h === 12) h = 0;
  return `${String(h).padStart(2,'0')}:${m}`;
}

/**
 * populateDayOptions — populate day <select> with 1–31
 */
function populateDayOptions(selectId, selectedDay) {
  const sel = document.getElementById(selectId);
  if (!sel) return;
  // keep first placeholder option
  sel.innerHTML = '<option value="">DD</option>';
  for (let d = 1; d <= 31; d++) {
    const opt = document.createElement('option');
    opt.value = d;
    opt.textContent = String(d).padStart(2, '0');
    if (selectedDay && parseInt(selectedDay) === d) opt.selected = true;
    sel.appendChild(opt);
  }
}

/**
 * populateYearOptions — populate year <select> from current-2 to current+5
 */
function populateYearOptions(selectId, selectedYear) {
  const sel = document.getElementById(selectId);
  if (!sel) return;
  sel.innerHTML = '<option value="">YYYY</option>';
  const now = new Date().getFullYear();
  for (let y = now - 2; y <= now + 5; y++) {
    const opt = document.createElement('option');
    opt.value = y;
    opt.textContent = y;
    if (selectedYear && parseInt(selectedYear) === y) opt.selected = true;
    sel.appendChild(opt);
  }
}

/**
 * setCustomDateFromISO — populate day/month/year dropdowns from ISO "YYYY-MM-DD"
 */
function setCustomDateFromISO(prefix, isoDate) {
  if (!isoDate) return;
  const d = new Date(isoDate + 'T00:00:00');
  if (isNaN(d)) return;
  populateDayOptions(`${prefix}-day`, d.getDate());
  populateYearOptions(`${prefix}-year`, d.getFullYear());
  const monthSel = document.getElementById(`${prefix}-month`);
  if (monthSel) monthSel.value = d.getMonth();
}

/**
 * getCustomDateISO — read day/month/year dropdowns and return "YYYY-MM-DD"
 */
function getCustomDateISO(prefix) {
  const day = document.getElementById(`${prefix}-day`)?.value;
  const month = document.getElementById(`${prefix}-month`)?.value;
  const year = document.getElementById(`${prefix}-year`)?.value;
  if (!day || month === '' || month === undefined || !year) return '';
  const mm = String(parseInt(month) + 1).padStart(2, '0');
  const dd = String(parseInt(day)).padStart(2, '0');
  return `${year}-${mm}-${dd}`;
}

/**
 * getCustomDateFormatted — returns "Mar 12 2026" from dropdowns
 */
function getCustomDateFormatted(prefix) {
  const day = document.getElementById(`${prefix}-day`)?.value;
  const month = document.getElementById(`${prefix}-month`)?.value;
  const year = document.getElementById(`${prefix}-year`)?.value;
  if (!day || month === '' || month === undefined || !year) return '';
  return `${SHORT_MONTHS[parseInt(month)]} ${parseInt(day)} ${year}`;
}

/**
 * initCustomDateDefaults — auto-fill day/month/year dropdowns with today
 */
function initCustomDateDefaults() {
  const now = new Date();
  populateDayOptions('gp-departure-day', now.getDate());
  populateYearOptions('gp-departure-year', now.getFullYear());
  const depMonth = document.getElementById('gp-departure-month');
  if (depMonth) depMonth.value = now.getMonth();

  populateDayOptions('gp-return-day', now.getDate());
  populateYearOptions('gp-return-year', now.getFullYear());
  const retMonth = document.getElementById('gp-return-month');
  if (retMonth) retMonth.value = now.getMonth();

  // Auto-fill time with current time
  const hh = String(now.getHours()).padStart(2,'0');
  const mm = String(now.getMinutes()).padStart(2,'0');
  const timeVal = `${hh}:${mm}`;
  const depTime = document.getElementById('gp-departure-time');
  const retTime = document.getElementById('gp-return-time');
  if (depTime && !depTime.value) depTime.value = timeVal;
  if (retTime && !retTime.value) retTime.value = timeVal;
}

// Register service worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then(reg => console.log('SW registered'))
      .catch(err => console.log('SW error', err));
  });
}
