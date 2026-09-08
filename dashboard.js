(function () {
  const status = document.querySelector('#account-status');
  const content = document.querySelector('#account-content');
  const retry = document.querySelector('#retry-account');
  const refresh = document.querySelector('#refresh-account');
  const logout = document.querySelector('#logout');
  function signIn() { window.location.replace('index.html'); }
  async function loadAccount() {
    if (!sessionStorage.getItem('lms_session_token')) return signIn();
    retry.hidden = true; refresh.disabled = true;
    status.textContent = 'กำลังตรวจสอบบัญชี…';
    try {
      const data = await window.LMS_API.call('ME', {}, true);
      document.querySelector('#display-name').textContent = data.user.displayName;
      document.querySelector('#account-username').textContent = data.user.username;
      document.querySelector('#account-email').textContent = data.user.email || 'ยังไม่ได้ระบุ';
      const labels = { SUPER_ADMIN: 'ผู้ดูแลระบบหลัก', ADMIN: 'ผู้ดูแลระบบ', STUDENT: 'นักเรียน', TEACHER: 'ครู', ACADEMIC_ADMIN: 'ผู้ดูแลวิชาการ', ASSISTANT_TEACHER: 'ผู้ช่วยครู', AUDITOR: 'ผู้ตรวจสอบ', CERTIFICATE_VERIFIER: 'ผู้ตรวจสอบใบประกาศ' };
      document.querySelector('#account-roles').textContent = data.user.roles.map(function (role) { return labels[role] || role; }).join(', ') || 'รอผู้ดูแลกำหนดบทบาท';
      content.hidden = false; status.textContent = '';
    } catch (error) {
      content.hidden = true;
      if (error.code === 'UNAUTHENTICATED') return signIn();
      status.textContent = error.message; retry.hidden = false;
    } finally { refresh.disabled = false; }
  }
  logout.addEventListener('click', async function () {
    logout.disabled = true;
    try {
      await window.LMS_API.call('LOGOUT', {}, true);
      sessionStorage.removeItem('lms_session_token'); signIn();
    } catch (error) {
      if (error.code === 'UNAUTHENTICATED') return signIn();
      status.textContent = 'ยังออกจากระบบไม่สำเร็จ: ' + error.message;
    } finally { logout.disabled = false; }
  });
  retry.addEventListener('click', loadAccount);
  refresh.addEventListener('click', loadAccount);
  loadAccount();
}());
