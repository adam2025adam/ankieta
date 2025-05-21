const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

const questionLabels = {
  A: "Czy posiadasz uprawnienia budowlane dupa?",
  B: "Czy widziałeś, że możesz udostępnić w eCRUB swoje dane kontaktowe?",
  C: "Czy chcesz, aby Twoje dane kontaktowe były widoczne w eCRUB? (TAK)?",
  D: "Czy mimo to, chcesz udostępnić w eCRUB swoje dane kontaktowe? (NIE)?",
  E: "Co skłoniło Cię do udostępnienia swoich danych kontaktowych w eCRUB?",
  F: "Dlaczego nie chcesz udostępniać danych kontaktowych w eCRUB?",
  G: "Opisz, co zniechęca Cię do udostępnienia danych",
  H: "Czy chcesz przekazać nam coś jeszcze?",
  I: "Pytanie puste 1",
  J: "Pytanie puste 2"
};


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
  await pool.query(`DROP TABLE IF EXISTS odpowiedzi`);
  await pool.query(`
    CREATE TABLE odpowiedzi (
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
        text: "Czy posiadasz uprawnienia budowlane?",
        type: "yesno",
        options: ["tak", "nie"],
        next: {
          "tak": "B",
          "nie": null // zakończ ankietę
        }
      },
      {
        id: "B",
        text: "Czy wiesz, że możesz udostępnić w eCRUB swoje dane kontaktowe?",
        type: "yesno",
        options: ["tak", "nie"],
        next: {
          "tak": "C",
          "nie": "D"
        }
      },
      {
        id: "C",
        text: "Czy chcesz, aby Twoje dane kontaktowe były widoczne w eCRUB?",
        type: "options",
        options: ["tak", "nie", "już udostępniłem"],
        next: {
          "tak": "E",
          "nie": "F",
          "już udostępniłem": "E"
        }
      },
      {
        id: "D",
        text: "Czy mimo to, chcesz udostępnić w eCRUB swoje dane kontaktowe?",
        type: "yesno",
        options: ["tak", "nie"],
        next: {
          "tak": "E",
          "nie": "F"
        }
      },
      {
        id: "E",
        text: "Co skłoniło Cię do udostępnienia swoich danych kontaktowych w eCRUB?",
        type: "options",
        options: [
          "chcę ułatwić kontakt w sprawie mojej działalności",
          "korzystam w eCRUB z danych kontaktowych innych",
          "ciekawi mnie to rozwiązanie",
          "inne"
        ],
        next: {
          "chcę ułatwić kontakt w sprawie mojej działalności": "H",
          "korzystam w eCRUB z danych kontaktowych innych": "H",
          "ciekawi mnie to rozwiązanie": "H",
          "inne": "H"
        }
      },
      {
        id: "F",
        text: "Dlaczego nie chcesz udostępniać danych kontaktowych w eCRUB?",
        type: "options",
        options: [
          "nie widzę w tym korzyści",
          "nie rozumiem w jakim celu",
          "obawiam się o moją prywatność",
          "inne"
        ],
        next: {
          "nie widzę w tym korzyści": "G",
          "nie rozumiem w jakim celu": "G",
          "obawiam się o moją prywatność": "G",
          "inne": "G"
        }
      },
      {
        id: "G",
        text: "Opisz, co zniechęca Cię do udostępnienia danych",
        type: "text",
        next: "H"
      },
      {
        id: "H",
        text: "Czy chcesz przekazać nam coś jeszcze?",
        type: "text"
      }
    ]
  };

  res.json(ankieta);
});



app.post('/odpowiedz', async (req, res) => {
  let { userId, questionId, value } = req.body;

  console.log('[ODPOWIEDŹ]', { userId, questionId, value });

  // Walidacja danych
  if (!questionId || typeof value === 'undefined') {
    console.warn('❌ BŁĄD: Brakuje questionId lub value');
    return res.status(400).json({ error: 'Brakuje questionId lub value' });
  }

  // Kolumny dozwolone: A-J
  const allowedColumns = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
  if (!allowedColumns.includes(questionId)) {
    console.warn(`❌ BŁĘDNA KOLUMNA: ${questionId}`);
    return res.status(400).json({ error: 'Nieprawidłowy questionId' });
  }

  try {
    if (!userId) {
      // brak userId → tworzymy nowy wiersz i zapisujemy pierwszą odpowiedź
      const result = await pool.query(`
        INSERT INTO odpowiedzi("${questionId}") VALUES ($1) RETURNING id
      `, [value]);

      const newId = result.rows[0].id;
      return res.json({ success: true, userId: newId });
    }

    // userId istnieje → aktualizujemy istniejący wiersz
    const updateResult = await pool.query(
      `UPDATE odpowiedzi SET "${questionId}" = $1 WHERE id = $2`,
      [value, userId]
    );

    if (updateResult.rowCount === 0) {
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
      const label = questionLabels[h.toUpperCase()] || h;
      html += `<th>${label}</th>`;
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
