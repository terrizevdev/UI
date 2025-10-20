
const axios = require('axios');

async function youtubeDownload(url, format) {
    try {
        if (!url) throw new Error('URL parameter required');

        const apiUrl = `https://api.nekolabs.my.id/downloader/youtube/v1?url=${encodeURIComponent(url)}&format=${format}`;
        
        const response = await axios.get(apiUrl, {
            headers: {
                'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            },
            timeout: 60000
        });
        
        return response.data;
    } catch (error) {
        throw new Error(`YouTube download failed: ${error.message}`);
    }
}

module.exports = function(app) {
    // Endpoint 1: Default MP3
    app.get('/downloader/youtube/ytmp3', async (req, res) => {
        const startTime = Date.now();
        
        try {
            const { url, apikey } = req.query;
            
            if (!url) {
                return res.status(400).json({
                    success: false,
                    error: 'URL parameter required',
                    message: 'Please provide a YouTube URL',
                    timestamp: new Date().toISOString(),
                    responseTime: `${Date.now() - startTime}ms`
                });
            }

            const result = await youtubeDownload(url, 'mp3');
            
            result.responseTime = `${Date.now() - startTime}ms`;
            
            res.json(result);
            
        } catch (error) {
            console.error('YouTube MP3 Downloader Error:', error);
            res.status(500).json({
                success: false,
                error: 'YouTube MP3 download failed',
                message: error.message,
                timestamp: new Date().toISOString(),
                responseTime: `${Date.now() - startTime}ms`
            });
        }
    });

    // Endpoint 2: Default 320
    app.get('/downloader/youtube/ytmp4', async (req, res) => {
        const startTime = Date.now();
        
        try {
            const { url, apikey } = req.query;
            
            if (!url) {
                return res.status(400).json({
                    success: false,
                    error: 'URL parameter required',
                    message: 'Please provide a YouTube URL',
                    timestamp: new Date().toISOString(),
                    responseTime: `${Date.now() - startTime}ms`
                });
            }

            const result = await youtubeDownload(url, '320');
            
            result.responseTime = `${Date.now() - startTime}ms`;
            
            res.json(result);
            
        } catch (error) {
            console.error('YouTube 320 Downloader Error:', error);
            res.status(500).json({
                success: false,
                error: 'YouTube 320 download failed',
                message: error.message,
                timestamp: new Date().toISOString(),
                responseTime: `${Date.now() - startTime}ms`
            });
        }
    });
};
