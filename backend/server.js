// ======================== Importy ========================
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// ======================== Konfiguracja aplikacji ========================
const app = express();
const PORT = 5000;
const SECRET_KEY = 'Tymczasowy_Klucz';

// ======================== Konfiguracja bazy danych ========================
const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'kantornbp',
    password: 'postgres',
    port: 5432,
});

// ======================== Middleware ========================
app.use(cors());
app.use(express.json());

// ======================== Endpointy użytkownika ========================

// Dodawanie i usuwanie ulubionych walut
app.post('/api/favorites', async (req, res) => {
    const { userId, currencyId } = req.body;

    try {
        const client = await pool.connect();
        try {
            const checkQuery = `
                SELECT 1 FROM favorites WHERE user_id = $1 AND currency_id = $2
            `;
            const checkResult = await client.query(checkQuery, [userId, currencyId]);

            if (checkResult.rowCount > 0) {
                const deleteQuery = `
                    DELETE FROM favorites WHERE user_id = $1 AND currency_id = $2
                `;
                await client.query(deleteQuery, [userId, currencyId]);
                res.json({ message: 'Usunięto z ulubionych' });
            } else {
                const insertQuery = `
                    INSERT INTO favorites (user_id, currency_id) VALUES ($1, $2)
                `;
                await client.query(insertQuery, [userId, currencyId]);
                res.json({ message: 'Dodano do ulubionych' });
            }
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Błąd zarządzania ulubionymi:', error.message);
        res.status(500).json({ error: 'Wewnętrzny błąd serwera' });
    }
});

// Pobieranie ulubionych walut użytkownika
app.get('/api/favorites/:userId', async (req, res) => {
    const { userId } = req.params;

    try {
        const client = await pool.connect();
        try {
            const query = `
                SELECT currency_id FROM favorites WHERE user_id = $1
            `;
            const result = await client.query(query, [userId]);
            res.json(result.rows.map(row => row.currency_id));
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Błąd pobierania ulubionych:', error.message);
        res.status(500).json({ error: 'Wewnętrzny błąd serwera' });
    }
});

// ======================== Endpointy kursów walut ========================

// Pobieranie historii kursów walut
app.get('/api/history', async (req, res) => {
    const { code, startDate, endDate } = req.query;

    try {
        const client = await pool.connect();
        try {
            const query = `
                SELECT er.date, er.mid
                FROM exchange_rates er
                JOIN currencies c ON er.currency_id = c.id
                WHERE c.code = $1 AND er.date BETWEEN $2 AND $3
                ORDER BY er.date ASC
            `;
            const result = await client.query(query, [code, startDate, endDate]);
            res.json(result.rows);
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Błąd pobierania historii:', error.message);
        res.status(500).json({ error: 'Nie udało się pobrać historii.' });
    }
});

// Pobieranie listy dostępnych kodów walut
app.get('/api/currencies', async (req, res) => {
    try {
        const client = await pool.connect();
        try {
            const query = `
                SELECT code FROM currencies ORDER BY code ASC
            `;
            const result = await client.query(query);
            res.json(result.rows.map(row => row.code));
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Błąd pobierania kodów walut:', error.message);
        res.status(500).json({ error: 'Nie udało się pobrać kodów walut.' });
    }
});

// Pobieranie najnowszych kursów walut
app.get('/api/exchange-rates', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                er.id AS rate_id, 
                c.name AS currency, 
                c.code AS code, 
                er.mid AS mid, 
                er.date AS date
            FROM exchange_rates er
            JOIN currencies c ON er.currency_id = c.id
            WHERE er.date = (SELECT MAX(date) FROM exchange_rates)
        `);
        res.json(result.rows);
    } catch (error) {
        console.error('Błąd pobierania kursów walut:', error.message);
        res.status(500).json({ error: 'Nie udało się pobrać kursów walut.' });
    }
});

// ======================== Endpointy autoryzacji ========================

// Logowanie użytkownika
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const client = await pool.connect();
        const userQuery = `
            SELECT id, username, email, password_hash, salt
            FROM users
            WHERE email = $1
        `;
        const userResult = await client.query(userQuery, [email]);

        if (userResult.rowCount === 0) {
            return res.status(401).json({ error: 'Nieprawidłowy email lub hasło' });
        }

        const user = userResult.rows[0];
        const hashedPassword = bcrypt.hashSync(password, user.salt);

        if (hashedPassword !== user.password_hash) {
            return res.status(401).json({ error: 'Nieprawidłowy email lub hasło' });
        }

        const updateLoginTimeQuery = `
            UPDATE users
            SET last_login = NOW()
            WHERE id = $1
        `;
        await client.query(updateLoginTimeQuery, [user.id]);

        const token = jwt.sign(
            { id: user.id, username: user.username, email: user.email },
            SECRET_KEY,
            { expiresIn: '1h' }
        );

        res.json({
            id: user.id,
            username: user.username,
            email: user.email,
            token,
        });
    } catch (error) {
        console.error('Błąd logowania:', error.message);
        res.status(500).json({ error: 'Wewnętrzny błąd serwera' });
    }
});

// Rejestracja użytkownika
app.post('/api/register', async (req, res) => {
    const { username, email, password } = req.body;

    try {
        const client = await pool.connect();
        const userExistsQuery = `
            SELECT 1 FROM users WHERE email = $1
        `;
        const userExistsResult = await client.query(userExistsQuery, [email]);

        if (userExistsResult.rowCount > 0) {
            return res.status(400).json({ error: 'Użytkownik z tym adresem email już istnieje.' });
        }

        const salt = bcrypt.genSaltSync(10);
        const passwordHash = bcrypt.hashSync(password, salt);

        const insertUserQuery = `
            INSERT INTO users (username, email, password_hash, salt, created_at)
            VALUES ($1, $2, $3, $4, NOW())
        `;
        await client.query(insertUserQuery, [username, email, passwordHash, salt]);

        res.status(201).json({ message: 'Użytkownik został zarejestrowany.' });
    } catch (error) {
        console.error('Błąd rejestracji:', error.message);
        res.status(500).json({ error: 'Wewnętrzny błąd serwera' });
    }
});

// ======================== Aktualizacja kursów walut ========================

// Funkcja aktualizująca kursy walut
const updateExchangeRates = async () => {
    try {
        const [tableA, tableB] = await Promise.all([
            axios.get('https://api.nbp.pl/api/exchangerates/tables/A/?format=json'),
            axios.get('https://api.nbp.pl/api/exchangerates/tables/B/?format=json'),
        ]);

        const combinedData = [...tableA.data[0].rates, ...tableB.data[0].rates];
        const effectiveDate = tableA.data[0].effectiveDate;

        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            const dateExistsQuery = `
                SELECT 1 FROM exchange_rates WHERE date = $1 LIMIT 1
            `;
            const dateExistsResult = await client.query(dateExistsQuery, [effectiveDate]);

            if (dateExistsResult.rowCount > 0) {
                console.log(`Data ${effectiveDate} już istnieje w bazie danych. Pomijanie aktualizacji.`);
            } else {
                const insertCurrencyQuery = `
                    INSERT INTO currencies (name, code)
                    VALUES ($1, $2)
                    ON CONFLICT (code) DO NOTHING
                `;

                for (const rate of combinedData) {
                    await client.query(insertCurrencyQuery, [rate.currency, rate.code]);
                }

                const insertExchangeRateQuery = `
                    INSERT INTO exchange_rates (currency_id, mid, date)
                    VALUES (
                        (SELECT id FROM currencies WHERE code = $1),
                        $2,
                        $3
                    )
                    ON CONFLICT (currency_id, date) DO NOTHING
                `;

                for (const rate of combinedData) {
                    await client.query(insertExchangeRateQuery, [rate.code, rate.mid, effectiveDate]);
                }

                console.log(`Data ${effectiveDate} została dodana do bazy danych.`);
            }

            await client.query('COMMIT');
        } catch (error) {
            await client.query('ROLLBACK');
            console.error('Błąd podczas aktualizacji danych w bazie:', error.message);
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Błąd podczas pobierania danych z API NBP:', error.message);
    }
};

// Endpoint do ręcznego uruchamiania aktualizacji danych
app.get('/api/update-exchange-rates', async (req, res) => {
    try {
        await updateExchangeRates();
        res.json({ message: 'Dane zostały zaktualizowane.' });
    } catch (error) {
        res.status(500).json({ error: 'Nie udało się zaktualizować danych.' });
    }
});

// ======================== Uruchamianie serwera ========================
app.listen(PORT, async () => {
    console.log(`Serwer działa na porcie http://localhost:${PORT}`);
    await updateExchangeRates();
});