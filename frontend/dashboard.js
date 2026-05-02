// Dashboard logic
const BASE_URL = "https://gatepass-mtkd.onrender.com"

let currentGatePassId = null;
let currentUser = null;

// ── Popup close: requires 4 clicks on X ──
let _closeClickCount = 0;

const DEFAULT_APPROVERS = [
  { level: 'First Level Approver',  name: 'PRIYANKA A',  role: 'Employee', status: 'Approved', date: '', time: '', remark: '' },
  { level: 'Second Level Approver', name: 'NATARAJAN V', role: 'Employee', status: 'Approved', date: '', time: '', remark: '' },
  { level: 'Third Level Approver',  name: 'RAJESHWAR R', role: 'Employee', status: 'Approved', date: '', time: '', remark: '' }
];

let approversState = JSON.parse(JSON.stringify(DEFAULT_APPROVERS));

function randomApprovalTime() {
  const h = Math.floor(Math.random() * 12) + 6; // 6–17
  const m = Math.floor(Math.random() * 60);
  return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;
}

window.addEventListener('DOMContentLoaded', async () => {
  // Synchronous UI setup — no flicker
  initCustomDateDefaults();

  // Block ESC from closing modal
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); }
  }, true);

  // No token → redirect only if we're not already on login
  const token = getToken();
  if (!token) {
    if (!window.location.pathname.includes('login')) {
      window.location.replace('/login.html');
    }
    return;
  }

  // Show approvers immediately with defaults — no API wait
  approversState.forEach(ap => {
    if (!ap.date) ap.date = new Date().toISOString().split('T')[0];
    if (!ap.time) ap.time = randomApprovalTime();
  });
  renderApprovers();

  // ── FIX: Each fetch has its own .catch(null) — one failure won't affect others ──
  const [meRes, gpRes, recentRes] = await Promise.all([
    fetch(`/api/me`,           { headers: apiHeaders() }).catch(() => null),
    fetch(`/api/gatepass`,     { headers: apiHeaders() }).catch(() => null),
    fetch(`/api/gatepass/all`, { headers: apiHeaders() }).catch(() => null)
  ]);

  // ── FIX: Only redirect on explicit 401/403 (bad token), NOT on network errors ──
  if (!meRes || meRes.status === 401 || meRes.status === 403) {
    window.location.href = '/login.html';
    return;
  }

  // User info
  if (meRes.ok) {
    try {
      currentUser = await meRes.json();
      document.getElementById('gp-name').value = currentUser.fullName.toUpperCase();
    } catch(e) { console.warn('user parse error', e); }
  }

  // Gate pass form — guarded parse, won't crash on bad response
  if (gpRes && gpRes.ok) {
    try {
      const gp = await gpRes.json();
      if (gp && gp._id) {
        currentGatePassId = gp._id;
        document.getElementById('gp-name').value =
          gp.name || (currentUser ? currentUser.fullName.toUpperCase() : '');

        const depISO = toDateInput(gp.departure || '');
        const retISO = toDateInput(gp.returnDate || '');
        if (depISO) setCustomDateFromISO('gp-departure', depISO);
        if (retISO) setCustomDateFromISO('gp-return', retISO);
        document.getElementById('gp-departure').value      = depISO;
        document.getElementById('gp-return').value         = retISO;
        document.getElementById('gp-departure-time').value = toTimeInput(gp.departureTime || '');
        document.getElementById('gp-return-time').value    = toTimeInput(gp.returnTime || '');
        document.getElementById('gp-hostel').value         = gp.hostel || '';
        document.getElementById('gp-floor').value          = gp.floor || '';
        document.getElementById('gp-room').value           = gp.roomNo || '';
        document.getElementById('gp-reason').value         = gp.reason || '';
        document.getElementById('gp-remark').value         = gp.remark || '';

        if (gp.approvers && gp.approvers.length > 0) {
          approversState = gp.approvers;
          approversState.forEach(ap => {
            if (!ap.date) ap.date = new Date().toISOString().split('T')[0];
            if (!ap.time) ap.time = randomApprovalTime();
          });
          renderApprovers();
        }
      }
    } catch(e) { console.warn('gatepass parse error', e); }
  }

  // Recent passes — silent fail, just leave "Loading..." if broken
  if (recentRes && recentRes.ok) {
    try {
      const passes = await recentRes.json();
      renderRecent(passes);
    } catch(e) { console.warn('recent parse error', e); }
  }
});

