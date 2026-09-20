(function () {
  const status = document.querySelector('#course-status');
  const form = document.querySelector('#course-form');
  const select = document.querySelector('#existing-course');
  const unitForm = document.querySelector('#unit-form');
  const lessonForm = document.querySelector('#lesson-form');
  const panel = document.querySelector('#authoring-panel');
  const lessonPanel = document.querySelector('#lesson-panel');
  const publish = document.querySelector('#publish-course');
  const unitList = document.querySelector('#unit-list');
  const lessonList = document.querySelector('#lesson-list');
  let courseId = '', unitId = '', courses = [], units = [];
  function call(action, payload) { return window.LMS_API.call(action, payload, true); }
  function errorMessage(error) { status.textContent = error.message; delete status.dataset.state; }
  function action(label, callback) {
    const button = document.createElement('button');
    button.type = 'button'; button.className = 'secondary-button'; button.textContent = label;
    button.addEventListener('click', async function () {
      button.disabled = true;
      try { await callback(); await loadStructure(); status.textContent = 'บันทึกแล้ว'; status.dataset.state = 'success'; }
      catch (error) { errorMessage(error); button.disabled = false; }
    });
    return button;
  }
  function chooseUnit(id) {
    unitId = id;
    const unit = units.find(item => item.unitId === id);
    lessonPanel.hidden = !unit;
    document.querySelector('#selected-unit').textContent = unit ? unit.title : '';
    lessonList.replaceChildren();
    if (!unit) return;
    unit.lessons.forEach(function (lesson) {
      const row = document.createElement('p');
      const label = document.createElement('span');
      label.textContent = lesson.title + ' · ' + lesson.status + ' ';
      row.appendChild(label);
      if (lesson.status !== 'PUBLISHED') row.appendChild(action('เผยแพร่บทเรียน', () =>
        call('LESSON_SET_STATUS', { lessonId: lesson.lessonId, status: 'PUBLISHED' })));
      lessonList.appendChild(row);
    });
  }
  async function loadStructure() {
    const result = await call('COURSE_EDITOR_STRUCTURE', {});
    units = result.units.filter(unit => unit.courseId === courseId);
    unitList.replaceChildren();
    units.forEach(function (unit) {
      const row = document.createElement('p');
      row.appendChild(action(unit.title + ' · ' + unit.status + ' — เลือก', async () => { chooseUnit(unit.unitId); }));
      if (unit.status !== 'PUBLISHED') row.appendChild(action('เผยแพร่หน่วย', () =>
        call('UNIT_SET_STATUS', { unitId: unit.unitId, status: 'PUBLISHED' })));
      unitList.appendChild(row);
    });
    if (unitId && !units.some(unit => unit.unitId === unitId)) unitId = '';
    chooseUnit(unitId);
  }
  async function chooseCourse(id) {
    courseId = id; unitId = '';
    const course = courses.find(item => item.courseId === id);
    panel.hidden = !course; form.hidden = Boolean(course);
    if (!course) return;
    document.querySelector('#draft-title').textContent = course.title;
    publish.hidden = course.status === 'PUBLISHED';
    await loadStructure();
  }
  async function loadCourses() {
    const result = await call('COURSE_EDITOR_COURSES', {});
    courses = result.courses;
    select.replaceChildren();
    const empty = document.createElement('option');
    empty.value = ''; empty.textContent = 'เลือกรายวิชา'; select.appendChild(empty);
    courses.forEach(function (course) {
      const option = document.createElement('option');
      option.value = course.courseId; option.textContent = course.title; select.appendChild(option);
    });
    select.value = courseId;
  }
  select.addEventListener('change', () => { chooseCourse(select.value).catch(errorMessage); });
  form.addEventListener('submit', async function (event) {
    event.preventDefault(); if (!form.reportValidity()) return;
    const button = form.querySelector('button'); button.disabled = true;
    try {
      const values = new FormData(form);
      const result = await call('COURSE_CREATE', { title: values.get('title'), description: values.get('description'),
        courseType: values.get('courseType'), academicYear: values.get('academicYear'), semester: values.get('semester') });
      courseId = result.course.courseId;
      await loadCourses(); await chooseCourse(courseId);
      status.textContent = 'สร้างรายวิชาแบบร่างแล้ว กรุณาเพิ่มและเผยแพร่หน่วยกับบทเรียน';
    } catch (error) { errorMessage(error); } finally { button.disabled = false; }
  });
  unitForm.addEventListener('submit', async function (event) {
    event.preventDefault(); if (!unitForm.reportValidity()) return;
    const button = unitForm.querySelector('button'); button.disabled = true;
    try {
      const values = new FormData(unitForm);
      const result = await call('COURSE_CREATE_UNIT', { courseId, title: values.get('title'), sortOrder: Number(values.get('sortOrder')) });
      unitId = result.unitId; unitForm.reset(); await loadStructure();
      status.textContent = 'เพิ่มหน่วยแล้ว กรุณากดเผยแพร่หน่วย';
    } catch (error) { errorMessage(error); } finally { button.disabled = false; }
  });
  lessonForm.addEventListener('submit', async function (event) {
    event.preventDefault(); if (!lessonForm.reportValidity()) return;
    const button = lessonForm.querySelector('button'); button.disabled = true;
    try {
      const values = new FormData(lessonForm);
      await call('COURSE_CREATE_LESSON', { unitId, title: values.get('title'), contentUrl: values.get('contentUrl'), sortOrder: Number(values.get('sortOrder')) });
      lessonForm.reset(); await loadStructure();
      status.textContent = 'เพิ่มบทเรียนแล้ว กรุณากดเผยแพร่บทเรียน';
    } catch (error) { errorMessage(error); } finally { button.disabled = false; }
  });
  publish.addEventListener('click', async function () {
    if (!units.some(unit => unit.status === 'PUBLISHED' && unit.lessons.some(lesson => lesson.status === 'PUBLISHED'))) {
      status.textContent = 'กรุณาเผยแพร่อย่างน้อยหนึ่งหน่วยและหนึ่งบทเรียนก่อนเผยแพร่รายวิชา'; return;
    }
    publish.disabled = true;
    try { await call('COURSE_PUBLISH', { courseId }); await loadCourses(); await chooseCourse(courseId); status.textContent = 'เผยแพร่รายวิชาแล้ว'; }
    catch (error) { errorMessage(error); publish.disabled = false; }
  });
  (async function () {
    if (!sessionStorage.getItem('lms_session_token')) return window.location.replace('index.html');
    try {
      const me = await call('ME', {});
      if (me.permissions.indexOf('courses.create') === -1) return window.location.replace('dashboard.html');
      await loadCourses();
    } catch (error) { errorMessage(error); }
  }());
}());
