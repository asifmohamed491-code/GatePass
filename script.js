// ── State ──
const state = {
  name: "MOHAMED ASIF A",
  requestedDate: "28",
  requestedMonth: "Mar",
  requestedYear: "2026",
  requestedTime: "10:48 AM",

  departureDate: "28",
  departureMonth: "Mar",
  departureYear: "2026",
  departureTime: "04:30 PM",

  returnDate: "28",
  returnMonth: "Mar",
  returnYear: "2026",
  returnTime: "06:00 PM",

  room: "Boys Hostel | FIRST FLOOR | B-207",
  reason: "Purchase",
  remark: "Ok",

  approvers: [
    { level: "First Level Approver",  name: "PRIYANKA A",   role: "Employee", status: "Approved", date: "Mar 28 2026", time: "11:00 AM", remark: "Ok" },
    { level: "Second Level Approver", name: "NATARAJAN V",  role: "Employee", status: "Approved", date: "Mar 28 2026", time: "12:38 PM", remark: "ok" },
    { level: "Third Level Approver",  name: "RAJESHWAR R",  role: "Employee", status: "Approved", date: "Mar 28 2026", time: "12:49 PM", remark: "" }
  ]
};

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const DAYS   = Array.from({length:31},(_,i)=>String(i+1).padStart(2,'0'));
const YEARS  = ["2025","2026","2027"];
const HOURS  = Array.from({length:12},(_,i)=>String(i+1).padStart(2,'0'));
const MINS   = Array.from({length:60},(_,i)=>String(i).padStart(2,'0'));
const AMPM   = ["AM","PM"];
const REASONS= ["Purchase","Personal Work","Medical","Family Visit","Outing","Emergency","Other"];

// ── Helpers ──
function fmt(d,m,y,t){ return `${d}th ${m},${y} at ${t}`; }
function fmtReq(d,m,y,t){ return `${d}th ${m},${y}-${t}`; }
function splitTime(t){ 
  const [hm,ap] = t.split(' ');
  const [h,mn] = hm.split(':');
  return {h,mn,ap};
}

// ── Render ──
function render(){
  // QR
  const qrData = `GATEPASS|${state.name}|DEP:${state.departureDate}${state.departureMonth}${state.departureYear}${state.departureTime}|RET:${state.returnDate}${state.returnMonth}${state.returnYear}${state.returnTime}|ROOM:${state.room}`;
  document.getElementById('qr-container').innerHTML = '';
  new QRCode(document.getElementById('qr-container'), {
    text: qrData,
    width: 160,
    height: 160,
    correctLevel: QRCode.CorrectLevel.M
  });

  // Info
  document.getElementById('disp-name').textContent = state.name;
  document.getElementById('disp-requested').innerHTML =
    `Requested on : <span>${fmtReq(state.requestedDate, state.requestedMonth, state.requestedYear, state.requestedTime)}</span>`;
  document.getElementById('disp-departure').textContent =
    fmt(state.departureDate, state.departureMonth, state.departureYear, state.departureTime);
  document.getElementById('disp-return').textContent =
    fmt(state.returnDate, state.returnMonth, state.returnYear, state.returnTime);
  document.getElementById('disp-room').textContent   = state.room;
  document.getElementById('disp-reason').textContent = state.reason;
  document.getElementById('disp-remark').textContent = state.remark;

  // Approvers
  const container = document.getElementById('approvers-container');
  container.innerHTML = '';
  state.approvers.forEach((ap, i) => {
    const div = document.createElement('div');
    div.className = 'timeline-item';
    div.innerHTML = `
      <div class="approver-level">${ap.level}</div>
      <div class="approver-name">${ap.name} | ${ap.role}</div>
      <div class="approver-badge">${ap.status}</div>
      <div class="approver-date">${ap.date} | ${ap.time}</div>
      ${ap.remark ? `<div class="approver-remark">
        <svg viewBox="0 0 24 24" fill="none" stroke="#999" stroke-width="2">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
        ${ap.remark}
      </div>` : ''}
    `;
    container.appendChild(div);
  });
}

