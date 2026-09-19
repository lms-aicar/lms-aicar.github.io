(function () {
  const status = document.querySelector('#status');
  const container = document.querySelector('#courses');
  const xp = document.querySelector('#xp');
  function line(parent, label, value) {
    const node = document.createElement('p');
    node.textContent = label + value;
    parent.appendChild(node);
  }
  (async function () {
    try {
      const reconciliation = await LMS_API.call('RECONCILE_MY_XP', {}, true);
      if (reconciliation.hasMore) status.textContent = 'กำลังปรับยอด XP เพิ่มเติม โปรดรีเฟรชหน้านี้อีกครั้ง';
      const data = await LMS_API.call('MY_LEARNING_OVERVIEW', {}, true);
      xp.hidden = false;
      line(xp, 'ระดับ ', data.level);
      line(xp, 'XP รวม ', data.totalXp);
      line(xp, 'อีก ', data.xpUntilNextLevel + ' XP ถึงระดับถัดไป');
      if (!data.courses.length) { status.textContent = 'ยังไม่มีรายวิชาที่ลงทะเบียน'; return; }
      data.courses.forEach(function (course) {
        const card = document.createElement('article');
        card.className = 'course-card';
        const title = document.createElement('h2');
        title.textContent = course.courseTitle;
        card.appendChild(title);
        line(card, 'บทเรียน ', course.completedLessons + '/' + course.totalLessons + ' (' + course.lessonPercent + '%)');
        line(card, 'คะแนนงานเฉลี่ย ', course.assignmentScore == null ? 'ยังไม่มี' : course.assignmentScore + '%');
        line(card, 'Post-test สูงสุด ', course.postTestScore == null ? 'ยังไม่มี' : course.postTestScore + '%');
        line(card, 'ความชำนาญ ', course.masteryScore + '% (' + course.masteryState + ')');
        line(card, 'XP ในรายวิชา ', course.xp);
        if (course.review) line(card, 'แนะนำ: ', course.review);
        container.appendChild(card);
      });
      if (data.courses.some(function (course) { return course.courseId === 'course_ai_k230_robot'; })) {
        const certificate = await LMS_API.call('MY_K230_CERTIFICATE_STATUS', {}, true);
        document.querySelector('#certificate').hidden = false;
        document.querySelector('#certificate-status').textContent = certificate.certificateIssued ?
          'ออกใบประกาศแล้ว: ' + certificate.certificateId : certificate.certificateRevoked ?
          'ใบประกาศถูกเพิกถอนแล้ว' : certificate.eligible ?
          'ผ่านเกณฑ์แล้ว กำลังรอระบบออกใบประกาศ' : 'ยังไม่ครบเกณฑ์รับใบประกาศ';
        const panel = document.querySelector('#certificate');
        if (certificate.eligible && !certificate.certificateIssued && !certificate.certificateRevoked) {
          const issue = document.createElement('button'); issue.className = 'primary-button'; issue.textContent = 'ออกใบประกาศของฉัน';
          issue.addEventListener('click', async function () { issue.disabled = true; try { const result = await LMS_API.call('ISSUE_MY_K230_CERTIFICATE', {}, true); status.textContent = result.status === 'VALID' ? 'ออกใบประกาศแล้ว โปรดรีเฟรชเพื่อดาวน์โหลด' : 'กำลังจัดทำใบประกาศ โปรดลองอีกครั้งภายหลัง'; } catch (error) { status.textContent = error.message; issue.disabled = false; } });
          panel.append(issue);
        }
        if (certificate.certificateIssued) {
          const download = document.createElement('button'); download.className = 'primary-button'; download.textContent = 'ดาวน์โหลดใบประกาศ PDF';
          download.addEventListener('click', async function () { download.disabled = true; try { const file = await LMS_API.call('MY_K230_CERTIFICATE_PDF', {}, true); const bytes = Uint8Array.from(atob(file.base64), function (c) { return c.charCodeAt(0); }); const url = URL.createObjectURL(new Blob([bytes], { type: 'application/pdf' })); const a = document.createElement('a'); a.href = url; a.download = file.filename; a.click(); setTimeout(function () { URL.revokeObjectURL(url); }, 60000); } catch (error) { status.textContent = error.message; } finally { download.disabled = false; } });
          panel.append(download);
        }
        const labels = { COURSE_CONTENT_INCOMPLETE: 'บทเรียนในรายวิชายังตั้งค่าไม่ครบ', COURSE_UNITS_INCOMPLETE: 'หน่วยเรียนยังตั้งค่าไม่ครบ',
          ACTIVITY_RULES_INCOMPLETE: 'กิจกรรมบังคับยังตั้งค่าไม่ครบ', PRACTICAL_NOT_APPROVED: 'งานปฏิบัติยังไม่ได้รับอนุมัติ',
          MODEL_FILE_MISSING: 'ยังไม่มีไฟล์ best.kmodel ที่ตรวจแล้ว', ANNOTATION_EVIDENCE_MISSING: 'ยังไม่มีภาพ Annotation ที่ตรวจแล้ว',
          MAP_EVIDENCE_MISSING: 'หลักฐาน mAP50-95 ยังไม่ครบหรือไม่ถึง 0.50', PRACTICAL_SCORE_TOO_LOW: 'งานปฏิบัติยังไม่ผ่าน 70 คะแนนตาม rubric',
          OTHER_REQUIRED_WORK_PENDING: 'ยังมีกิจกรรมบังคับที่ไม่ครบ' };
        const list = document.querySelector('#certificate-missing');
        certificate.missing.forEach(function (code) {
          const item = document.createElement('li');
          item.textContent = code.indexOf('LESSON:') === 0 ? 'ยังเรียนไม่ครบบางบท' : code.indexOf('ACTIVITY:') === 0 ?
            'ยังส่งกิจกรรมบังคับไม่ครบ' : code.indexOf('UNIT_POSTTEST:') === 0 ? 'Post-test หน่วย ' + code.split(':')[1] + ' ยังไม่ผ่าน 70%' :
            labels[code] || 'ยังมีเงื่อนไขที่ไม่ครบ';
          list.appendChild(item);
        });
      }
    } catch (error) { status.textContent = error.message; }
  }());
}());
