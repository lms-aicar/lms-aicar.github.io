(function () {
  const list = document.querySelector('#course-list'); const status = document.querySelector('#catalog-status');
  function addCourse(course) {
    const card = document.createElement('article'); card.className = 'account-panel';
    const title = document.createElement('h2'); title.textContent = course.title;
    const description = document.createElement('p'); description.textContent = course.description || 'ไม่มีคำอธิบายรายวิชา'; card.append(title, description);
    if (sessionStorage.getItem('lms_session_token')) {
      const enroll = document.createElement('button'); enroll.type = 'button'; enroll.className = 'primary-button'; enroll.textContent = 'ลงทะเบียนเรียน';
      enroll.addEventListener('click', async function () { enroll.disabled = true; try { await window.LMS_API.call('COURSE_SELF_ENROLL', { courseId: course.courseId }, true); enroll.textContent = 'ลงทะเบียนแล้ว'; } catch (error) { status.textContent = error.message; enroll.disabled = false; } }); card.appendChild(enroll);
    }
    list.appendChild(card);
  }
  async function load() { try { const result = await window.LMS_API.call('PUBLIC_COURSE_LIST'); result.courses.forEach(addCourse); status.textContent = result.courses.length ? '' : 'ยังไม่มีรายวิชาที่เปิดลงทะเบียน'; } catch (error) { status.textContent = error.message; } }
  load();
}());
