(function () {
  const config = window.LMS_CONFIG || { apiUrl: '', googleClientId: '' };
  const form = document.querySelector('#password-login');
  const status = document.querySelector('#form-status');

  function setStatus(message, state) { status.textContent = message; status.dataset.state = state || 'error'; }
  async function callApi(payload) {
    if (!config.apiUrl) throw new Error('ยังไม่ได้ตั้งค่า URL ของระบบหลังบ้าน');
    const response = await fetch(config.apiUrl, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=UTF-8' }, body: JSON.stringify(payload) });
    const result = await response.json();
    if (!result.ok) throw new Error(result.error && result.error.message ? result.error.message : 'ไม่สามารถทำรายการได้');
    return result.data;
  }

  form.addEventListener('submit', async function (event) {
    event.preventDefault(); setStatus('กำลังตรวจสอบข้อมูล...', '');
    const submit = form.querySelector('button[type="submit"]'); submit.disabled = true;
    try {
      const data = await callApi({ action: 'LOGIN_PASSWORD', username: form.username.value.trim(), password: form.password.value });
      sessionStorage.setItem('lms_session_token', data.sessionToken);
      setStatus('เข้าสู่ระบบสำเร็จ กำลังเตรียมภารกิจของคุณ...', 'success');
    } catch (error) { setStatus(error.message); } finally { submit.disabled = false; }
  });

}());
