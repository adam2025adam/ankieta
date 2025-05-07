const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000; // <-- TO MUSI BYĆ TAK

app.use(cors());
app.use(bodyParser.json());

// Udostępnij pliki statyczne z katalogu "public"
app.use(express.static('public'));

// === ENDPOINT: GET /ankieta ===
app.get('/ankieta', (req, res) => {
  const ankieta = {
    title: "Ankieta o stronie",
    questions: [
      {
        id: "ocena",
        text: "Jak oceniasz naszą stronę?",
        type: "scale"
      },
      {
        id: "polecenie",
        text: "Czy poleciłbyś nas znajomym?",
        type: "yesno"
      }
    ]
  };
  res.json(ankieta);
});

// === ENDPOINT: POST /odpowiedzi ===
app.post('/odpowiedzi', (req, res) => {
  const odpowiedz = req.body;
  const filePath = path.join(__dirname, 'odpowiedzi.json');

  let odpowiedzi = [];
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf-8');
    odpowiedzi = JSON.parse(content);
  }

  odpowiedzi.push({ ...odpowiedz, timestamp: new Date().toISOString() });
  fs.writeFileSync(filePath, JSON.stringify(odpowiedzi, null, 2));

  res.json({ success: true });
});

// === ENDPOINT: GET /wyniki ===
app.get('/wyniki', (req, res) => {
  const filePath = path.join(__dirname, 'odpowiedzi.json');
  if (!fs.existsSync(filePath)) {
    return res.send('<h2>Brak odpowiedzi</h2>');
  }

  const content = fs.readFileSync(filePath, 'utf-8');
  const odpowiedzi = JSON.parse(content);

  let html = `<h2>Zebrane odpowiedzi (${odpowiedzi.length})</h2><table border="1" cellpadding="5"><thead><tr>`;
  const keys = Object.keys(odpowiedzi[0]);
  keys.forEach(k => html += `<th>${k}</th>`);
  html += `</tr></thead><tbody>`;

  odpowiedzi.forEach(row => {
    html += `<tr>`;
    keys.forEach(k => html += `<td>${row[k]}</td>`);
    html += `</tr>`;
  });

  html += `</tbody></table>`;
  res.send(html);
});

// === Start serwera ===
app.listen(PORT, () => {
  console.log(`Serwer działa na porcie ${PORT}`);
});
