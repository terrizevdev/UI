const axios = require('axios');

module.exports = function(app) {
    async function getPrayerSchedule(city) {
        const apiUrl = `https://api.vreden.my.id/api/islami/jadwalsholat?city=${encodeURIComponent(city)}`;

        try {
            const res = await axios.get(apiUrl, {
                validateStatus: () => true
            });

            const data = res.data;

            if (!data || !data.result) {
                throw new Error('Failed to get data from Prayer Schedule API.');
            }

            return data;
        } catch (err) {
            throw new Error(err.message || 'Failed to fetch data from Prayer Schedule API.');
        }
    }

    app.get('/islami/jadwalsholat', async (req, res) => {
        const { city } = req.query;
        if (!city) {
            return res.status(400).json({ status: false, error: 'City is required' });
        }

        try {
            const prayerData = await getPrayerSchedule(city);
            res.json({
                status: 200,
                creator: "api.vreden.my.id",
                result: prayerData.result
            });
        } catch (err) {
            res.status(500).json({ status: false, error: err.message });
        }
    });
};