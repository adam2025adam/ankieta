(async function () {
  const API_URL = 'https://ankieta-u691.onrender.com';

  // Wczytaj styl CSS
  const style = document.createElement('link');
  style.rel = 'stylesheet';
  style.href = `${API_URL}/widget.css`;
  document.head.appendChild(style);

  

  // Pobierz ankietę
  const res = await fetch(`${API_URL}/ankieta`);
  const { questions, title } = await res.json();

  const container = document.createElement('div');
  container.className = 'survey-widget';
  document.body.appendChild(container);

  const closeBtn = document.createElement('div');
closeBtn.innerHTML = '&times;';
closeBtn.className = 'survey-close-btn';
closeBtn.onclick = () => container.remove();
container.appendChild(closeBtn);


  let currentQuestionId = questions[0].id;
  const answers = {};

  function showQuestion(questionId) {
    const question = questions.find(q => q.id === questionId);
    if (!question) return;

    container.innerHTML = '';
    container.appendChild(closeBtn); // <-- DODAJ TO

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
let userId = null;

  async function handleAnswer(questionId, value, nextId = null) {
    const payload = { questionId, value };
    if (userId) {
      payload.userId = userId;
    }
    
    const response = await fetch(`${API_URL}/odpowiedz`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  
    const result = await response.json();
  
    if (!userId && result.userId) {
      userId = result.userId; // zapamiętaj nowe ID
    }
  
    if (nextId) {
      showQuestion(nextId);
    } else {
      container.innerHTML = '<p style="color: green; font-weight: bold;">Dziękujemy za wypełnienie ankiety!</p>';
      container.appendChild(closeBtn);
    }
  }
  
  

  showQuestion(currentQuestionId);
})();
