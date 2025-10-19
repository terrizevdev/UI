const axios = require('axios');
const cheerio = require('cheerio');

function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

async function mfsearch(query) {
    try {
        if (!query) throw new Error('Query is required.');
        
        const { data: html } = await axios.get(`https://px.nekolabs.my.id/${encodeURIComponent(`https://mediafiretrend.com/?q=${encodeURIComponent(query)}&search=Search`)}`);
        const $ = cheerio.load(html.data.content);
        
        const links = shuffle(
            $('tbody tr a[href*="/f/"]').map((_, el) => $(el).attr('href')).get()
        ).slice(0, 5);
        
        const result = await Promise.all(links.map(async link => {
            const { data } = await axios.get(`https://px.nekolabs.my.id/${encodeURIComponent(`https://mediafiretrend.com${link}`)}`);
            const $ = cheerio.load(data.data.content);
            
            const raw = $('div.info tbody tr:nth-child(4) td:nth-child(2) script').text();
            const match = raw.match(/unescape\(['"`]([^'"`]+)['"`]\)/);
            const decoded = cheerio.load(decodeURIComponent(match[1]));
            
            return {
                filename: $('tr:nth-child(2) td:nth-child(2) b').text().trim(),
                filesize: $('tr:nth-child(3) td:nth-child(2)').text().trim(),
                url: decoded('a').attr('href'),
                source_url: $('tr:nth-child(5) td:nth-child(2)').text().trim(),
                source_title: $('tr:nth-child(6) td:nth-child(2)').text().trim()
            };
        }));
        
        return result;
    } catch (error) {
        throw new Error(error.message);
    }
}

module.exports = function(app) {
    app.get('/search/mediafire', async (req, res) => {
        try {
            const { q, apikey } = req.query;
            
            if (!q) {
                return res.status(400).json({
                    status: 400,
                    error: 'Query parameter required',
                    message: 'Please provide a search query using the q parameter'
                });
            }

            const results = await mfsearch(q);
            
            res.json({
                status: 200,
                creator: "@Terri",
                data: results
            });
            
        } catch (error) {
            console.error('MediaFire Search Error:', error);
            res.status(500).json({
                status: 500,
                error: 'Search failed',
                message: error.message
            });
        }
    });
};