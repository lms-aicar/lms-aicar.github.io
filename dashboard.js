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
      if (!document.querySelector('#take-posttest-link')) {
        const postTestLink = document.createElement('a');
        postTestLink.id = 'take-posttest-link'; postTestLink.className = 'secondary-button';
        postTestLink.href = 'take-posttest.html'; postTestLink.textContent = '\u0e17\u0e33 Post-test';
        document.querySelector('.header-actions').prepend(postTestLink);
      }
      if (!document.querySelector('#results-link')) {
        const resultsLink = document.createElement('a');
        resultsLink.id = 'results-link'; resultsLink.className = 'secondary-button';
        resultsLink.href = 'results.html'; resultsLink.textContent = 'ผลการประเมิน';
        document.querySelector('.header-actions').prepend(resultsLink);
      }
      if (!document.querySelector('#progress-link')) {
        const progressLink = document.createElement('a');
        progressLink.id = 'progress-link'; progressLink.className = 'secondary-button';
        progressLink.href = 'progress.html'; progressLink.textContent = 'ความก้าวหน้าการเรียน';
        document.querySelector('.header-actions').prepend(progressLink);
      }
      if (!document.querySelector('#my-activities-link')) { const link=document.createElement('a');link.id='my-activities-link';link.className='secondary-button';link.href='my-activities.html';link.textContent='งานของฉัน';document.querySelector('.header-actions').prepend(link); }
      if (data.permissions.indexOf('courses.create') !== -1) {
        if (!document.querySelector('#activities-link')) { const link=document.createElement('a');link.id='activities-link';link.className='secondary-button';link.href='activities.html';link.textContent='สร้างงานส่ง';document.querySelector('.header-actions').prepend(link); }
        if (!document.querySelector('#grade-activities-link')) { const link=document.createElement('a');link.id='grade-activities-link';link.className='secondary-button';link.href='grade-activities.html';link.textContent='ตรวจงานส่ง';document.querySelector('.header-actions').prepend(link); }
        let coursesLink = document.querySelector('#courses-link');
        if (!coursesLink) {
          coursesLink = document.createElement('a');
          coursesLink.id = 'courses-link'; coursesLink.className = 'secondary-button';
          coursesLink.href = 'courses.html'; coursesLink.textContent = 'จัดการรายวิชา';
          document.querySelector('.header-actions').prepend(coursesLink);
        }
        coursesLink.hidden = false;
        if (!document.querySelector('#pretest-link')) {
          const pretestLink = document.createElement('a');
          pretestLink.id = 'pretest-link'; pretestLink.className = 'secondary-button';
          pretestLink.href = 'pretest.html'; pretestLink.textContent = 'จัดการ Pre-test';
          document.querySelector('.header-actions').prepend(pretestLink);
        }
        if (!document.querySelector('#questions-link')) {
          const questionsLink = document.createElement('a');
          questionsLink.id = 'questions-link'; questionsLink.className = 'secondary-button';
          questionsLink.href = 'questions.html'; questionsLink.textContent = 'คลังคำถาม';
          document.querySelector('.header-actions').prepend(questionsLink);
        }
        if (!document.querySelector('#posttest-link')) {
          const posttestLink = document.createElement('a');
          posttestLink.id = 'posttest-link'; posttestLink.className = 'secondary-button';
          posttestLink.href = 'posttest.html'; posttestLink.textContent = '\u0e08\u0e31\u0e14\u0e01\u0e32\u0e23 Post-test';
          document.querySelector('.header-actions').prepend(posttestLink);
        }
        if (!document.querySelector('#course-results-link')) {
          const reportLink = document.createElement('a');
          reportLink.id = 'course-results-link'; reportLink.className = 'secondary-button';
          reportLink.href = 'course-results.html'; reportLink.textContent = 'รายงานผลรายวิชา';
          document.querySelector('.header-actions').prepend(reportLink);
        }
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
