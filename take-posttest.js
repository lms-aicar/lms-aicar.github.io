(function () {
  const status = document.querySelector('#status');
  const course = document.querySelector('#course');
  const start = document.querySelector('#start');
  const go = document.querySelector('#go');
  const form = document.querySelector('#form');
  const submitButton = form.querySelector('[type="submit"]');
  const questions = document.querySelector('#questions');
  let attempt;
  (async function () {
    try {
      const data = await LMS_API.call('POSTTEST_AVAILABLE', {}, true);
      if (!data.courses.length) { status.textContent = 'ยังไม่มี Post-test ที่เปิดให้ทำ'; return; }
      data.courses.forEach(function (item) {
        const option = document.createElement('option');
        option.value = item.assessmentId;
        option.textContent = item.courseTitle + ' — ' + item.title;
        course.appendChild(option);
      });
      start.hidden = false;
    } catch (error) { status.textContent = error.message; }
  }());
  go.addEventListener('click', async function () {
    if (go.disabled || !course.value) return;
    go.disabled = true;
    status.textContent = '';
    status.removeAttribute('data-state');
    try {
      attempt = await LMS_API.call('POSTTEST_START', { assessmentId: course.value }, true);
      questions.replaceChildren();
      document.querySelector('#title').textContent = attempt.title;
      attempt.questions.forEach(function (question, index) {
        const field = document.createElement('fieldset');
        const legend = document.createElement('legend');
        legend.textContent = (index + 1) + '. ' + question.prompt;
        field.appendChild(legend);
        question.choices.forEach(function (choice, choiceIndex) {
          const label = document.createElement('label');
          const input = document.createElement('input');
          input.type = question.questionType === 'MULTIPLE_SELECT' ? 'checkbox' : 'radio';
          input.name = question.questionId; input.value = choiceIndex;
          input.required = input.type === 'radio';
          label.append(input, ' ', choice); field.appendChild(label);
        });
        questions.appendChild(field);
      });
      start.hidden = true; form.hidden = false;
      const title = document.querySelector('#title');
      title.setAttribute('tabindex', '-1');
      title.focus();
    } catch (error) { status.textContent = error.message; }
    finally { go.disabled = false; }
  });
  form.addEventListener('submit', async function (event) {
    event.preventDefault();
    if (submitButton.disabled) return;
    submitButton.disabled = true;
    status.textContent = '';
    try {
      const values = new FormData(form);
      const answers = attempt.questions.map(function (question) {
        return question.questionType === 'MULTIPLE_SELECT' ?
          { questionId: question.questionId, choiceIndexes: values.getAll(question.questionId).map(Number) } :
          { questionId: question.questionId, choiceIndex: Number(values.get(question.questionId)) };
      });
      const result = await LMS_API.call('POSTTEST_SUBMIT', { attemptId: attempt.attemptId, answers: answers }, true);
      status.textContent = 'คะแนน ' + result.score + '%'; status.dataset.state = 'success'; form.hidden = true;
    } catch (error) { status.textContent = error.message; }
    finally { submitButton.disabled = false; }
  });
}());
