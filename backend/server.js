const express = require('express');
const axios = require('axios');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
const PORT = 5000;

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'kantornbp',
    password: 'postgres',
    port: 5432,
});

app.use(cors());
app.use(express.json());

// Funkcja do aktualizacji danych z API NBP
const updateExchangeRates = async () => {
    try {
        const [tableA, tableB] = await Promise.all([
            axios.get('https://api.nbp.pl/api/exchangerates/tables/A/?format=json'),
            axios.get('https://api.nbp.pl/api/exchangerates/tables/B/?format=json'),
        ]);

        const combinedData = [...tableA.data[0].rates, ...tableB.data[0].rates];

        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            const upsertQuery = `
                INSERT INTO exchangerates (currency, code, mid)
                VALUES ($1, $2, $3)
                ON CONFLICT (code) 
                DO UPDATE SET mid = EXCLUDED.mid
            `;

            for (const rate of combinedData) {
                await client.query(upsertQuery, [
                    rate.currency,
                    rate.code,
                    rate.mid,
                ]);
            }

            await client.query('COMMIT');
            console.log('Dane zostały zaktualizowane w bazie danych.');
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

// Endpoint do pobierania danych z bazy danych i wysyłania ich do frontendu
app.get('/api/exchange-rates', async (req, res) => {
    try {
        const result = await pool.query('SELECT currency, code, mid FROM exchangerates');
        res.json(result.rows);
    } catch (error) {
        console.error('Błąd podczas pobierania danych z bazy:', error.message);
        res.status(500).json({ error: 'Nie udało się pobrać danych z bazy.' });
    }
});

// Uruchamianie serwera i automatyczna aktualizacja danych
app.listen(PORT, async () => {
    console.log(`Serwer działa na porcie http://localhost:${PORT}`);
    await updateExchangeRates();
});