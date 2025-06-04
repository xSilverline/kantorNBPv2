
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = 5000;
const SECRET_KEY = 'Tymczasowy_Klucz';

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'kantornbp',
    password: 'postgres',
    port: 5432,
});

app.use(cors());
app.use(express.json());



/**
 * Znajduje ostatnią środę przed lub równą podanej dacie
 * @param {string} targetDate - Data w formacie YYYY-MM-DD
 * @returns {string} Data ostatniej środy w formacie YYYY-MM-DD
 */
const getLastWednesday = (targetDate) => {
    const date = new Date(targetDate);
    const dayOfWeek = date.getDay(); // 0 = niedziela, 3 = środa
    
    let daysToSubtract;
    if (dayOfWeek >= 3) {
        // Jeśli jest środa lub później w tym tygodniu, weź środę z tego tygodnia
        daysToSubtract = dayOfWeek - 3;
    } else {
        // Jeśli jest przed środą, weź środę z poprzedniego tygodnia
        daysToSubtract = dayOfWeek + 4;
    }
    
    date.setDate(date.getDate() - daysToSubtract);
    return date.toISOString().split('T')[0];
};

/**
 * Zwraca datę poprzedniej środy (tydzień wcześniej)
 * @param {string} currentDate - Aktualna data w formacie YYYY-MM-DD
 * @returns {string} Data poprzedniej środy w formacie YYYY-MM-DD
 */
const getPreviousWednesday = (currentDate) => {
    const date = new Date(currentDate);
    date.setDate(date.getDate() - 7); // Cofnij o tydzień
    return date.toISOString().split('T')[0];
};

/**
 * Zwraca poprzedni dzień
 * @param {string} currentDate - Aktualna data w formacie YYYY-MM-DD
 * @returns {string} Poprzedni dzień w formacie YYYY-MM-DD
 */
const getPreviousDay = (currentDate) => {
    const date = new Date(currentDate);
    date.setDate(date.getDate() - 1);
    return date.toISOString().split('T')[0];
};

/**
 * Wyszukuje dostępne dane tabeli A NBP, cofając się dzień po dniu
 * @param {string} targetDate - Docelowa data w formacie YYYY-MM-DD
 * @returns {Promise<Object>} Odpowiedź z API NBP z dostępnymi danymi
 */
const findAvailableTableAData = async (targetDate) => {
    const minDate = '2002-01-02'; // Minimalna data API NBP
    let currentDate = targetDate;
    
    while (currentDate >= minDate) {
        try {
            console.log(`Sprawdzam dane tabeli A dla daty: ${currentDate}`);
            const response = await axios.get(`https://api.nbp.pl/api/exchangerates/tables/A/${currentDate}/?format=json`);
            console.log(`Znaleziono dane tabeli A dla daty: ${currentDate}`);
            return response;
        } catch (error) {
            if (error.response && error.response.status === 404) {
                console.log(`Brak danych tabeli A dla ${currentDate}, sprawdzam poprzedni dzień`);
                currentDate = getPreviousDay(currentDate);
            } else {
                throw error;
            }
        }
    }
    
    throw new Error(`Nie znaleziono danych tabeli A od daty ${targetDate} do ${minDate}`);
};

/**
 * Wyszukuje dostępne dane tabeli B NBP, cofając się środa po środzie
 * @param {string} targetDate - Docelowa data w formacie YYYY-MM-DD
 * @returns {Promise<Object>} Odpowiedź z API NBP z dostępnymi danymi
 */
const findAvailableTableBData = async (targetDate) => {
    const minDate = '2002-01-02'; // Minimalna data API NBP
    let currentDate = getLastWednesday(targetDate);
    
    while (currentDate >= minDate) {
        try {
            console.log(`Sprawdzam dane tabeli B dla daty: ${currentDate}`);
            const response = await axios.get(`https://api.nbp.pl/api/exchangerates/tables/B/${currentDate}/?format=json`);
            console.log(`Znaleziono dane tabeli B dla daty: ${currentDate}`);
            return response;
        } catch (error) {
            if (error.response && error.response.status === 404) {
                console.log(`Brak danych tabeli B dla ${currentDate}, sprawdzam poprzednią środę`);
                currentDate = getPreviousWednesday(currentDate);
            } else {
                throw error;
            }
        }
    }
    
    throw new Error(`Nie znaleziono danych tabeli B od daty ${targetDate} do ${minDate}`);
};


