const axios = require('axios');

module.exports = function (app) {
    async function fetchRandomHadits() {
        try {
            const { data } = await axios.get('https://api.myquran.com/v2/hadits/arbain/semua');
            const list = data.data;
            const random = list[Math.floor(Math.random() * list.length)];

            return {
                source: "Hadits Arbain Scraper",
                number: random.no,
                title: random.judul,
                arabic_text: random.arab,
                translation: random.indo
            };
        } catch (error) {
            throw new Error("Failed to fetch hadith data.");
        }
    }

    app.get('/islami/hadits/random', async (req, res) => {
        try {
            const result = await fetchRandomHadits();
            res.json({
                status: true,
                creator: "@Terri",
                result
            });
        } catch (err) {
            res.status(500).json({
                status: false,
                creator: "@Terri",
                error: err.message
            });
        }
    });
};
