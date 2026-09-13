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
      document.querySelector('#admin-link').hidden = data.permissions.indexOf('users.read') === -1;
      if (!document.querySelector('#learning-link')) {
        const learningLink = document.createElement('a');
        learningLink.id = 'learning-link'; learningLink.className = 'secondary-button';
        learningLink.href = 'learn.html'; learningLink.textContent = 'การเรียนของฉัน';
        document.querySelector('.header-actions').prepend(learningLink);
      }
      if (data.permissions.indexOf('courses.create') !== -1) {
        let coursesLink = document.querySelector('#courses-link');
        if (!coursesLink) {
          coursesLink = document.createElement('a');
          coursesLink.id = 'courses-link'; coursesLink.className = 'secondary-button';
          coursesLink.href = 'courses.html'; coursesLink.textContent = 'จัดการรายวิชา';
          document.querySelector('.header-actions').prepend(coursesLink);
        }
        coursesLink.hidden = false;
      }
      if (data.permissions.indexOf('courses.publish') !== -1 && !document.querySelector('#formal-link')) {
        const formalLink = document.createElement('a');
        formalLink.id = 'formal-link'; formalLink.className = 'secondary-button';
        formalLink.href = 'formal.html'; formalLink.textContent = 'จัดรายชื่อวิชา';
        document.querySelector('.header-actions').prepend(formalLink);
      }
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
