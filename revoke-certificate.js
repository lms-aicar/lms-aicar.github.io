(function () {
  const form = document.querySelector('#revoke-form'); const status = document.querySelector('#status');
  form.addEventListener('submit', async function (event) {
    event.preventDefault();
    if (!confirm('ยืนยันการเพิกถอนใบประกาศนี้?')) return;
    const button = form.querySelector('button'); button.disabled = true;
    try { const fields = Object.fromEntries(new FormData(form).entries()); await LMS_API.call('REVOKE_K230_CERTIFICATE', fields, true); status.textContent = 'เพิกถอนใบประกาศแล้ว'; form.reset(); }
    catch (error) { status.textContent = error.message; } finally { button.disabled = false; }
  });
}());
