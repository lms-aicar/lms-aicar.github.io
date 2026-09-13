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
  let afterUserId = '';

  function signIn() { window.location.replace('index.html'); }
  function roleLabels(roles) { return roles.length ? roles.join(', ') : '—'; }
  function statusClass(value) { return String(value || '').toLowerCase(); }
  function addUserRow(user) {
    const row = document.createElement('tr');
    [user.username, user.displayName, user.email || '—', roleLabels(user.roles)].forEach(function (value) { const cell = document.createElement('td'); cell.textContent = value; row.appendChild(cell); });
    const statusCell = document.createElement('td'); const badge = document.createElement('span'); badge.className = 'status-badge ' + statusClass(user.status); badge.textContent = user.status; statusCell.appendChild(badge); row.appendChild(statusCell);
    const actionCell = document.createElement('td');
    if (user.status === 'PENDING') { const resend = document.createElement('button'); resend.type = 'button'; resend.className = 'table-action'; resend.textContent = 'ส่งรหัสใหม่'; resend.addEventListener('click', function () { reissueActivation(user, resend); }); actionCell.appendChild(resend); }
    if (user.status !== 'SUSPENDED') { const button = document.createElement('button'); button.type = 'button'; button.className = 'table-action'; button.textContent = 'ระงับบัญชี'; button.addEventListener('click', function () { suspendUser(user, button); }); actionCell.appendChild(button); }
    if (user.status === 'PENDING') {
      const editEmail = document.createElement('button');
      editEmail.type = 'button'; editEmail.className = 'table-action'; editEmail.textContent = 'แก้อีเมล';
      editEmail.addEventListener('click', function () { updatePendingEmail(user, editEmail); });
      actionCell.appendChild(editEmail);
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
  async function updatePendingEmail(user, button) {
    const email = window.prompt('อีเมลใหม่สำหรับ ' + user.username, user.email || '');
    if (email == null || !email.trim()) return;
    button.disabled = true; status.textContent = 'กำลังแก้ไขอีเมล…';
    try {
      const result = await window.LMS_API.call('ADMIN_UPDATE_PENDING_EMAIL', { userId: user.userId, email: email.trim() }, true);
      status.dataset.state = 'success'; status.textContent = 'แก้ไขอีเมลเป็น ' + result.email + ' แล้ว กดส่งรหัสใหม่เพื่อส่งรหัสไปยังอีเมลนี้';
      await loadUsers(true);
    } catch (error) {
      if (error.code === 'UNAUTHENTICATED') return signIn();
      delete status.dataset.state; status.textContent = error.message; button.disabled = false;
    }
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
  search.addEventListener('click', function () { loadUsers(true); });
  query.addEventListener('search', function () { loadUsers(true); });
  more.addEventListener('click', function () { loadUsers(false); });
  logout.addEventListener('click', async function () { logout.disabled = true; try { await window.LMS_API.call('LOGOUT', {}, true); } finally { sessionStorage.removeItem('lms_session_token'); signIn(); } });
  async function initialize() {
    if (!sessionStorage.getItem('lms_session_token')) return signIn();
    try { const data = await window.LMS_API.call('ME', {}, true); if (data.permissions.indexOf('users.read') === -1) return window.location.replace('dashboard.html'); content.hidden = false; await loadUsers(true); }
    catch (error) { if (error.code === 'UNAUTHENTICATED') return signIn(); status.textContent = error.message; }
  }
  initialize();
}());