// ── Editor ──
let editTarget = null;

function openEditor(target) {
  editTarget = target;
  const sheet = document.getElementById('editor-sheet');
  sheet.innerHTML = '';

  if (target === 'info') buildInfoEditor(sheet);
  else if (target === 'approvers') buildApproversEditor(sheet);

  document.getElementById('editor-overlay').classList.add('open');
}

function closeEditor() {
  document.getElementById('editor-overlay').classList.remove('open');
  editTarget = null;
}

// ── Info Editor ──
function buildInfoEditor(sheet) {
  sheet.innerHTML = `<h3>✏️ Edit Gate Pass Details</h3>`;

  // Name
  sheet.appendChild(fieldGroup('Name', `<input id="e-name" value="${state.name}"/>`));

  // Requested on
  sheet.appendChild(sectionLabel('Requested On'));
  sheet.appendChild(dateTimeField('req', state.requestedDate, state.requestedMonth, state.requestedYear, state.requestedTime));

  // Departure
  sheet.appendChild(sectionLabel('Departure Date & Time'));
  sheet.appendChild(dateTimeField('dep', state.departureDate, state.departureMonth, state.departureYear, state.departureTime));

  // Return
  sheet.appendChild(sectionLabel('Return Date & Time'));
  sheet.appendChild(dateTimeField('ret', state.returnDate, state.returnMonth, state.returnYear, state.returnTime));

  // Room
  sheet.appendChild(fieldGroup('Room Details', `<input id="e-room" value="${state.room}"/>`));

  // Reason
  const reasonOpts = REASONS.map(r => `<option ${r===state.reason?'selected':''}>${r}</option>`).join('');
  sheet.appendChild(fieldGroup('Reason', `<select id="e-reason">${reasonOpts}</select>`));

  // Remark
  sheet.appendChild(fieldGroup('Remark', `<input id="e-remark" value="${state.remark}"/>`));

  // Buttons
  const btnRow = document.createElement('div');
  btnRow.className = 'btn-row';
  btnRow.innerHTML = `
    <button class="btn-cancel" onclick="closeEditor()">Cancel</button>
    <button class="btn-save" onclick="saveInfo()">Save Changes</button>
  `;
  sheet.appendChild(btnRow);
}

function saveInfo() {
  state.name = document.getElementById('e-name').value;

  // Requested
  state.requestedDate  = document.getElementById('e-req-date').value;
  state.requestedMonth = document.getElementById('e-req-month').value;
  state.requestedYear  = document.getElementById('e-req-year').value;
  state.requestedTime  = document.getElementById('e-req-h').value + ':' +
                         document.getElementById('e-req-m').value + ' ' +
                         document.getElementById('e-req-ap').value;

  // Departure
  state.departureDate  = document.getElementById('e-dep-date').value;
  state.departureMonth = document.getElementById('e-dep-month').value;
  state.departureYear  = document.getElementById('e-dep-year').value;
  state.departureTime  = document.getElementById('e-dep-h').value + ':' +
                         document.getElementById('e-dep-m').value + ' ' +
                         document.getElementById('e-dep-ap').value;

  // Return
  state.returnDate  = document.getElementById('e-ret-date').value;
  state.returnMonth = document.getElementById('e-ret-month').value;
  state.returnYear  = document.getElementById('e-ret-year').value;
  state.returnTime  = document.getElementById('e-ret-h').value + ':' +
                      document.getElementById('e-ret-m').value + ' ' +
                      document.getElementById('e-ret-ap').value;

  state.room   = document.getElementById('e-room').value;
  state.reason = document.getElementById('e-reason').value;
  state.remark = document.getElementById('e-remark').value;

  closeEditor();
  render();
}