// ── loadGatePass: used by handleCancel — no redirect, no crash ─
async function loadGatePass() {
  try {
    const res = await fetch(`/api/gatepass`, { headers: apiHeaders() });
    if (!res || !res.ok) return;
    const gp = await res.json();
    if (!gp || !gp._id) return;

    currentGatePassId = gp._id;
    document.getElementById('gp-name').value = gp.name || '';

    const depISO = toDateInput(gp.departure || '');
    const retISO = toDateInput(gp.returnDate || '');
    if (depISO) setCustomDateFromISO('gp-departure', depISO);
    if (retISO) setCustomDateFromISO('gp-return', retISO);
    document.getElementById('gp-departure').value      = depISO;
    document.getElementById('gp-return').value         = retISO;
    document.getElementById('gp-departure-time').value = toTimeInput(gp.departureTime || '');
    document.getElementById('gp-return-time').value    = toTimeInput(gp.returnTime || '');
    document.getElementById('gp-hostel').value         = gp.hostel || '';
    document.getElementById('gp-floor').value          = gp.floor || '';
    document.getElementById('gp-room').value           = gp.roomNo || '';
    document.getElementById('gp-reason').value         = gp.reason || '';
    document.getElementById('gp-remark').value         = gp.remark || '';

    if (gp.approvers && gp.approvers.length > 0) {
      approversState = gp.approvers;
      approversState.forEach(ap => {
        if (!ap.date) ap.date = new Date().toISOString().split('T')[0];
        if (!ap.time) ap.time = randomApprovalTime();
      });
    }
    // ── FIX: renderApprovers was missing from handleCancel flow ──
    renderApprovers();
  } catch(e) {
    console.warn('loadGatePass error', e);
  }
}

async function loadRecent() {
  try {
    const res = await fetch('/api/gatepass/all', { headers: apiHeaders() });
    if (!res || !res.ok) return;
    const passes = await res.json();
    renderRecent(passes);
  } catch(e) {
    console.warn('loadRecent error', e);
  }
}

function renderRecent(passes) {
  const container = document.getElementById('recent-list');
  if (!passes || passes.length === 0) {
    container.innerHTML = '<div class="loading-text">No gate passes yet.</div>';
    return;
  }

  const desktopHTML = passes.map(gp => {
    const depDate    = gp.departure     ? formatDate(gp.departure)      : '';
    const depTime    = gp.departureTime ? formatTime(gp.departureTime)  : '';
    const retDate    = gp.returnDate    ? formatDate(gp.returnDate)     : '';
    const retTime    = gp.returnTime    ? formatTime(gp.returnTime)     : '';
    const updatedDate = formatDate(gp.updatedAt);
    const updatedTime = gp.updatedAt
      ? formatTime(new Date(gp.updatedAt).toTimeString().slice(0,5))
      : '';
    const name = gp.name || (gp.userId && gp.userId.fullName) || '';

    return `
      <div class="recent-row desktop-only">
        <div class="rr-name">${name.toUpperCase()}</div>
        <div>${gp.roomNo || ''}</div>
        <div>${gp.reason || ''}</div>
        <div>${depDate}<br/>${depTime}</div>
        <div>${retDate}<br/>${retTime}</div>
        <div><span class="badge-approved">Approved</span></div>
        <div>${updatedDate}<br/>${updatedTime}</div>
        <div><button class="dots-btn">⋮</button></div>
      </div>
      <div class="recent-card mobile-only">
        <div class="rc-top">
          <div class="rc-avatar">
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><circle cx="11" cy="8" r="4" stroke="#2d7a3a" stroke-width="1.6"/><path d="M4 20c0-4 3-7 7-7s7 3 7 7" stroke="#2d7a3a" stroke-width="1.6" stroke-linecap="round"/></svg>
          </div>
          <div class="rc-name">${name.toUpperCase()}</div>
          <span class="badge-approved">Approved</span>
          <button class="dots-btn">⋮</button>
        </div>
        <div class="rc-meta">
          <span>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="1" y="2" width="12" height="10" rx="1.5" stroke="#555" stroke-width="1.2"/><line x1="1" y1="5" x2="13" y2="5" stroke="#555" stroke-width="1.2"/></svg>
            Room No: ${gp.roomNo || ''}
          </span>
          <span class="rc-divider">|</span>
          <span>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 2l1.5 3H12l-2.5 2 1 3L7 8.5 4.5 10l1-3L3 5h3.5z" stroke="#555" stroke-width="1.1" fill="none"/></svg>
            Reason: ${gp.reason || ''}
          </span>
        </div>
        <div class="rc-dates">
          <div>
            <span class="rc-label">Departure</span><br/>
            <span class="rc-date-row">
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><rect x="1" y="2" width="11" height="9" rx="1.5" stroke="#555" stroke-width="1.2"/><line x1="1" y1="5" x2="12" y2="5" stroke="#555" stroke-width="1.2"/></svg>
              ${depDate}
            </span>
            <span class="rc-date-row">
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><circle cx="6.5" cy="6.5" r="5" stroke="#555" stroke-width="1.2"/><line x1="6.5" y1="4" x2="6.5" y2="7" stroke="#555" stroke-width="1.2" stroke-linecap="round"/><line x1="6.5" y1="7" x2="8.5" y2="8.5" stroke="#555" stroke-width="1.2" stroke-linecap="round"/></svg>
              ${depTime}
            </span>
          </div>
          <div>
            <span class="rc-label">Return</span><br/>
            <span class="rc-date-row">
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><rect x="1" y="2" width="11" height="9" rx="1.5" stroke="#555" stroke-width="1.2"/><line x1="1" y1="5" x2="12" y2="5" stroke="#555" stroke-width="1.2"/></svg>
              ${retDate}
            </span>
            <span class="rc-date-row">
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><circle cx="6.5" cy="6.5" r="5" stroke="#555" stroke-width="1.2"/><line x1="6.5" y1="4" x2="6.5" y2="7" stroke="#555" stroke-width="1.2" stroke-linecap="round"/><line x1="6.5" y1="7" x2="8.5" y2="8.5" stroke="#555" stroke-width="1.2" stroke-linecap="round"/></svg>
              ${retTime}
            </span>
          </div>
        </div>
        <div class="rc-updated">Updated On: ${updatedDate} ${updatedTime}</div>
      </div>
    `;
  }).join('');

  container.innerHTML = desktopHTML;
}

