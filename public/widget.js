(async function () {
  const API_URL = 'https://ankieta-u691.onrender.com'; // Twoje publiczne API

  const style = document.createElement('link');
style.rel = 'stylesheet';
style.href = 'https://ankieta-u691.onrender.com/widget.css';
document.head.appendChild(style);

  
  const res = await fetch(`${API_URL}/ankieta`);
  const ankieta = await res.json();

  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.bottom = '20px';
  container.style.right = '20px';
  container.style.width = '320px';
  container.style.padding = '20px';
  container.style.backgroundColor = '#fff';
  container.style.boxShadow = '0 4px 10px rgba(0,0,0,0.15)';
  container.style.borderRadius = '12px';
  container.style.fontFamily = 'Arial, sans-serif';
  container.style.zIndex = '9999';

  document.body.appendChild(container);

  const answers = {};
  let currentQuestionId = ankieta.questions[0].id;

  function showQuestion(questionId) {
    container.className = 'survey-widget';
container.innerHTML = ''; // czyść wszystko

const title = document.createElement('div');
title.className = 'survey-question-title';
title.innerText = question.text;
container.appendChild(title);

// jeśli chcesz podtytuły – np. sztywno dodamy dla yesno i text
if (question.type === 'yesno' || question.type === 'text') {
  const subtitle = document.createElement('div');
  subtitle.className = 'survey-question-subtitle';
  subtitle.innerText = 'Wybierz jedną z odpowiedzi:';
  if (question.type === 'text') subtitle.innerText = 'Wpisz swoją odpowiedź:';
  container.appendChild(subtitle);
}

if (question.type === 'yesno') {
  const optionsWrapper = document.createElement('div');
  optionsWrapper.className = 'survey-answer-options';

  question.options.forEach(opt => {
    const btn = document.createElement('button');
    btn.innerText = opt;
    btn.onclick = () => handleAnswer(question.id, opt, question.next?.[opt]);
    optionsWrapper.appendChild(btn);
  });

  container.appendChild(optionsWrapper);
}

if (question.type === 'text') {
  const inputWrapper = document.createElement('div');
  inputWrapper.className = 'survey-answer-input';

  const textarea = document.createElement('textarea');
  textarea.placeholder = 'Wpisz tutaj...';

  const btn = document.createElement('button');
  btn.innerText = 'Dalej';
  btn.onclick = () => handleAnswer(question.id, textarea.value);

  inputWrapper.appendChild(textarea);
  inputWrapper.appendChild(btn);
  container.appendChild(inputWrapper);
}

    }
  

  async function handleAnswer(questionId, value, nextId = null) {
    answers[questionId] = value;

    // Wyślij odpowiedź do backendu
    await fetch(`${API_URL}/odpowiedzi`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ questionId, value }),
    });

    if (nextId) {
      showQuestion(nextId);
    } else {
      container.innerHTML = '<p style="color: green; font-weight: bold;">Dziękujemy za wypełnienie ankiety!</p>';
    }
  }

  showQuestion(currentQuestionId);
})();