// ── Approvers Editor ──
function buildApproversEditor(sheet) {
  sheet.innerHTML = `<h3>✏️ Edit Approvers</h3>`;

  state.approvers.forEach((ap, i) => {
    const div = document.createElement('div');
    div.className = 'approver-editor';
    div.innerHTML = `
      <div class="approver-editor-title">${ap.level}</div>
      <div class="field-group">
        <label>Name</label>
        <input id="ap-name-${i}" value="${ap.name}"/>
      </div>
      <div class="field-group">
        <label>Role</label>
        <input id="ap-role-${i}" value="${ap.role}"/>
      </div>
      <div class="field-group">
        <label>Date & Time</label>
        <div class="date-time-row">
          ${selectEl(`ap-date-${i}`, DAYS, ap.date.split(' ')[1])}
          ${selectEl(`ap-month-${i}`, MONTHS, ap.date.split(' ')[0])}
          ${selectEl(`ap-year-${i}`, YEARS, ap.date.split(' ')[2])}
          ${selectEl(`ap-hour-${i}`, HOURS, ap.time.split(':')[0])}
          ${selectEl(`ap-min-${i}`, MINS, ap.time.split(':')[1].split(' ')[0])}
          ${selectEl(`ap-ampm-${i}`, AMPM, ap.time.split(' ')[1])}
        </div>
      </div>
      <div class="field-group">
        <label>Remark</label>
        <input id="ap-remark-${i}" value="${ap.remark}"/>
      </div>
    `;
    sheet.appendChild(div);
  });

  const btnRow = document.createElement('div');
  btnRow.className = 'btn-row';
  btnRow.innerHTML = `
    <button class="btn-cancel" onclick="closeEditor()">Cancel</button>
    <button class="btn-save" onclick="saveApprovers()">Save Changes</button>
  `;
  sheet.appendChild(btnRow);
}

function saveApprovers() {
  state.approvers.forEach((ap, i) => {
    ap.name   = document.getElementById(`ap-name-${i}`).value;
    ap.role   = document.getElementById(`ap-role-${i}`).value;
    const d   = document.getElementById(`ap-date-${i}`).value;
    const mo  = document.getElementById(`ap-month-${i}`).value;
    const y   = document.getElementById(`ap-year-${i}`).value;
    const h   = document.getElementById(`ap-hour-${i}`).value;
    const mn  = document.getElementById(`ap-min-${i}`).value;
    const amp = document.getElementById(`ap-ampm-${i}`).value;
    ap.date   = `${mo} ${d} ${y}`;
    ap.time   = `${h}:${mn} ${amp}`;
    ap.remark = document.getElementById(`ap-remark-${i}`).value;
  });
  closeEditor();
  render();
}

// ── UI helpers ──
function fieldGroup(label, inputHTML) {
  const div = document.createElement('div');
  div.className = 'field-group';
  div.innerHTML = `<label>${label}</label>${inputHTML}`;
  return div;
}

function sectionLabel(text) {
  const div = document.createElement('div');
  div.className = 'field-group';
  div.innerHTML = `<label>${text}</label>`;
  return div;
}

function selectEl(id, opts, selected) {
  return `<select id="${id}">${opts.map(o=>`<option ${o==selected?'selected':''}>${o}</option>`).join('')}</select>`;
}

function dateTimeField(prefix, d, mo, y, t) {
  const {h,mn,ap} = splitTime(t);
  const wrap = document.createElement('div');
  wrap.className = 'field-group';
  wrap.innerHTML = `
    <div class="date-time-row">
      ${selectEl(`e-${prefix}-date`,  DAYS,   d)}
      ${selectEl(`e-${prefix}-month`, MONTHS, mo)}
      ${selectEl(`e-${prefix}-year`,  YEARS,  y)}
      ${selectEl(`e-${prefix}-h`,     HOURS,  h)}
      ${selectEl(`e-${prefix}-m`,     MINS,   mn)}
      ${selectEl(`e-${prefix}-ap`,    AMPM,   ap)}
    </div>
  `;
  return wrap;
}

// ── Init ──
document.addEventListener('DOMContentLoaded', () => {
  render();

  // Close overlay on backdrop click
  document.getElementById('editor-overlay').addEventListener('click', function(e){
    if (e.target === this) closeEditor();
  });
});
