(function () {
  const descriptions = {
    ai: 'AI คือแนวคิดกว้างที่สุด: ระบบคอมพิวเตอร์ทำงานที่ต้องอาศัยการรับรู้ การวิเคราะห์ หรือการตัดสินใจ',
    ml: 'Machine Learning เป็นส่วนหนึ่งของ AI: ระบบเรียนรู้รูปแบบจากข้อมูล แทนการเขียนกฎทุกข้อด้วยมือ',
    dl: 'Deep Learning เป็นส่วนหนึ่งของ Machine Learning: ใช้โครงข่ายประสาทเทียมหลายชั้นเรียนรู้ลักษณะของข้อมูล'
  };
  const labels = { ai: 'AI', ml: 'Machine Learning', dl: 'Deep Learning' };
  let order = ['dl', 'ai', 'ml'];
  const explanation = document.querySelector('#concept-explanation');
  const list = document.querySelector('#concept-order');
  const feedback = document.querySelector('#concept-feedback');
  function select(concept) {
    explanation.textContent = descriptions[concept];
    document.querySelectorAll('[data-concept]').forEach(function (button) {
      button.setAttribute('aria-pressed', String(button.dataset.concept === concept));
    });
    document.querySelectorAll('.concept-ring').forEach(function (ring) {
      ring.classList.toggle('active', ring.dataset.level === concept);
    });
  }
  function render() {
    list.replaceChildren();
    order.forEach(function (concept, index) {
      const row = document.createElement('li');
      row.append(document.createTextNode(labels[concept]));
      [-1, 1].forEach(function (direction) {
        const button = document.createElement('button');
        button.type = 'button';
        button.textContent = direction < 0 ? '↑' : '↓';
        button.setAttribute('aria-label', 'เลื่อน ' + labels[concept] + (direction < 0 ? ' ขึ้น' : ' ลง'));
        button.disabled = index + direction < 0 || index + direction >= order.length;
        button.addEventListener('click', function () {
          const next = order.slice();
          [next[index], next[index + direction]] = [next[index + direction], next[index]];
          order = next;
          feedback.textContent = '';
          render();
          list.querySelectorAll('li')[index + direction].querySelector(direction < 0 ? 'button:first-of-type' : 'button:last-of-type').focus();
        });
        row.append(button);
      });
      list.append(row);
    });
  }
  document.querySelectorAll('[data-concept]').forEach(function (button) {
    button.addEventListener('click', function () { select(button.dataset.concept); });
  });
  document.querySelector('#check-order').addEventListener('click', function () {
    feedback.textContent = order.join(',') === 'ai,ml,dl' ? 'ถูกต้อง: AI → Machine Learning → Deep Learning' : 'ยังไม่ถูกต้อง ลองดูว่าวงใดครอบคลุมวงอื่น แล้วเรียงใหม่';
  });
  select('ai'); render();
}());