function renderApprovers() {
  const container = document.getElementById('approvers-list');

  const html = approversState.map((ap, i) => {
    const dateISO = ap.date || new Date().toISOString().split('T')[0];
    const timeVal = ap.time || randomApprovalTime();
    const dateFmt = formatDate(dateISO);
    const timeFmt = formatTime(timeVal);

    return `
      <div class="approval-row desktop-only">
        <div class="ar-level">
          
          <div class="level-text">
            <span class="level-label">${ap.level.split(' ').slice(0,2).join(' ')}<br/>${ap.level.split(' ').slice(2).join(' ')}</span>
          </div>
        </div>
        <div class="ar-approver-name">${ap.name}</div>
        <div class="ar-emp">
          <input type="text" class="emp-input" id="emp-${i}" value="${ap.name}" onchange="approversState[${i}].name=this.value"/>
        </div>
        <div class="ar-status"><span class="badge-approved">Approved</span></div>
        <div class="ar-date">
          <div class="input-icon-wrap" style="margin-bottom:6px">
            <input type="date" id="ap-date-${i}" value="${dateISO}" class="input-time" style="padding-left:28px;font-size:13px;width:100%;box-sizing:border-box;" onchange="approversState[${i}].date=this.value"/>
          </div>
          <div class="input-icon-wrap">
            <input type="time" id="ap-time-${i}" value="${timeVal}" class="input-time" style="padding-left:28px;font-size:13px;width:100%;box-sizing:border-box;" onchange="approversState[${i}].time=this.value"/>
          </div>
        </div>
        <div class="ar-remark">
          <input type="text" class="remark-input" id="ap-remark-${i}" value="${ap.remark || ''}" placeholder="Remark" onchange="approversState[${i}].remark=this.value"/>
        </div>
        <div class="ar-action">
          <button class="edit-btn" onclick="editApprover(${i})">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M11 2l3 3-8 8H3v-3l8-8z" stroke="#4a9ef5" stroke-width="1.4" stroke-linejoin="round"/></svg>
          </button>
        </div>
      </div>

      <div class="approval-mobile-card mobile-only">
        <div class="amc-header">
          <div class="amc-left">
            <div class="timeline-check">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="7" fill="#2d7a3a"/><path d="M4 7l2 2 4-4" stroke="#fff" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </div>
            <span class="amc-level-badge">${ap.level}</span>
          </div>
          <button class="edit-btn" onclick="editApprover(${i})">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M11 2l3 3-8 8H3v-3l8-8z" stroke="#4a9ef5" stroke-width="1.4" stroke-linejoin="round"/></svg>
          </button>
        </div>
        <div class="amc-name">${ap.name} <span class="amc-role">| Employee</span></div>
        <div class="field-wrap" style="margin-bottom:8px">
          <label style="font-size:11px;color:#888">Employee Name</label>
          <input type="text" id="emp-mob-${i}" value="${ap.name}" onchange="approversState[${i}].name=this.value"/>
        </div>
        <div class="amc-row">
          <div>
            <label style="font-size:11px;color:#888">Status</label><br/>
            <span class="badge-approved">Approved</span>
          </div>
          <div style="flex:1">
            <label style="font-size:11px;color:#888">Approved On</label>
            <div class="input-icon-wrap" style="margin-top:4px;margin-bottom:6px">
              <span class="input-icon"><svg width="15" height="15" viewBox="0 0 15 15" fill="none"><rect x="1" y="2" width="13" height="11" rx="1.5" stroke="#555" stroke-width="1.3"/><line x1="1" y1="5.5" x2="14" y2="5.5" stroke="#555" stroke-width="1.3"/><line x1="4.5" y1="1" x2="4.5" y2="3.5" stroke="#555" stroke-width="1.3" stroke-linecap="round"/><line x1="10.5" y1="1" x2="10.5" y2="3.5" stroke="#555" stroke-width="1.3" stroke-linecap="round"/></svg></span>
              <input type="date" id="ap-mob-date-${i}" value="${dateISO}" class="input-time" style="padding-left:28px;font-size:13px;width:100%;box-sizing:border-box;" onchange="approversState[${i}].date=this.value"/>
            </div>
            <div class="input-icon-wrap">
              <span class="input-icon"><svg width="15" height="15" viewBox="0 0 15 15" fill="none"><circle cx="7.5" cy="7.5" r="6" stroke="#555" stroke-width="1.3"/><line x1="7.5" y1="4.5" x2="7.5" y2="8" stroke="#555" stroke-width="1.3" stroke-linecap="round"/><line x1="7.5" y1="8" x2="10" y2="9.5" stroke="#555" stroke-width="1.3" stroke-linecap="round"/></svg></span>
              <input type="time" id="ap-mob-time-${i}" value="${timeVal}" class="input-time" style="padding-left:28px;font-size:13px;width:100%;box-sizing:border-box;" onchange="approversState[${i}].time=this.value"/>
            </div>
          </div>
        </div>
        <div class="field-wrap" style="margin-top:8px">
          <label style="font-size:11px;color:#888">Remark</label>
          <input type="text" id="ap-mob-remark-${i}" value="${ap.remark || ''}" placeholder="Remark" onchange="approversState[${i}].remark=this.value"/>
        </div>
        ${i < approversState.length - 1 ? '<div class="timeline-line"></div>' : ''}
      </div>
    `;
  }).join('');

  container.innerHTML = html;
}

