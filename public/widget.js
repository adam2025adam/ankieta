(async function () {
    const API_URL = 'https://ankieta-u691.onrender.com';

  
    // Pobierz pytania
    const res = await fetch(`${API_URL}/ankieta`);
    const data = await res.json();
  
    // === Kontener ===
    const container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.bottom = '20px';
    container.style.right = '20px';
    container.style.width = '300px';
    container.style.boxShadow = '0 0 10px rgba(0,0,0,0.2)';
    container.style.borderRadius = '8px';
    container.style.border = '1px solid #ccc';
    container.style.padding = '15px';
    container.style.backgroundColor = '#fff';
    container.style.fontFamily = 'Arial, sans-serif';
    container.style.zIndex = '9999';
  
    // === Przycisk zamykania ===
    const closeBtn = document.createElement('div');
    closeBtn.innerHTML = '&times;';
    closeBtn.style.position = 'absolute';
    closeBtn.style.top = '5px';
    closeBtn.style.right = '10px';
    closeBtn.style.cursor = 'pointer';
    closeBtn.style.fontSize = '18px';
    closeBtn.style.fontWeight = 'bold';
    closeBtn.onclick = () => container.style.display = 'none';
    container.appendChild(closeBtn);
  
    // === Tytuł ===
    const title = document.createElement('h3');
    title.innerText = data.title;
    title.style.marginTop = '0';
    container.appendChild(title);
  
    // === Formularz ===
    const form = document.createElement('form');
  
    data.questions.forEach((q) => {
      const label = document.createElement('label');
      label.innerText = q.text;
      label.style.display = 'block';
      label.style.margin = '10px 0 5px';
      form.appendChild(label);
  
      if (q.type === 'scale') {
        const select = document.createElement('select');
        select.name = q.id;
        for (let i = 1; i <= 5; i++) {
          const option = document.createElement('option');
          option.value = i;
          option.innerText = i;
          select.appendChild(option);
        }
        form.appendChild(select);
      }
  
      if (q.type === 'yesno') {
        ['Tak', 'Nie'].forEach((val) => {
          const input = document.createElement('input');
          input.type = 'radio';
          input.name = q.id;
          input.value = val.toLowerCase();
          input.required = true;
  
          const labelRadio = document.createElement('label');
          labelRadio.style.marginRight = '10px';
          labelRadio.appendChild(input);
          labelRadio.append(` ${val}`);
          form.appendChild(labelRadio);
        });
      }
    });
  
    const button = document.createElement('button');
    button.type = 'submit';
    button.innerText = 'Wyślij';
    button.style.display = 'block';
    button.style.marginTop = '15px';
    form.appendChild(button);
  
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(form);
      const odpowiedzi = {};
      for (const [key, value] of formData.entries()) {
        odpowiedzi[key] = value;
      }
  
      await fetch(`${API_URL}/odpowiedzi`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(odpowiedzi),
      });
  
      container.innerHTML = '<p style="color: green; margin: 0;">Dziękujemy za wypełnienie ankiety!</p>';
    });
  
    container.appendChild(form);
    document.body.appendChild(container);
  })();
  

