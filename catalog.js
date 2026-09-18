(function () {
  const list = document.querySelector('#course-list'); const status = document.querySelector('#catalog-status'); const search = document.querySelector('#course-search'); const clear = document.querySelector('#clear-search'); const count = document.querySelector('#course-count'); let courses = [];
  function createCard(course, index) {
    const card = document.createElement('article'); card.className = 'course-card'; card.style.setProperty('--delay', String(index * 60) + 'ms');
    const label = document.createElement('p'); label.className = 'course-card__label'; label.textContent = 'OPEN / SELF-PACED';
    const title = document.createElement('h3'); title.textContent = course.title;
    const description = document.createElement('p'); description.className = 'course-card__description'; description.textContent = course.description || 'เริ่มต้นเส้นทางการเรียนรู้ด้วยการลงมือทำ';
    const footer = document.createElement('div'); footer.className = 'course-card__footer';
    if (sessionStorage.getItem('lms_session_token')) {
      const enroll = document.createElement('button'); enroll.type = 'button'; enroll.className = 'primary-button'; enroll.innerHTML = '<span>ลงทะเบียนเรียน</span><b aria-hidden="true">→</b>';
      enroll.addEventListener('click', async function () { enroll.disabled = true; try { await window.LMS_API.call('COURSE_SELF_ENROLL', { courseId: course.courseId }, true); enroll.textContent = 'ลงทะเบียนแล้ว'; enroll.classList.add('is-complete'); } catch (error) { status.textContent = error.message; enroll.disabled = false; } }); footer.appendChild(enroll);
    } else { const prompt = document.createElement('a'); prompt.href = 'index.html'; prompt.className = 'secondary-button'; prompt.textContent = 'เข้าสู่ระบบเพื่อเริ่มเรียน'; footer.appendChild(prompt); }
    card.append(label, title, description, footer); return card;
  }
  function render() { const query = search.value.trim().toLowerCase(); const visible = courses.filter(function(course) { return !query || (course.title + ' ' + course.description).toLowerCase().indexOf(query) !== -1; }); list.replaceChildren(); visible.forEach(function(course, index) { list.appendChild(createCard(course, index)); }); count.textContent = visible.length + ' รายวิชา'; clear.hidden = !query; status.textContent = visible.length ? '' : 'ไม่พบรายวิชาที่ตรงกับคำค้น'; }
  search.addEventListener('input', render); clear.addEventListener('click', function() { search.value = ''; search.focus(); render(); });
  (async function load() { try { const result = await window.LMS_API.call('PUBLIC_COURSE_LIST'); courses = result.courses; render(); } catch (error) { status.textContent = error.message; } }());
}());
