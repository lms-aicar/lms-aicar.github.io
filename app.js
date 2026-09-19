(function () {
  const form = document.querySelector('#password-login');
  const status = document.querySelector('#form-status');

  function setStatus(message, state) { status.textContent = message; status.dataset.state = state || 'error'; }

  form.addEventListener('submit', async function (event) {
    event.preventDefault(); setStatus('กำลังตรวจสอบข้อมูล...', '');
    if (!form.reportValidity()) return;
    const submit = form.querySelector('button[type="submit"]'); submit.disabled = true;
    try {
      const data = await window.LMS_API.call('LOGIN_PASSWORD', { username: form.username.value.trim(), password: form.password.value });
      sessionStorage.setItem('lms_session_token', data.sessionToken);
      form.password.value = '';
      window.location.assign('dashboard.html');
    } catch (error) { setStatus(error.message); } finally { submit.disabled = false; }
  });

  const googleButton = document.querySelector('#google-login');
  googleButton.disabled = !window.LMS_CONFIG || !window.LMS_CONFIG.googleEnabled;
  googleButton.addEventListener('click', async function () {
    googleButton.disabled = true; setStatus('กำลังตรวจสอบบัญชี Google...', '');
    try {
      const code = await window.LMS_GOOGLE.requestCode();
      const data = await window.LMS_API.call('LOGIN_GOOGLE_CODE', { code: code });
      sessionStorage.setItem('lms_session_token', data.sessionToken);
      window.location.assign('dashboard.html');
    } catch (error) { setStatus(error.message); googleButton.disabled = false; }
  });

}());
