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
    title: "Krótka ankieta",
    questions: [
      {
        id: "A",
        text: "Jak oceniasz naszą usługę?",
        type: "yesno",
        options: ["1", "2"],
        next: {
          "1": "B",
          "2": "C"
        }
      },
      {
        id: "B",
        text: "Dlaczego wybrałeś odpowiedź 1?",
        type: "text"
      },
      {
        id: "C",
        text: "Dlaczego wybrałeś odpowiedź 2?",
        type: "text"
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

  let html = `<h2>Zebrane odpowiedzi (${odpowiedzi.length})</h2><table border="1" cellpadding="5"><thead><tr>
    <th>questionId</th><th>value</th><th>timestamp</th></tr></thead><tbody>`;

  odpowiedzi.forEach(row => {
    html += `<tr><td>${row.questionId}</td><td>${row.value}</td><td>${row.timestamp}</td></tr>`;
  });

  html += `</tbody></table>`;
  res.send(html);
});

// === Start serwera ===
app.listen(PORT, () => {
  console.log(`Serwer działa na porcie ${PORT}`);
});
