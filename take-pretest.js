(function () {
  const status = document.querySelector('#test-status');
  const course = document.querySelector('#course');
  const start = document.querySelector('#start');
  const startButton = document.querySelector('#start-test');
  const form = document.querySelector('#test-form');
  const submitButton = form.querySelector('[type="submit"]');
  const questions = document.querySelector('#questions');
  let attempt;

  function call(action, data) { return window.LMS_API.call(action, data, true); }

  (async function loadAvailablePreTests() {
    try {
      const data = await call('PRETEST_AVAILABLE', {});
      if (!data.courses.length) {
        status.textContent = '\u0e22\u0e31\u0e07\u0e44\u0e21\u0e48\u0e21\u0e35 Pre-test \u0e17\u0e35\u0e48\u0e40\u0e1b\u0e34\u0e14\u0e43\u0e2b\u0e49\u0e17\u0e33 \u0e15\u0e23\u0e27\u0e08\u0e2a\u0e2d\u0e1a\u0e27\u0e48\u0e32\u0e25\u0e07\u0e17\u0e30\u0e40\u0e1a\u0e35\u0e22\u0e19\u0e23\u0e32\u0e22\u0e27\u0e34\u0e0a\u0e32\u0e41\u0e25\u0e49\u0e27 \u0e41\u0e25\u0e30\u0e04\u0e23\u0e39\u0e44\u0e14\u0e49\u0e40\u0e1b\u0e34\u0e14 Pre-test \u0e43\u0e2b\u0e49\u0e23\u0e32\u0e22\u0e27\u0e34\u0e0a\u0e32\u0e19\u0e31\u0e49\u0e19';
        return;
      }
      data.courses.forEach(function (item) {
        const option = document.createElement('option');
        option.value = item.courseId;
        option.textContent = item.title;
        course.appendChild(option);
      });
      start.hidden = false;
    } catch (error) { status.textContent = error.message; }
  }());

  startButton.addEventListener('click', async function () {
    if (!course.value) return;
    startButton.disabled = true;
    status.textContent = '';
    status.removeAttribute('data-state');
    try {
      attempt = await call('PRETEST_START', { courseId: course.value });
      document.querySelector('#test-title').textContent = attempt.title;
      questions.replaceChildren();
      attempt.questions.forEach(function (question, index) {
        const fieldset = document.createElement('fieldset');
        const legend = document.createElement('legend');
        legend.textContent = (index + 1) + '. ' + question.prompt;
        fieldset.appendChild(legend);
        question.choices.forEach(function (choice, choiceIndex) {
          const label = document.createElement('label');
          const input = document.createElement('input');
          input.type = question.questionType === 'MULTIPLE_SELECT' ? 'checkbox' : 'radio';
          input.name = question.questionId; input.value = choiceIndex;
          input.required = input.type === 'radio';
          label.append(input, ' ', choice);
          fieldset.appendChild(label);
        });
        questions.appendChild(fieldset);
      });
      start.hidden = true;
      form.hidden = false;
      document.querySelector('#test-title').setAttribute('tabindex', '-1');
      document.querySelector('#test-title').focus();
    } catch (error) { status.textContent = error.message; }
    finally { startButton.disabled = false; }
  });

  form.addEventListener('submit', async function (event) {
    event.preventDefault();
    if (submitButton.disabled) return;
    submitButton.disabled = true;
    try {
      const values = new FormData(form);
      const answers = attempt.questions.map(function (question) {
        return question.questionType === 'MULTIPLE_SELECT' ?
          { questionId: question.questionId, choiceIndexes: values.getAll(question.questionId).map(Number) } :
          { questionId: question.questionId, choiceIndex: Number(values.get(question.questionId)) };
      });
      const result = await call('PRETEST_SUBMIT', { attemptId: attempt.attemptId, answers: answers });
      status.textContent = '\u0e04\u0e30\u0e41\u0e19\u0e19 ' + result.score + '% ' + (result.passed ? '\u0e1c\u0e48\u0e32\u0e19' : '\u0e22\u0e31\u0e07\u0e44\u0e21\u0e48\u0e1c\u0e48\u0e32\u0e19');
      status.dataset.state = 'success';
      form.hidden = true;
    } catch (error) { status.textContent = error.message; }
    finally { submitButton.disabled = false; }
  });
}());
