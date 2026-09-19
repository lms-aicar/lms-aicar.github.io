(function () {
  const status = document.querySelector('#status'); const list = document.querySelector('#skills');
  const labels = { NOT_STARTED: 'ยังไม่เริ่ม', DEVELOPING: 'กำลังพัฒนา', PROFICIENT: 'ผ่านเกณฑ์', MASTERED: 'ชำนาญ' };
  (async function () {
    try {
      const data = await LMS_API.call('MY_K230_SKILL_PASSPORT', {}, true);
      data.skills.forEach(function (skill) {
        const card = document.createElement('article'); card.className = 'course-card';
        const title = document.createElement('h2'); title.textContent = skill.name;
        const state = document.createElement('p'); state.textContent = (labels[skill.state] || skill.state) + ' · คะแนนหลักฐาน ' + skill.masteryScore + '%';
        const evidence = document.createElement('ul');
        skill.evidence.forEach(function (item) { const li = document.createElement('li'); li.textContent = (item.met ? '✓ ' : '○ ') + item.label; evidence.append(li); });
        card.append(title, state, evidence); list.append(card);
      });
      const badges = await LMS_API.call('SYNC_MY_K230_BADGES', {}, true);
      const badgeList = document.querySelector('#badges');
      badges.badges.forEach(function (badge) { const card = document.createElement('article'); card.className = 'course-card';
        const title = document.createElement('h3'); title.textContent = badge.name;
        const detail = document.createElement('p'); detail.textContent = (badge.earned ? 'ได้รับแล้ว · ' : 'ยังไม่ได้รับ · ') + badge.description;
        card.append(title, detail); badgeList.append(card); });
    } catch (error) { status.textContent = error.message; }
  }());
}());
