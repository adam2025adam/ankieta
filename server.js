const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(express.static('public'));
const PORT = process.env.PORT || 3000;


// Middleware
app.use(cors());
app.use(bodyParser.json());

// === GET /ankieta ===
app.get('/ankieta', (req, res) => {
  const ankieta = {
    title: "Ankieta o stronie",
    questions: [
      {
        id: "ocena",
        text: "Jak oceniasz naszą stronę?",
        type: "scale", // 1-5
      },
      {
        id: "polecenie",
        text: "Czy poleciłbyś nas znajomym?",
        type: "yesno", // tak / nie
      }
    ]
  };
  res.json(ankieta);
});

// === POST /odpowiedzi ===
app.post('/odpowiedzi', (req, res) => {
  const odpowiedz = req.body;
  const filePath = path.join(__dirname, 'odpowiedzi.json');

  // Wczytaj istniejące odpowiedzi (jeśli plik istnieje)
  let odpowiedzi = [];
  if (fs.existsSync(filePath)) {
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    odpowiedzi = JSON.parse(fileContent);
  }

  // Dodaj nową odpowiedź z timestampem
  odpowiedzi.push({ ...odpowiedz, timestamp: new Date().toISOString() });

  // Zapisz z powrotem do pliku
  fs.writeFileSync(filePath, JSON.stringify(odpowiedzi, null, 2));

  res.json({ success: true });
});

// Start serwera
app.listen(PORT, () => {
  console.log(`Serwer działa na http://localhost:${PORT}`);

  // === GET /wyniki ===
app.get('/wyniki', (req, res) => {
    const filePath = path.join(__dirname, 'odpowiedzi.json');
  
    if (!fs.existsSync(filePath)) {
      return res.send('<h2>Brak odpowiedzi</h2>');
    }
  
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const odpowiedzi = JSON.parse(fileContent);
  
    let html = `<h2>Zebrane odpowiedzi (${odpowiedzi.length})</h2><table border="1" cellpadding="5" cellspacing="0"><thead><tr>`;
  
    // Nagłówki
    const first = odpowiedzi[0];
    for (const key of Object.keys(first)) {
      html += `<th>${key}</th>`;
    }
  
    html += `</tr></thead><tbody>`;
  
    // Wiersze
    for (const row of odpowiedzi) {
      html += `<tr>`;
      for (const key of Object.keys(row)) {
        html += `<td>${row[key]}</td>`;
      }
      html += `</tr>`;
    }
  
    html += `</tbody></table>`;
    res.send(html);
  });
  
});
