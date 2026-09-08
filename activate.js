(function () {
  const form = document.querySelector('#account-activation');
  const status = document.querySelector('#form-status');

  function setStatus(message, state) { status.textContent = message; status.dataset.state = state || 'error'; }
  form.addEventListener('submit', async function (event) {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const button = form.querySelector('button[type="submit"]'); button.disabled = true; setStatus('กำลังเปิดใช้บัญชี...', '');
    try {
      await window.LMS_API.call('ACTIVATE_ACCOUNT', { username: form.username.value.trim(), activationCode: form.activationCode.value.trim(), password: form.password.value });
      form.reset(); setStatus('เปิดใช้บัญชีสำเร็จ คุณสามารถเข้าสู่ระบบได้แล้ว', 'success');
    } catch (error) { setStatus(error.message); } finally { button.disabled = false; }
  });
}());
