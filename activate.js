(function () {
  const config = window.LMS_CONFIG || { apiUrl: '' };
  const form = document.querySelector('#account-activation');
  const status = document.querySelector('#form-status');

  function setStatus(message, state) { status.textContent = message; status.dataset.state = state || 'error'; }
  form.addEventListener('submit', async function (event) {
    event.preventDefault();
    if (!config.apiUrl) return setStatus('ยังไม่ได้ตั้งค่า URL ของระบบหลังบ้าน');
    const button = form.querySelector('button[type="submit"]'); button.disabled = true; setStatus('กำลังเปิดใช้บัญชี...', '');
    try {
      const response = await fetch(config.apiUrl, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=UTF-8' }, body: JSON.stringify({ action: 'ACTIVATE_ACCOUNT', username: form.username.value.trim(), activationCode: form.activationCode.value.trim(), password: form.password.value }) });
      const result = await response.json();
      if (!result.ok) throw new Error(result.error && result.error.message ? result.error.message : 'ไม่สามารถเปิดใช้บัญชีได้');
      form.reset(); setStatus('เปิดใช้บัญชีสำเร็จ คุณสามารถเข้าสู่ระบบได้แล้ว', 'success');
    } catch (error) { setStatus(error.message); } finally { button.disabled = false; }
  });
}());
