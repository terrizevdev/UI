const axios = require('axios');
const cheerio = require('cheerio');

async function spotifydl(url) {
    try {
        if (!url.includes('open.spotify.com')) throw new Error('Invalid Spotify URL');
        
        const rynn = await axios.get('https://spotdl.io/', {
            headers: {
                'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            },
            timeout: 30000
        });
        const $ = cheerio.load(rynn.data);
        
        const api = axios.create({
            baseURL: 'https://spotdl.io',
            headers: {
                cookie: rynn.headers['set-cookie'].join('; '),
                'content-type': 'application/json',
                'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'x-csrf-token': $('meta[name="csrf-token"]').attr('content')
            },
            timeout: 30000
        });
        
        const [{ data: meta }, { data: dl }] = await Promise.all([
            api.post('/getTrackData', { spotify_url: url }),
            api.post('/convert', { urls: url })
        ]);
        
        return {
            ...meta,
            download_url: dl.url
        };
    } catch (error) {
        throw new Error(`Spotify download failed: ${error.message}`);
    }
}

module.exports = function(app) {
    app.get('/downloader/spotify', async (req, res) => {
        try {
            const { url, apikey } = req.query;
            
            if (!url) {
                return res.status(400).json({
                    status: 400,
                    error: 'URL parameter required',
                    message: 'Please provide a Spotify URL'
                });
            }

            if (!url.includes('open.spotify.com')) {
                return res.status(400).json({
                    status: 400,
                    error: 'Invalid Spotify URL',
                    message: 'Please provide a valid Spotify track URL'
                });
            }

            const result = await spotifydl(url);
            
            res.json({
                status: 200,
                creator: "@Terri",
                data: result
            });
            
        } catch (