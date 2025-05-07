(async function () {
  const API_URL = 'https://ankieta-u691.onrender.com'; // Twoje publiczne API

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
    const question = ankieta.questions.find(q => q.id === questionId);
    if (!question) return;

    container.innerHTML = ''; // wyczyść

    const questionText = document.createElement('div');
    questionText.innerText = question.text;
    questionText.style.marginBottom = '12px';
    questionText.style.fontWeight = 'bold';
    container.appendChild(questionText);

    if (question.type === 'yesno') {
      question.options.forEach(opt => {
        const btn = document.createElement('button');
        btn.innerText = opt;
        btn.style.marginRight = '10px';
        btn.style.marginBottom = '10px';
        btn.onclick = () => handleAnswer(question.id, opt, question.next?.[opt]);
        container.appendChild(btn);
      });
    }

    if (question.type === 'scale') {
      const select = document.createElement('select');
      select.name = question.id;
      for (let i = 1; i <= 5; i++) {
        const option = document.createElement('option');
        option.value = i;
        option.innerText = i;
        select.appendChild(option);
      }
      const nextBtn = document.createElement('button');
      nextBtn.innerText = 'Dalej';
      nextBtn.style.marginTop = '10px';
      nextBtn.onclick = () => handleAnswer(question.id, select.value, question.next?.[select.value]);
      container.appendChild(select);
      container.appendChild(nextBtn);
    }

    if (question.type === 'text') {
      const input = document.createElement('textarea');
      input.style.width = '100%';
      input.style.height = '60px';
      input.style.marginBottom = '10px';

      const nextBtn = document.createElement('button');
      nextBtn.innerText = 'Dalej';
      nextBtn.onclick = () => handleAnswer(question.id, input.value);
      container.appendChild(input);
      container.appendChild(nextBtn);
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
