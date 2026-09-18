(function () {
  const status = document.querySelector('#status');
  const history = document.querySelector('#history');
  const form = document.querySelector('#practical-form');
  async function load() {
    try {
      const data = await LMS_API.call('MY_K230_PRACTICAL', {}, true);
      history.replaceChildren();
      if (!data.submissions.length) { history.textContent = 'ยังไม่มีงานที่ส่ง'; return; }
      data.submissions.forEach(function (item) {
        const card = document.createElement('article'); card.className = 'course-card';
        const heading = document.createElement('h3'); heading.textContent = item.status;
        const detail = document.createElement('p'); detail.textContent = new Date(item.submittedAt).toLocaleString('th-TH') + ' · mAP ที่รายงาน ' + item.reportedMap5095;
        card.append(heading, detail);
        if (item.feedback) { const note = document.createElement('p'); note.textContent = 'ผลตรวจ: ' + item.feedback; card.append(note); }
        history.append(card);
      });
    } catch (error) { status.textContent = error.message; }
  }
  form.addEventListener('submit', async function (event) {
    event.preventDefault();
    const button = form.querySelector('button'); button.disabled = true;
    try {
      const fields = Object.fromEntries(new FormData(form).entries());
      fields.requestKey = crypto.randomUUID();
      await LMS_API.call('SUBMIT_K230_PRACTICAL', fields, true);
      status.textContent = 'ส่งงานแล้ว'; form.reset(); await load();
    } catch (error) { status.textContent = error.message; } finally { button.disabled = false; }
  });
  load();
}());