/**
 * Pobiera i zapisuje kursy walut dla konkretnej daty
 * @param {string} targetDate - Data dla której pobierać kursy (YYYY-MM-DD)
 */
const updateExchangeRatesForDate = async (targetDate) => {
    try {
        console.log(`Rozpoczynam aktualizację kursów dla daty: ${targetDate}`);

        try {
            await axios.get(`https://api.nbp.pl/api/exchangerates/tables/A/${targetDate}/?format=json`);
        } catch (testError) {
            if (testError.response && testError.response.status === 400) {
                throw new Error(`Data ${targetDate} jest poza zakresem dostępnych danych API NBP (błąd 400)`);
            }
        }

        let tableA;
        try {
            tableA = await axios.get(`https://api.nbp.pl/api/exchangerates/tables/A/${targetDate}/?format=json`);
            console.log(`Pobrano dane tabeli A dla daty: ${targetDate}`);
        } catch (error) {
            if (error.response && error.response.status === 404) {
                console.log(`Brak danych tabeli A dla ${targetDate}, szukam dostępnych danych`);
                tableA = await findAvailableTableAData(targetDate);
            } else {
                throw error;
            }
        }

        let tableB = null;
        try {
            tableB = await axios.get(`https://api.nbp.pl/api/exchangerates/tables/B/${targetDate}/?format=json`);
            console.log(`Pobrano dane tabeli B dla daty: ${targetDate}`);
        } catch (error) {
            if (error.response && error.response.status === 404) {
                console.log(`Brak danych tabeli B dla ${targetDate}, szukam dostępnych danych`);
                try {
                    tableB = await findAvailableTableBData(targetDate);
                } catch (findError) {
                    console.log(`Nie udało się znaleźć danych tabeli B: ${findError.message}`);
                    tableB = null;
                }
            } else {
                throw error;
            }
        }

        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            const dateExistsQuery = `SELECT 1 FROM exchange_rates WHERE date = $1 LIMIT 1`;
            const dateExistsResult = await client.query(dateExistsQuery, [targetDate]);

            if (dateExistsResult.rowCount > 0) {
                console.log(`Data ${targetDate} już istnieje w bazie danych.`);
                await client.query('ROLLBACK');
                return;
            }

            if (tableA && tableA.data && tableA.data[0]) {
                const insertCurrencyQuery = `
                    INSERT INTO currencies (name, code)
                    VALUES ($1, $2)
                    ON CONFLICT (code) DO NOTHING
                `;

                const insertExchangeRateQuery = `
                    INSERT INTO exchange_rates (currency_id, mid, date)
                    VALUES (
                        (SELECT id FROM currencies WHERE code = $1),
                        $2,
                        $3
                    )
                    ON CONFLICT (currency_id, date) DO NOTHING
                `;

                for (const rate of tableA.data[0].rates) {
                    await client.query(insertCurrencyQuery, [rate.currency, rate.code]);
                }

                for (const rate of tableA.data[0].rates) {
                    await client.query(insertExchangeRateQuery, [rate.code, rate.mid, targetDate]);
                }
                console.log(`Dodano dane tabeli A do bazy dla daty: ${targetDate}`);
            }

            if (tableB && tableB.data && tableB.data[0]) {
                const insertCurrencyQuery = `
                    INSERT INTO currencies (name, code)
                    VALUES ($1, $2)
                    ON CONFLICT (code) DO NOTHING
                `;

                const insertExchangeRateQuery = `
                    INSERT INTO exchange_rates (currency_id, mid, date)
                    VALUES (
                        (SELECT id FROM currencies WHERE code = $1),
                        $2,
                        $3
                    )
                    ON CONFLICT (currency_id, date) DO NOTHING
                `;

                for (const rate of tableB.data[0].rates) {
                    await client.query(insertCurrencyQuery, [rate.currency, rate.code]);
                }

                for (const rate of tableB.data[0].rates) {
                    await client.query(insertExchangeRateQuery, [rate.code, rate.mid, targetDate]);
                }
                console.log(`Dodano dane tabeli B do bazy dla daty: ${targetDate}`);
            }

            await client.query('COMMIT');
            console.log(`Dane dla daty ${targetDate} zostały pomyślnie dodane do bazy danych.`);
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    } catch (error) {
        console.error(`Błąd podczas pobierania danych dla daty ${targetDate}:`, error.message);
        throw error;
    }
};