function editApprover(i) {
  const ap = approversState[i];
  const empEl = document.getElementById(`emp-${i}`) || document.getElementById(`emp-mob-${i}`);
  if (empEl) ap.name = empEl.value;
  alert(`Editing ${ap.level}: changes saved inline.`);
}

// ── Validation ──
function validateFields() {
  let valid = true;

  function checkSelect(fieldId, errId) {
    const el = document.getElementById(fieldId);
    const errEl = document.getElementById(errId);
    const val = el ? el.value.trim() : '';
    if (!val) {
      if (errEl) errEl.style.display = 'block';
      valid = false;
    } else {
      if (errEl) errEl.style.display = 'none';
    }
  }

  const depISO = getCustomDateISO('gp-departure');
  const depErrEl = document.getElementById('err-departure');
  if (!depISO) {
    if (depErrEl) depErrEl.style.display = 'block';
    valid = false;
  } else {
    if (depErrEl) depErrEl.style.display = 'none';
    document.getElementById('gp-departure').value = depISO;
  }

  const retISO = getCustomDateISO('gp-return');
  const retErrEl = document.getElementById('err-return');
  if (!retISO) {
    if (retErrEl) retErrEl.style.display = 'block';
    valid = false;
  } else {
    if (retErrEl) retErrEl.style.display = 'none';
    document.getElementById('gp-return').value = retISO;
  }

  checkSelect('gp-hostel', 'err-hostel');
  checkSelect('gp-floor',  'err-floor');
  checkSelect('gp-reason', 'err-reason');

  const roomEl   = document.getElementById('gp-room');
  const roomErr  = document.getElementById('err-room');
  if (!roomEl || !roomEl.value.trim()) {
    if (roomErr) roomErr.style.display = 'block';
    valid = false;
  } else {
    if (roomErr) roomErr.style.display = 'none';
  }

  return valid;
}

