(function () {
  const status = document.querySelector('#status');
  const requestForm = document.querySelector('#request-form');
  const resetForm = document.querySelector('#reset-form');
  requestForm.addEventListener('submit', async function (event) {
    event.preventDefault();
    const button = requestForm.querySelector('button'); button.disabled = true;
    const fields = new FormData(requestForm);
    try {
      await LMS_API.call('REQUEST_PASSWORD_RESET', { username: fields.get('username'), email: fields.get('email') }, false);
      status.textContent = 'หากข้อมูลตรงกับบัญชีที่ใช้งานอยู่ ระบบจะส่งรหัสครั้งเดียวไปทางอีเมล';
    } catch (error) { status.textContent = error.message; }
    finally { button.disabled = false; }
  });
  resetForm.addEventListener('submit', async function (event) {
    event.preventDefault();
    const button = resetForm.querySelector('button'); button.disabled = true;
    const fields = new FormData(resetForm);
    try {
      await LMS_API.call('RESET_PASSWORD', { username: fields.get('username'), resetCode: fields.get('resetCode'), password: fields.get('password') }, false);
      resetForm.reset();
      status.textContent = 'เปลี่ยนรหัสผ่านแล้ว กรุณาเข้าสู่ระบบใหม่';
    } catch (error) { status.textContent = error.message; }
    finally { button.disabled = false; }
  });
}());
