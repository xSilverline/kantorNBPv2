const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

app.get('/api/exchange-rates', async (req, res) => {
    try {
        const [tableA, tableB] = await Promise.all([
            axios.get('https://api.nbp.pl/api/exchangerates/tables/A/?format=json'),
            axios.get('https://api.nbp.pl/api/exchangerates/tables/B/?format=json')
        ]);

        const combinedData = [...tableA.data[0].rates, ...tableB.data[0].rates];

        const formattedData = combinedData.map(rate => ({
            col1: rate.currency,
            col2: rate.code,
            col3: rate.mid.toFixed(4)
        }));

        res.json(formattedData);
    } catch (error) {
        console.error('Błąd podczas pobierania danych z API NBP:', error.message);
        res.status(500).json({ error: 'Nie udało się pobrać danych z API NBP' });
    }
});

app.listen(PORT, () => {
    console.log(`Serwer działa na porcie http://localhost:${PORT}`);
});