const updateExchangeRates = async () => {
    try {
        console.log('Rozpoczynam pobieranie najnowszych kursów z API NBP...');

        const [tableA, tableB] = await Promise.all([
            axios.get('https://api.nbp.pl/api/exchangerates/tables/A/?format=json'),
            axios.get('https://api.nbp.pl/api/exchangerates/tables/B/?format=json'),
        ]);

        const combinedData = [...tableA.data[0].rates, ...tableB.data[0].rates];
        const effectiveDate = tableA.data[0].effectiveDate;

        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            const dateExistsQuery = `SELECT 1 FROM exchange_rates WHERE date = $1 LIMIT 1`;
            const dateExistsResult = await client.query(dateExistsQuery, [effectiveDate]);

            if (dateExistsResult.rowCount > 0) {
                console.log(`Data ${effectiveDate} już istnieje w bazie danych. Pomijanie aktualizacji.`);
                await client.query('ROLLBACK');
                return;
            }

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

            await client.query('COMMIT');
            console.log(`Najnowsze dane (${effectiveDate}) zostały dodane do bazy danych.`);
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

/**
 * Endpoint do pobierania najnowszej dostępnej daty z bazy
 * Zwraca najnowszą datę dla której są dostępne kursy oraz maksymalną datę do wyboru
 */
app.get('/api/latest-date', async (req, res) => {
    try {
        const client = await pool.connect();
        try {
            const todayDate = new Date().toISOString().split('T')[0];
            

            const latestDateQuery = `SELECT MAX(date) as latest_date FROM exchange_rates`;
            const latestResult = await client.query(latestDateQuery);
            let latestDate = latestResult.rows[0]?.latest_date;
            

            if (!latestDate) {
                try {
                    await updateExchangeRates();
                    const newLatestResult = await client.query(latestDateQuery);
                    latestDate = newLatestResult.rows[0]?.latest_date;
                } catch (updateError) {
                    const yesterday = new Date();
                    yesterday.setDate(yesterday.getDate() - 1);
                    latestDate = yesterday.toISOString().split('T')[0];
                }
            }

            const todayExistsQuery = `SELECT COUNT(*) as count FROM exchange_rates WHERE date = $1`;
            const todayResult = await client.query(todayExistsQuery, [todayDate]);
            const todayExists = todayResult.rows[0].count > 0;

            if (!todayExists) {
                try {
                    await updateExchangeRatesForDate(todayDate);
                    const updatedTodayResult = await client.query(todayExistsQuery, [todayDate]);
                    if (updatedTodayResult.rows[0].count > 0) {
                        latestDate = todayDate;
                    }
                } catch (error) {
                    console.log(`Nie udało się pobrać danych dla dzisiejszej daty: ${todayDate}`);
                }
            }

            const finalLatestResult = await client.query(latestDateQuery);
            const finalLatestDate = finalLatestResult.rows[0]?.latest_date;
            
            res.json({ 
                latestDate: finalLatestDate,
                maxSelectableDate: todayDate
            });
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Błąd pobierania najnowszej daty:', error.message);

        const todayDate = new Date().toISOString().split('T')[0];
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const fallbackDate = yesterday.toISOString().split('T')[0];
        
        res.json({ 
            latestDate: fallbackDate,
            maxSelectableDate: todayDate
        });
    }
});

/**
 * Endpoint do pobierania kursów walut dla konkretnej daty
 * Obsługuje walidację dat i automatyczne pobieranie brakujących danych
 */
app.get('/api/exchange-rates', async (req, res) => {
    const { date } = req.query;
    
    try {
        const client = await pool.connect();
        try {
            let targetDate = date;

            const todayDate = new Date().toISOString().split('T')[0];
            const minDate = '2008-01-02';
            
            if (targetDate && (targetDate > todayDate || targetDate < minDate)) {
                return res.json([]);
            }

            if (!targetDate) {
                const latestDateQuery = `SELECT MAX(date) as latest_date FROM exchange_rates`;
                const latestResult = await client.query(latestDateQuery);
                targetDate = latestResult.rows[0]?.latest_date;
                
                if (!targetDate) {

                    await updateExchangeRates();
                    const newLatestResult = await client.query(latestDateQuery);
                    targetDate = newLatestResult.rows[0]?.latest_date;
                }
            }

            const checkDataQuery = `SELECT COUNT(*) as count FROM exchange_rates WHERE date = $1`;
            const dataResult = await client.query(checkDataQuery, [targetDate]);
            const hasData = dataResult.rows[0].count > 0;

            if (!hasData) {
                try {
                    await updateExchangeRatesForDate(targetDate);
                } catch (updateError) {
                    console.log(`Nie udało się pobrać danych dla daty ${targetDate}, używam najnowszych dostępnych`);

                    const fallbackQuery = `SELECT MAX(date) as latest_date FROM exchange_rates`;
                    const fallbackResult = await client.query(fallbackQuery);
                    targetDate = fallbackResult.rows[0]?.latest_date;
                }
            }

            const query = `
                SELECT
                    er.currency_id AS rate_id,
                    c.name AS currency,
                    c.code AS code,
                    er.mid AS mid,
                    er.date AS date
                FROM exchange_rates er
                JOIN currencies c ON er.currency_id = c.id
                WHERE er.date = $1
                ORDER BY c.code
            `;
            
            const result = await client.query(query, [targetDate]);

            if (result.rows.length === 0) {
                const fallbackQuery = `
                    SELECT
                        er.currency_id AS rate_id,
                        c.name AS currency,
                        c.code AS code,
                        er.mid AS mid,
                        er.date AS date
                    FROM exchange_rates er
                    JOIN currencies c ON er.currency_id = c.id
                    WHERE er.date = (SELECT MAX(date) FROM exchange_rates)
                    ORDER BY c.code
                `;
                const fallbackResult = await client.query(fallbackQuery);
                return res.json(fallbackResult.rows);
            }
            
            res.json(result.rows);
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Błąd pobierania kursów walut:', error.message);
        res.status(500).json({ error: 'Nie udało się pobrać kursów walut.' });
    }
});

/**
 * Endpoint do pobierania listy wszystkich dostępnych kodów walut
 */
app.get('/api/currencies', async (req, res) => {
    try {
        const client = await pool.connect();
        try {
            const query = `SELECT code FROM currencies ORDER BY code ASC`;
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

/**
 * Endpoint do pobierania historii kursów dla konkretnej waluty w zakresie dat
 */
app.get('/api/history', async (req, res) => {
    const { code, startDate, endDate } = req.query;

    try {
        const client = await pool.connect();
        try {

            const todayDate = new Date().toISOString().split('T')[0];
            const minDate = '2008-01-02';
            
            if ((startDate && (startDate > todayDate || startDate < minDate)) ||
                (endDate && (endDate > todayDate || endDate < minDate))) {
                return res.json([]);
            }

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

/**
 * Endpoint do ręcznej aktualizacji kursów walut
 */
app.get('/api/update-exchange-rates', async (req, res) => {
    try {
        await updateExchangeRates();
        res.json({ message: 'Dane zostały zaktualizowane.' });
    } catch (error) {
        res.status(500).json({ error: 'Nie udało się zaktualizować danych.' });
    }
});

/**
 * Endpoint do logowania użytkownika
 * Sprawdza email i hasło, zwraca token JWT
 */
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const client = await pool.connect();
        try {

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
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Błąd logowania:', error.message);
        res.status(500).json({ error: 'Wewnętrzny błąd serwera' });
    }
});

/**
 * Endpoint do rejestracji nowego użytkownika
 * Tworzy nowe konto z zahashowanym hasłem
 */
app.post('/api/register', async (req, res) => {
    const { username, email, password } = req.body;

    try {
        const client = await pool.connect();
        try {

            const userExistsQuery = `SELECT 1 FROM users WHERE email = $1`;
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
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Błąd rejestracji:', error.message);
        res.status(500).json({ error: 'Wewnętrzny błąd serwera' });
    }
});

/**
 * Endpoint do zarządzania ulubionymi walutami użytkownika
 * Dodaje lub usuwa walutę z ulubionych (toggle)
 */
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

/**
 * Endpoint do pobierania listy ulubionych walut użytkownika
 */
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

app.listen(PORT, async () => {
    console.log(`Serwer działa na porcie http://localhost:${PORT}`);
    console.log('Sprawdzam dostępność najnowszych kursów walut...');
    await updateExchangeRates();
});