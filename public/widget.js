(async function () {
  const API_URL = 'https://ankieta-u691.onrender.com';

  // Wczytaj styl CSS
  const style = document.createElement('link');
  style.rel = 'stylesheet';
  style.href = `${API_URL}/widget.css`;
  document.head.appendChild(style);

  // Pobierz ID użytkownika
  const startRes = await fetch(`${API_URL}/start`, { method: 'POST' });
  const { userId } = await startRes.json();

  // Pobierz ankietę
  const res = await fetch(`${API_URL}/ankieta`);
  const { questions, title } = await res.json();

  const container = document.createElement('div');
  container.className = 'survey-widget';
  document.body.appendChild(container);

  let currentQuestionId = questions[0].id;
  const answers = {};

  function showQuestion(questionId) {
    const question = questions.find(q => q.id === questionId);
    if (!question) return;

    container.innerHTML = '';

    const titleEl = document.createElement('div');
    titleEl.className = 'survey-question-title';
    titleEl.innerText = question.text;
    container.appendChild(titleEl);

    if (["yesno", "options"].includes(question.type)) {
      const subtitle = document.createElement('div');
      subtitle.className = 'survey-question-subtitle';
      subtitle.innerText = 'Wybierz jedną z opcji:';
      container.appendChild(subtitle);
    }

    if (question.type === 'yesno' || question.type === 'options') {
      const wrapper = document.createElement('div');
      wrapper.className = 'survey-answer-options';
      const options = question.type === 'yesno' ? ['tak', 'nie'] : question.options;

      options.forEach(opt => {
        const btn = document.createElement('button');
        btn.innerText = opt;
        btn.onclick = () => handleAnswer(question.id, opt, question.next?.[opt]);
        wrapper.appendChild(btn);
      });

      container.appendChild(wrapper);
    }

    if (question.type === 'text') {
      const subtitle = document.createElement('div');
      subtitle.className = 'survey-question-subtitle';
      subtitle.innerText = 'Wpisz swoją odpowiedź:';
      container.appendChild(subtitle);

      const wrapper = document.createElement('div');
      wrapper.className = 'survey-answer-input';

      const textarea = document.createElement('textarea');
      textarea.placeholder = 'Wpisz tutaj...';

      const btn = document.createElement('button');
      btn.innerText = 'Dalej';
      btn.onclick = () => handleAnswer(question.id, textarea.value);

      wrapper.appendChild(textarea);
      wrapper.appendChild(btn);
      container.appendChild(wrapper);
    }
  }

  async function handleAnswer(questionId, value, nextId = null) {
    answers[questionId] = value;

    await fetch(`${API_URL}/odpowiedz`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, questionId, value }),
    });

    if (nextId) {
      showQuestion(nextId);
    } else {
      container.innerHTML = '<p style="color: green; font-weight: bold;">Dziękujemy za wypełnienie ankiety!</p>';
    }
  }

  showQuestion(currentQuestionId);
})();
