(function () {
  const form = document.querySelector('#form');
  const course = document.querySelector('#course');
  const status = document.querySelector('#status');
  const rows = document.querySelector('#rows');
  const type = document.querySelector('#question-type');
  function syncAnswerFields() {
    document.querySelector('#single-answer').hidden = type.value !== 'SINGLE_CHOICE';
    document.querySelector('#multi-answer').hidden = type.value !== 'MULTIPLE_SELECT';
  }
  async function load() {
    rows.replaceChildren();
    try {
      const data = await LMS_API.call('QUESTION_LIST', { courseId: course.value }, true);
      data.questions.forEach(function (question) {
        const tr = document.createElement('tr');
        const prompt = document.createElement('td');
        const state = document.createElement('td');
        const action = document.createElement('td');
        prompt.textContent = question.prompt;
        state.textContent = question.status;
        if (question.status === 'ACTIVE') {
          const button = document.createElement('button');
          button.className = 'table-action'; button.textContent = 'ปิดใช้งาน';
          button.addEventListener('click', async function () {
            try { await LMS_API.call('QUESTION_DEACTIVATE', { questionId: question.questionId }, true); load(); }
            catch (error) { status.textContent = error.message; }
          });
          action.appendChild(button);
        }
        tr.append(prompt, state, action); rows.appendChild(tr);
      });
    } catch (error) { status.textContent = error.message; }
  }
  (async function () {
    try {
      const data = await LMS_API.call('COURSE_EDITOR_COURSES', {}, true);
      data.courses.forEach(function (item) {
        const option = document.createElement('option');
        option.value = item.courseId; option.textContent = item.title; course.appendChild(option);
      });
      if (course.value) load();
    } catch (error) { status.textContent = error.message; }
  }());
  course.addEventListener('change', load);
  type.addEventListener('change', syncAnswerFields);
  form.addEventListener('submit', async function (event) {
    event.preventDefault();
    const values = new FormData(form);
    const choices = [values.get('choice0'), values.get('choice1'), values.get('choice2'), values.get('choice3')].filter(Boolean);
    const answerIndex = Number(values.get('answerIndex'));
    const answerIndexes = values.getAll('answerIndexes').map(Number);
    if (type.value === 'SINGLE_CHOICE' && answerIndex >= choices.length ||
        type.value === 'MULTIPLE_SELECT' && (answerIndexes.length < 2 || answerIndexes.some(function (index) { return index >= choices.length; }))) {
      status.textContent = 'ตรวจคำตอบที่ถูกต้องให้ตรงกับตัวเลือกที่กรอก'; return;
    }
    try {
      await LMS_API.call('QUESTION_CREATE', { courseId: course.value, unitNumber: values.get('unitNumber'),
        questionType: type.value, prompt: values.get('prompt'), choices: choices, answerIndex: answerIndex,
        answerIndexes: answerIndexes }, true);
      status.textContent = 'บันทึกคำถามแล้ว'; status.dataset.state = 'success';
      form.reset(); syncAnswerFields(); load();
    } catch (error) { status.textContent = error.message; }
  });
}());
