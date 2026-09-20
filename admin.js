(function () {
  const status = document.querySelector('#admin-status');
  const content = document.querySelector('#admin-content');
  const form = document.querySelector('#create-user-form');
  const submit = document.querySelector('#create-user');
  const body = document.querySelector('#users-body');
  const query = document.querySelector('#user-query');
  const search = document.querySelector('#search-users');
  const more = document.querySelector('#load-more');
  const logout = document.querySelector('#logout');
  const rosterForm = document.querySelector('#roster-form');
  const rosterInput = document.querySelector('#roster-rows');
  const rosterStatus = document.querySelector('#roster-status');
  const rosterButton = document.querySelector('#import-roster');
  const k230Section = document.querySelector('#k230-seed-section');
  const k230Button = document.querySelector('#k230-seed-button');
  const k230Status = document.querySelector('#k230-seed-status');
  let afterUserId = '';
  let canManageRoles = false;
  let canManageUsers = false;
  let myUserId = '';

  function signIn() { window.location.replace('index.html'); }
  function roleLabels(roles) { return roles.length ? roles.join(', ') : '—'; }
  function statusClass(value) { return String(value || '').toLowerCase(); }
  function addUserRow(user) {
    const row = document.createElement('tr');
    [user.username, user.displayName, user.email || '—', roleLabels(user.roles)].forEach(function (value) { const cell = document.createElement('td'); cell.textContent = value; row.appendChild(cell); });
    const statusCell = document.createElement('td'); const badge = document.createElement('span'); badge.className = 'status-badge ' + statusClass(user.status); badge.textContent = user.status; statusCell.appendChild(badge); if (user.studentIdentityStatus === 'UNVERIFIED') { const note = document.createElement('small'); note.textContent = ' · รหัสนักเรียนรอตรวจ'; statusCell.append(note); } row.appendChild(statusCell);
    const actionCell = document.createElement('td');
    if (canManageUsers && user.status === 'PENDING') { const resend = document.createElement('button'); resend.type = 'button'; resend.className = 'table-action'; resend.textContent = 'ส่งรหัสใหม่'; resend.addEventListener('click', function () { reissueActivation(user, resend); }); actionCell.appendChild(resend); }
    if (canManageUsers && user.status === 'ACTIVE' && user.studentIdentityStatus === 'UNVERIFIED') { const verify = document.createElement('button'); verify.type = 'button'; verify.className = 'table-action'; verify.textContent = 'ยืนยันรหัสนักเรียน'; verify.addEventListener('click', async function () { if (!window.confirm('ตรวจหลักฐานแล้วและยืนยันรหัสนักเรียน ' + user.username + ' ใช่หรือไม่?')) return; verify.disabled = true; try { await window.LMS_API.call('ADMIN_VERIFY_STUDENT_ID', { userId: user.userId }, true); await loadUsers(true); } catch (error) { status.textContent = error.message; verify.disabled = false; } }); actionCell.appendChild(verify); }
    if (canManageUsers && user.status !== 'SUSPENDED') { const button = document.createElement('button'); button.type = 'button'; button.className = 'table-action'; button.textContent = 'ระงับบัญชี'; button.addEventListener('click', function () { suspendUser(user, button); }); actionCell.appendChild(button); }
    if (canManageRoles && user.status === 'ACTIVE' && user.userId !== myUserId) {
      const selector = document.createElement('select');
      ['ADMIN', 'ACADEMIC_ADMIN', 'AUDITOR', 'CERTIFICATE_VERIFIER'].forEach(function (role) {
        const option = document.createElement('option'); option.value = role; option.textContent = role; selector.appendChild(option);
      });
      const assign = document.createElement('button'); assign.type = 'button'; assign.className = 'table-action'; assign.textContent = 'เพิ่มบทบาท';
      const revoke = document.createElement('button'); revoke.type = 'button'; revoke.className = 'table-action'; revoke.textContent = 'ถอนบทบาท';
      function changeRole(operation) {
        if (!window.confirm((operation === 'ASSIGN' ? 'เพิ่ม' : 'ถอน') + 'บทบาท ' + selector.value + ' ของ ' + user.username + '?')) return;
        assign.disabled = true; revoke.disabled = true;
        window.LMS_API.call('ADMIN_SET_SYSTEM_ROLE', { userId: user.userId, roleCode: selector.value, operation: operation }, true)
          .then(function () { return loadUsers(true); })
          .catch(function (error) { status.textContent = error.message; assign.disabled = false; revoke.disabled = false; });
      }
      assign.addEventListener('click', function () { changeRole('ASSIGN'); });
      revoke.addEventListener('click', function () { changeRole('REVOKE'); });
      actionCell.append(selector, assign, revoke);
    }
    row.appendChild(actionCell); body.appendChild(row);
  }
  async function loadUsers(reset) {
    if (reset) { afterUserId = ''; body.replaceChildren(); }
    search.disabled = true; more.disabled = true; status.textContent = 'กำลังโหลดรายชื่อผู้ใช้…';
    try {
      const data = await window.LMS_API.call('ADMIN_LIST_USERS', { limit: 50, query: query.value, afterUserId: afterUserId }, true);
      data.users.forEach(addUserRow); afterUserId = data.nextAfterUserId || ''; more.hidden = !afterUserId; status.textContent = data.users.length || body.children.length ? '' : 'ไม่พบผู้ใช้';
    } catch (error) { if (error.code === 'UNAUTHENTICATED') return signIn(); status.textContent = error.message; }
    finally { search.disabled = false; more.disabled = false; }
  }
  async function suspendUser(user, button) {
    if (!window.confirm('ระงับบัญชี ' + user.username + ' ใช่หรือไม่? ผู้ใช้นี้จะเข้าสู่ระบบไม่ได้ทันที')) return;
    button.disabled = true; status.textContent = '';
    try { await window.LMS_API.call('ADMIN_SUSPEND_USER', { userId: user.userId }, true); await loadUsers(true); }
    catch (error) { if (error.code === 'UNAUTHENTICATED') return signIn(); status.textContent = error.message; button.disabled = false; }
  }
  async function reissueActivation(user, button) {
    button.disabled = true; status.textContent = 'กำลังส่งรหัสเปิดใช้ใหม่…';
    try { const data = await window.LMS_API.call('ADMIN_REISSUE_ACTIVATION', { userId: user.userId }, true); status.dataset.state = 'success'; status.textContent = 'ส่งรหัสเปิดใช้ใหม่ไปที่ ' + data.email + ' แล้ว'; await loadUsers(true); }
    catch (error) { if (error.code === 'UNAUTHENTICATED') return signIn(); delete status.dataset.state; status.textContent = error.message; button.disabled = false; }
  }
  form.addEventListener('submit', async function (event) {
    event.preventDefault(); if (!form.reportValidity()) return;
    submit.disabled = true; status.textContent = 'กำลังสร้างบัญชีและส่งอีเมล…';
    try {
      const values = new FormData(form); const email = values.get('email'); await window.LMS_API.call('ADMIN_CREATE_PENDING_USER', { username: values.get('username'), displayName: values.get('displayName'), email: email }, true);
      form.reset(); status.dataset.state = 'success'; status.textContent = 'ส่งรหัสเปิดใช้บัญชีไปที่ ' + email + ' แล้ว'; await loadUsers(true);
    } catch (error) { if (error.code === 'UNAUTHENTICATED') return signIn(); delete status.dataset.state; status.textContent = error.message; }
    finally { submit.disabled = false; }
  });
  rosterForm.addEventListener('submit', async function (event) {
    event.preventDefault();
    const lines = rosterInput.value.split(/\r?\n/).filter(function (line) { return line.trim(); });
    if (!lines.length) return;
    const rows = lines.map(function (line) { return line.split('\t').map(function (cell) { return cell.trim(); }); });
    if (rows.some(function (row) { return row.length < 3 || row.length > 6; })) {
      rosterStatus.textContent = 'แต่ละบรรทัดต้องมี 3 ถึง 6 คอลัมน์ โดยคั่นด้วย Tab'; return;
    }
    rosterButton.disabled = true;
    let accepted = 0; let existing = 0; let conflicts = 0; let mailFailed = 0;
    try {
      for (let start = 0; start < rows.length; start += 10) {
        rosterStatus.textContent = 'กำลังนำเข้า ' + Math.min(start + 10, rows.length) + '/' + rows.length;
        const batch = rows.slice(start, start + 10).map(function (row) {
          return { username: row[0], displayName: row[1], email: row[2], className: row[3] || '', academicYear: row[4] || '', semester: row[5] || '' };
        });
        const data = await window.LMS_API.call('ADMIN_IMPORT_ROSTER', { rows: batch }, true);
        data.results.forEach(function (result) {
          if (result.status === 'MAIL_ACCEPTED') accepted += 1;
          else if (result.status === 'ALREADY_EXISTS') existing += 1;
          else if (result.status === 'CONFLICT') conflicts += 1;
          else if (result.status === 'MAIL_FAILED') mailFailed += 1;
        });
      }
      rosterStatus.textContent = 'ระบบรับคำขอส่งอีเมล ' + accepted + ' คน, มีบัญชีแล้ว ' + existing + ' คน, ข้อมูลชนกัน ' + conflicts + ' คน, ส่งอีเมลไม่สำเร็จ ' + mailFailed + ' คน';
      await loadUsers(true);
    } catch (error) {
      rosterStatus.textContent = 'หยุดนำเข้า: ' + error.message + ' — รายการก่อนหน้าอาจบันทึกแล้ว สามารถกดนำเข้าอีกครั้งเพื่อข้ามบัญชีเดิม';
    } finally { rosterButton.disabled = false; }
  });
  k230Button.addEventListener('click', async function () {
    k230Button.disabled = true;
    try {
      for (let unitNumber = 1; unitNumber <= 3; unitNumber++) {
        k230Status.textContent = 'กำลังนำเข้าหน่วย ' + unitNumber + '/3';
        await window.LMS_API.call('COURSE_SEED_K230_UNIT', { unitNumber: unitNumber }, true);
      }
      k230Status.textContent = 'นำเข้ารายวิชา K230 ครบแล้ว สามารถเปิดดูในรายการรายวิชา';
      k230Status.dataset.state = 'success';
    } catch (error) {
      k230Status.textContent = 'หยุดนำเข้า: ' + error.message + ' กดปุ่มอีกครั้งเพื่อทำต่อจากข้อมูลที่บันทึกแล้ว';
    } finally { k230Button.disabled = false; }
  });
  search.addEventListener('click', function () { loadUsers(true); });
  query.addEventListener('search', function () { loadUsers(true); });
  more.addEventListener('click', function () { loadUsers(false); });
  logout.addEventListener('click', async function () { logout.disabled = true; try { await window.LMS_API.call('LOGOUT', {}, true); } finally { sessionStorage.removeItem('lms_session_token'); signIn(); } });
  async function initialize() {
    if (!sessionStorage.getItem('lms_session_token')) return signIn();
    try { const data = await window.LMS_API.call('ME', {}, true); if (data.permissions.indexOf('users.read') === -1) return window.location.replace('dashboard.html'); canManageUsers = data.permissions.indexOf('users.manage') !== -1; canManageRoles = data.permissions.indexOf('roles.manage') !== -1 && data.user.roles.indexOf('SUPER_ADMIN') !== -1; myUserId = data.user.userId; form.closest('.admin-panel').hidden = !canManageUsers; rosterForm.closest('.admin-panel').hidden = !canManageUsers; k230Section.hidden = data.permissions.indexOf('courses.create') === -1 || data.permissions.indexOf('courses.publish') === -1; content.hidden = false; await loadUsers(true); }
    catch (error) { if (error.code === 'UNAUTHENTICATED') return signIn(); status.textContent = error.message; }
  }
  initialize();
}());
