const axios = require('axios');

async function ttdl(url) {
    try {
        if (!/^https?:\/\/(www\.)?(tiktok\.com|vt\.tiktok\.com|vm\.tiktok\.com|m\.tiktok\.com)\/.+/i.test(url)) {
            throw new Error('Invalid TikTok URL');
        }
        
        const { data } = await axios.get('https://tiktok-scraper7.p.rapidapi.com/', {
            headers: {
                'Accept-Encoding': 'gzip',
                'Connection': 'Keep-Alive',
                'Host': 'tiktok-scraper7.p.rapidapi.com',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3945.130 Safari/537.36',
                'X-RapidAPI-Host': 'tiktok-scraper7.p.rapidapi.com',
                'X-RapidAPI-Key': 'ca5c6d6fa3mshfcd2b0a0feac6b7p140e57jsn72684628152a'
            },
            params: {
                url: url,
                hd: '1'
            },
            timeout: 30000
        });
        
        if (!data || !data.data) {
            throw new Error('No data received from TikTok API');
        }
        
        return data.data;
    } catch (error) {
        if (error.response) {
            throw new Error(`TikTok API error: ${error.response.status} - ${error.response.data?.message || 'Unknown error'}`);
        }
        throw new Error(`TikTok download failed: ${error.message}`);
    }
}

module.exports = function(app) {
    app.get('/downloader/tiktok', async (req, res) => {
        try {
            const { url, apikey } = req.query;
            
            if (!url) {
                return res.status(400).json({
                    status: 400,
                    error: 'URL parameter required',
                    message: 'Please provide a TikTok URL using the url parameter'
                });
            }

            // Validate TikTok URL format
            if (!/^https?:\/\/(www\.)?(tiktok\.com|vt\.tiktok\.com|vm\.tiktok\.com|m\.tiktok\.com)\/.+/i.test(url)) {
                return res.status(400).json({
                    status: 400,
                    error: 'Invalid TikTok URL',
                    message: 'Please provide a valid TikTok URL'
                });
            }

            const result = await ttdl(url);
            
            res.json({
                status: 200,
                creator: "@Terri",
                data: result
            });
            
        } catch (error) {
            console.error('TikTok Downloader Error:', error);
            
            if (error.message.includes('Invalid TikTok URL')) {
                return res.status(400).json({
                    status: 400,
                    error: 'Invalid URL',
                    message: error.message
                });
            }
            
            res.status(500).json({
                status: 500,
                error: 'TikTok download failed',
                message: error.message
            });
        }
    });
};