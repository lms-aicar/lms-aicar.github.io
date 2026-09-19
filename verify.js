(function () {
  const form = document.querySelector('#verify-form'); const status = document.querySelector('#status'); const result = document.querySelector('#result');
  const params = new URLSearchParams(location.search);
  if (params.has('id') && params.has('code')) { form.elements.certificateId.value = params.get('id'); form.elements.verificationCode.value = params.get('code'); history.replaceState(null, '', 'verify.html'); }
  async function verify(event) {
    if (event) event.preventDefault();
    result.hidden = true; status.textContent = 'กำลังตรวจสอบ...';
    const button = form.querySelector('button'); button.disabled = true;
    try {
      const fields = Object.fromEntries(new FormData(form).entries());
      const data = await LMS_API.call('VERIFY_K230_CERTIFICATE', fields, false);
      status.textContent = data.valid ? 'ใบประกาศถูกต้องและยังมีผล' : data.revoked ? 'ใบประกาศนี้ถูกเพิกถอนแล้ว' : 'ไม่พบใบประกาศที่ตรงกับรหัสทั้งสอง';
      if (data.valid) {
        result.replaceChildren();
        for (const [label, value] of [['ผู้เรียน', data.learnerName], ['รายวิชา', data.courseTitle], ['สถานศึกษา', data.institution], ['ออกเมื่อ', data.issuedAt]]) {
          const line = document.createElement('p'); line.textContent = label + ': ' + value; result.append(line);
        }
        result.hidden = false;
      }
    } catch (error) { status.textContent = error.message; } finally { button.disabled = false; }
  }
  form.addEventListener('submit', verify);
  if (form.elements.certificateId.value && form.elements.verificationCode.value) verify();
}());
