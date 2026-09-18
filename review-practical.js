(function () {
  const status = document.querySelector('#status'); const queue = document.querySelector('#queue');
  function link(label, url) { const a = document.createElement('a'); a.href = url; a.target = '_blank'; a.rel = 'noopener noreferrer'; a.textContent = label; return a; }
  async function load() {
    try {
      const data = await LMS_API.call('K230_PRACTICAL_QUEUE', {}, true); queue.replaceChildren();
      const pending = data.submissions.filter(function (s) { return s.status === 'PENDING_REVIEW'; });
      if (!pending.length) { queue.textContent = 'ไม่มีงานรอตรวจ'; return; }
      pending.forEach(function (item) {
        const card = document.createElement('article'); card.className = 'course-card';
        const h = document.createElement('h2'); h.textContent = item.username;
        const detail = document.createElement('p'); detail.textContent = 'mAP ที่นักเรียนรายงาน: ' + item.reportedMap5095 + '\n' + item.description;
        card.append(h, detail, link('best.kmodel', item.modelUrl), document.createTextNode(' · '), link('ภาพ mAP', item.mapUrl), document.createTextNode(' · '), link('ภาพ Annotation', item.annotationUrl));
        const form = document.createElement('form');
        form.innerHTML = '<label>mAP50-95 ที่ตรวจแล้ว<input name="verifiedMap5095" type="number" min="0" max="1" step="0.001" required></label><label>Dataset / Annotation (0–25)<input name="dataset" type="number" min="0" max="25" required></label><label>Colab (0–25)<input name="colabProcess" type="number" min="0" max="25" required></label><label>ประสิทธิภาพโมเดล (0–30)<input name="modelPerformance" type="number" min="0" max="30" required></label><label>แก้ปัญหา (0–20)<input name="problemSolving" type="number" min="0" max="20" required></label><label>ข้อเสนอแนะ<textarea name="feedback" maxlength="2000"></textarea></label><label><input name="filesVerified" type="checkbox"> ฉันเปิดและตรวจไฟล์ทั้งสามแล้ว ชื่อไฟล์โมเดลคือ best.kmodel</label><button class="primary-button" type="submit" value="APPROVE">อนุมัติ</button> <button class="secondary-button" type="submit" value="REVISION_REQUIRED">ให้แก้ไข</button>';
        form.addEventListener('submit', async function (event) {
          event.preventDefault(); const decision = event.submitter.value; const fields = Object.fromEntries(new FormData(form).entries());
          const rubricScores = { dataset: fields.dataset, colabProcess: fields.colabProcess, modelPerformance: fields.modelPerformance, problemSolving: fields.problemSolving };
          if (decision === 'REVISION_REQUIRED' && !fields.feedback.trim()) { status.textContent = 'กรุณาระบุสิ่งที่ต้องแก้'; return; }
          try { await LMS_API.call('REVIEW_K230_PRACTICAL', { submissionId: item.submissionId, decision: decision, feedback: fields.feedback, verifiedMap5095: fields.verifiedMap5095, rubricScores: rubricScores, filesVerified: fields.filesVerified === 'on' }, true); status.textContent = 'บันทึกผลตรวจแล้ว'; await load(); }
          catch (error) { status.textContent = error.message; }
        }); card.append(form); queue.append(card);
      });
    } catch (error) { status.textContent = error.message; }
  }
  load();
}());