async function handleSave() {
  if (!validateFields()) {
    showToast('Please fill all required fields.');
    return;
  }

  const name          = document.getElementById('gp-name').value;
  const departure     = getCustomDateISO('gp-departure');
  const departureTime = document.getElementById('gp-departure-time').value;
  const returnDate    = getCustomDateISO('gp-return');
  const returnTime    = document.getElementById('gp-return-time').value;
  const hostel        = document.getElementById('gp-hostel').value;
  const floor         = document.getElementById('gp-floor').value;
  const roomNo        = document.getElementById('gp-room').value;
  const reason        = document.getElementById('gp-reason').value;
  const remark        = document.getElementById('gp-remark').value;

  approversState.forEach((ap, i) => {
    const empD    = document.getElementById(`emp-${i}`);
    const empM    = document.getElementById(`emp-mob-${i}`);
    const dateD   = document.getElementById(`ap-date-${i}`);
    const timeD   = document.getElementById(`ap-time-${i}`);
    const remarkD = document.getElementById(`ap-remark-${i}`);
    if (empD)    ap.name   = empD.value;
    if (empM)    ap.name   = empM.value;
    const dateMob = document.getElementById(`ap-mob-date-${i}`);
    const timeMob = document.getElementById(`ap-mob-time-${i}`);
    if (dateD && dateD.value)          ap.date = dateD.value;
    else if (dateMob && dateMob.value) ap.date = dateMob.value;
    if (timeD && timeD.value)          ap.time = timeD.value;
    else if (timeMob && timeMob.value) ap.time = timeMob.value;
    if (remarkD) ap.remark = remarkD.value;
  });

  const payload = {
    name, departure, departureTime, returnDate, returnTime,
    hostel, floor, roomNo, reason, remark,
    approvers: approversState
  };

  try {
    let res;
    if (currentGatePassId) {
      res = await fetch(`/api/gatepass/${currentGatePassId}`, {
        method: 'PUT', headers: apiHeaders(), body: JSON.stringify(payload)
      });
    } else {
      res = await fetch('/api/gatepass', {
        method: 'POST', headers: apiHeaders(), body: JSON.stringify(payload)
      });
    }
    const data = await res.json();
    if (!res.ok) { alert(data.message || 'Save failed'); return; }
    currentGatePassId = data._id;
    await loadRecent();
    showToast('Gate pass saved successfully!');
  } catch(e) {
    alert('Network error. Please try again.');
  }
}

// ── FIX: handleCancel now also calls renderApprovers ──
function handleCancel() {
  loadGatePass();
}

function handleBack() {
  if (confirm('Logout?')) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login.html';
  }
}

function showToast(msg) {
  const t = document.createElement('div');
  t.className = 'toast';
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.classList.add('toast-show'), 10);
  setTimeout(() => { t.classList.remove('toast-show'); setTimeout(() => t.remove(), 300); }, 2500);
}

// ───────────────────────────────────────────────────
// Gate Pass Popup
// ───────────────────────────────────────────────────

