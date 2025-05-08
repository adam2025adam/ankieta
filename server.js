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

const initDB = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS odpowiedzi (
      id SERIAL PRIMARY KEY,
      "A" TEXT, "B" TEXT, "C" TEXT, "D" TEXT, "E" TEXT,
      "F" TEXT, "G" TEXT, "H" TEXT, "I" TEXT, "J" TEXT
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

app.get('/ankieta', (req, res) => {
  const ankieta = {
    title: "Ankieta o udostępnianiu danych w eCRUB",
    questions: [
      {
        id: "A",
        text: "Czy widziałeś, że możesz udostępnić w eCRUB swoje dane kontaktowe?",
        type: "yesno",
        options: ["tak", "nie"],
        next: {
          "tak": "B",
          "nie": "C"
        }
      },
      {
        id: "B",
        text: "Chcesz udostępnić w eCRUB swoje dane kontaktowe (TAK)?",
        type: "options",
        options: ["tak", "już udostępniłem", "nie"],
        next: {
          "tak": "D",
          "już udostępniłem": "D",
          "nie": "E"
        }
      },
      {
        id: "C",
        text: "Chcesz udostępnić w eCRUB swoje dane kontaktowe (NIE)?",
        type: "yesno",
        options: ["tak", "nie"],
        next: {
          "tak": "D",
          "nie": "E"
        }
      },
      {
        id: "D",
        text: "Co powoduje, że chcesz udostępnić w eCRUB swoje dane kontaktowe?",
        type: "options",
        options: [
          "widzę potencjalną korzyść",
          "korzystam w eCRUB z danych kontaktowych innych",
          "inne"
        ],
        next: {
          "inne": "G"
        }
      },
      {
        id: "E",
        text: "Dlaczego nie chcesz udostępniać danych?",
        type: "options",
        options: [
          "nie uważam, żeby to było dla mnie korzystne",
          "nie rozumiem w jakim celu",
          "obawiam się o moją prywatność",
          "inne"
        ],
        next: {
          "inne": "F"
        }
      },
      {
        id: "F",
        text: "Napisz dlaczego",
        type: "text"
      },
      {
        id: "G",
        text: "Czy jest coś, co chciałbyś/chciałabyś dodać?",
        type: "text"
      }
    ]
  };

  res.json(ankieta);
});


app.post('/odpowiedz', async (req, res) => {
  const userId = req.body.userId;
const questionId = req.body.questionId?.toLowerCase();
const value = req.body.value;
  

  console.log('[ODPOWIEDŹ]', { userId, questionId, value });

  // Walidacja danych
  if (!userId || !questionId || typeof value === 'undefined') {
    console.warn('❌ BŁĄD: Brakuje userId, questionId lub value');
    return res.status(400).json({ error: 'Brakuje userId, questionId lub value' });
  }

  // Czy questionId pasuje do kolumny w bazie (A-J)?
  const allowedColumns = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j'];
  if (!allowedColumns.includes(questionId)) {
    console.warn(`❌ BŁĘDNA KOLUMNA: ${questionId}`);
    return res.status(400).json({ error: 'Nieprawidłowy questionId' });
  }

  try {
    const query = {
      text: `UPDATE odpowiedzi SET "${questionId}" = $1 WHERE id = $2`,
      values: [value, userId],
    };

    const result = await pool.query(query);
    if (result.rowCount === 0) {
      console.warn(`⚠️ Nie znaleziono rekordu o id = ${userId}`);
    }

    res.json({ success: true });
  } catch (err) {
    console.error('❌ Błąd zapisu do bazy:', err);
    res.status(500).json({ error: 'Błąd zapisu' });
  }
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
app.get('/debug', async (req, res) => {
  try {
    const result = await pool.query(`SELECT column_name FROM information_schema.columns WHERE table_name = 'odpowiedzi'`);
    res.json(result.rows);
  } catch (err) {
    console.error('Błąd debugowania:', err);
    res.status(500).send('Błąd połączenia z bazą lub brak tabeli');
  }
});


// === Start serwera ===
app.listen(PORT, () => {
  console.log(`Serwer działa na porcie ${PORT}`);
});
