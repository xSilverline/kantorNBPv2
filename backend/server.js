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
            col3: rate.mid.toFixed(4),
        }));
        res.json(formattedData);

    } catch (error) {
        console.error('Błąd podczas pobierania danych z API NBP:', error.message);
        res.status(500).json({ error: 'Nie udało się pobrać danych z API NBP' });
    }
});

async function updateDB()
{
    try {

        const [tableA, tableB] = await Promise.all([
            axios.get('https://api.nbp.pl/api/exchangerates/tables/A/?format=json'),
            axios.get('https://api.nbp.pl/api/exchangerates/tables/B/?format=json')
        ]);
        // console.log(tableA);
        const effectiveDate = tableA.data[0].effectiveDate;
        const combinedData = [...tableA.data[0].rates, ...tableB.data[0].rates];

        const formattedData = combinedData.map(rate => ({
            currency: rate.currency,
            code: rate.code,
            mid: Number(rate.mid.toFixed(4)),
            date: effectiveDate
        }));

        console.log(JSON.stringify(formattedData, null, 2));

        const dbData =  await axios.post(
            'http://localhost:3000/exchangerates',
            JSON.stringify(formattedData,null, 2),
            { headers: { 'Content-Type': 'application/json' } }
        );


    } catch (errorStart) {
        if (errorStart.response) {
            console.error('Błąd odpowiedzi serwera:', errorStart.response.status);
            console.error('Treść odpowiedzi:', errorStart.response.data);
        } else {
            console.error('Błąd przesyłania danych:', errorStart.message);
        }
    }
}

updateDB();
app.listen(PORT, () => {
    console.log(`Serwer działa na porcie http://localhost:${PORT}`);
});