(function () {
  const requestForm = document.querySelector('#register-request');
  const completeForm = document.querySelector('#register-complete');
  const requestStatus = document.querySelector('#request-status');
  const completeStatus = document.querySelector('#complete-status');
  requestForm.addEventListener('submit', async function (event) {
    event.preventDefault();
    if (!requestForm.reportValidity()) return;
    const button = requestForm.querySelector('button'); button.disabled = true;
    requestStatus.textContent = 'กำลังส่งคำขอ…';
    const data = new FormData(requestForm);
    try {
      await window.LMS_API.call('SELF_REGISTER_REQUEST', {
        studentCode: String(data.get('studentCode')).trim(),
        displayName: String(data.get('displayName')).trim(), email: String(data.get('email')).trim()
      });
      completeForm.elements.studentCode.value = String(data.get('studentCode')).trim();
      completeForm.elements.email.value = String(data.get('email')).trim();
      requestStatus.dataset.state = 'success';
      requestStatus.textContent = 'หากข้อมูลสมัครได้ ระบบจะส่งรหัสไปยังอีเมลนี้ โปรดตรวจกล่องจดหมายและสแปม';
      completeForm.elements.verificationCode.focus();
    } catch (error) { delete requestStatus.dataset.state; requestStatus.textContent = error.message; }
    finally { button.disabled = false; }
  });
  completeForm.addEventListener('submit', async function (event) {
    event.preventDefault();
    if (!completeForm.reportValidity()) return;
    const button = completeForm.querySelector('button'); button.disabled = true;
    completeStatus.textContent = 'กำลังยืนยันอีเมล…';
    const data = new FormData(completeForm);
    try {
      await window.LMS_API.call('SELF_REGISTER_COMPLETE', {
        studentCode: String(data.get('studentCode')).trim(), email: String(data.get('email')).trim(),
        verificationCode: String(data.get('verificationCode')).trim(), password: String(data.get('password'))
      });
      completeForm.elements.password.value = '';
      completeForm.elements.verificationCode.value = '';
      completeStatus.dataset.state = 'success';
      completeStatus.textContent = 'สมัครสำเร็จ เข้าสู่ระบบได้แล้ว รหัสนักเรียนจะได้รับการตรวจยืนยันก่อนออกใบประกาศ';
    } catch (error) { delete completeStatus.dataset.state; completeStatus.textContent = error.message; }
    finally { button.disabled = false; }
  });
}());
