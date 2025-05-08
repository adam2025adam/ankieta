const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// === PostgreSQL połączenie ===
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

// === Tworzenie tabeli przy starcie ===
const initDB = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS odpowiedzi (
      id SERIAL PRIMARY KEY,
      A TEXT, B TEXT, C TEXT, D TEXT, E TEXT,
      F TEXT, G TEXT, H TEXT, I TEXT, J TEXT
    )
  `);
};
initDB();


// Udostępnij pliki statyczne z katalogu "public"
app.use(express.static('public'));


app.post('/start', async (req, res) => {
  const result = await pool.query('INSERT INTO odpowiedzi DEFAULT VALUES RETURNING id');
  const userId = result.rows[0].id;
  res.json({ userId });
});

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

app.post('/odpowiedz', async (req, res) => {
  const { userId, questionId, value } = req.body;
  if (!userId || !questionId || !value) {
    return res.status(400).json({ error: 'Brakuje userId, questionId lub value' });
  }

  const query = {
    text: `UPDATE odpowiedzi SET "${questionId}" = $1 WHERE id = $2`,
    values: [value, userId],
  };

  await pool.query(query);
  res.json({ success: true });
});

app.get('/wyniki', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM odpowiedzi ORDER BY id DESC');
    const rows = result.rows;

    if (rows.length === 0) {
      return res.send('<h2>Brak odpowiedzi w bazie</h2>');
    }

    let html = `<h2>Zebrane odpowiedzi (${rows.length})</h2><table border="1" cellpadding="5"><thead><tr>`;
    const headers = Object.keys(rows[0]);

    headers.forEach(h => {
      html += `<th>${h}</th>`;
    });
    html += `</tr></thead><tbody>`;

    rows.forEach(row => {
      html += `<tr>`;
      headers.forEach(h => {
        html += `<td>${row[h] ?? ''}</td>`;
      });
      html += `</tr>`;
    });

    html += `</tbody></table>`;
    res.send(html);
  } catch (err) {
    console.error(err);
    res.status(500).send('<h2>Błąd podczas pobierania wyników</h2>');
  }
});


// === Start serwera ===
app.listen(PORT, () => {
  console.log(`Serwer działa na porcie ${PORT}`);
});