function handleViewPass() {
  const name    = document.getElementById('gp-name').value || 'N/A';
  const depISO  = getCustomDateISO('gp-departure');
  const depTime = document.getElementById('gp-departure-time').value;
  const retISO  = getCustomDateISO('gp-return');
  const retTime = document.getElementById('gp-return-time').value;
  const hostel  = document.getElementById('gp-hostel').value || '';
  const floor   = document.getElementById('gp-floor').value || '';
  const room    = document.getElementById('gp-room').value || '';
  const reason  = document.getElementById('gp-reason').value || '';
  const remark  = document.getElementById('gp-remark').value || '';

  const depFmt      = depISO ? formatOrdinalDateTime(depISO, depTime) : '';
  const retFmt      = retISO ? formatOrdinalDateTime(retISO, retTime) : '';
  const roomDetails = `${hostel} | ${floor} | ${room}`;

  const now = new Date();
  const requestedOn = `Requested on : ${formatOrdinalDateTimeCompact(now.toISOString().split('T')[0], now.toTimeString().slice(0,5))}`;

  const approversHTML = approversState.map((ap) => {
    const dateISO = ap.date || new Date().toISOString().split('T')[0];
    const timeVal = ap.time || randomApprovalTime();
    return `
      <div class="timeline-item">
        <div class="approver-level">${ap.level}</div>
        <div class="approver-name">${ap.name} | ${ap.role || 'Employee'}</div>
        <div class="approver-badge">${ap.status || 'Approved'}</div>
        <div class="approver-date">${formatDate(dateISO)} | ${formatTime(timeVal)}</div>
        ${ap.remark ? `<div class="approver-remark"><img src="/assets/approval_remark.png" alt="" style="width:16px;height:15px;padding-right:2px;"/>${ap.remark}</div>` : ''}
      </div>
    `;
  }).join('');


  _closeClickCount = 0;

  const modal = document.getElementById('gatepass-modal');
  document.getElementById('modal-inner').innerHTML = `
    <div class="modal" style="margin:0;max-width:100%;">
      <div class="modal-header">
        <h2>Gate Pass Request</h2>
        <button class="close-btn" id="modal-close-btn" onclick="handleCloseClick()">
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M1 1l11 11M12 1L1 12" stroke="#111" stroke-width="2" stroke-linecap="round"/></svg>
        </button>
      </div>
      <div class="qr-section">
        <div class="qr-box"><img src="./assets/qrcodenew.png"></div>
        <p class="qr-hint">Show this QR code at the gate to<br>mark Out and In-time.</p>
      </div>
      <div class="info-section">
        <div class="name-row">
          <div class="student-name">${name.toUpperCase()}</div>
          <div class="status-badge">Approved</div>
        </div>
        <div class="requested-on">${requestedOn}</div>
        <div class="detail-row">
          <div class="detail-icon"><img src="/assets/go.png" alt="" style="width:23px;height:26px;"/></div>
          <div class="detail-content">
            <div class="detail-label">Departure Date and Time</div>
            <div class="detail-value">${depFmt}</div>
          </div>
        </div>
        <div class="detail-row">
          <div class="detail-icon"><img src="/assets/return.png" alt="" style="width:23px;height:26px;"/></div>
          <div class="detail-content">
            <div class="detail-label">Return Date and Time</div>
            <div class="detail-value">${retFmt}</div>
          </div>
        </div>
        <div class="detail-row">
          <div class="detail-icon"><img src="/assets/stay.png" alt="" style="width:24px;height:23px;"/></div>
          <div class="detail-content">
            <div class="detail-label">Room Details</div>
            <div class="detail-value">${roomDetails}</div>
          </div>
        </div>
        <div class="detail-row">
          <div class="detail-icon"><img src="/assets/reason.png" alt="" style="width:27px;height:25px;"/></div>
          <div class="detail-content">
            <div class="detail-label">Reason</div>
            <div class="detail-value">${reason}</div>
          </div>
        </div>
        <div class="detail-row">
          <div class="detail-icon"><img src="/assets/approval_remark.png" alt="" style="width:26px;height:23px;"/></div>
          <div class="detail-content">
            <div class="detail-label">Remark</div>
            <div class="detail-value">${remark}</div>
          </div>
        </div>
      </div>
      <div class="approval-section">
        <div class="approval-title">Approval Status</div>
        <div class="timeline">${approversHTML}</div>
      </div>
    </div>
  `;

  modal.style.display = 'flex';
  document.body.style.overflow = 'hidden';

  setTimeout(() => {
    if (window.QRCode) {
      new QRCode(document.getElementById('qr-container'), {
        text: qrData, width: 0, height: 0,
        correctLevel: QRCode.CorrectLevel.M
      });
    }
  }, 100);

  modal.addEventListener('click',    blockOutsideClick, true);
  modal.addEventListener('touchend', blockOutsideClick, true);
}

function blockOutsideClick(e) {
  const inner = document.getElementById('modal-inner');
  if (inner && !inner.contains(e.target)) {
    e.stopPropagation();
    e.preventDefault();
  }
}

function handleCloseClick() {
  _closeClickCount++;
  if (_closeClickCount >= 4) {
    closeGatePassModal();
  }
}

function closeGatePassModal() {
  const modal = document.getElementById('gatepass-modal');
  modal.style.display = 'none';
  document.body.style.overflow = '';
  _closeClickCount = 0;
  modal.removeEventListener('click',    blockOutsideClick, true);
  modal.removeEventListener('touchend', blockOutsideClick, true);
}