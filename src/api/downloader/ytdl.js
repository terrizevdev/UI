
const axios = require('axios');

async function youtubeDownload(url, format) {
    try {
        if (!url || !format) throw new Error('URL and format parameters required');
        
        const validFormats = ['mp3', '144', '240', '360', '480', '720', '1080'];
        if (!validFormats.includes(format)) {
            throw new Error(`Invalid format! Available formats: ${validFormats.join(', ')}`);
        }

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
    app.get('/downloader/ytdl', async (req, res) => {
        const startTime = Date.now();
        
        try {
            const { url, format, apikey } = req.query;
            
            if (!url || !format) {
                return res.status(400).json({
                    success: false,
                    error: 'Parameters required',
                    message: 'Please provide both URL and format parameters',
                    timestamp: new Date().toISOString(),
                    responseTime: `${Date.now() - startTime}ms`
                });
            }

            const result = await youtubeDownload(url, format);
            
            // Add response time to the result
            result.responseTime = `${Date.now() - startTime}ms`;
            
            res.json(result);
            
        } catch (error) {
            console.error('YouTube Downloader Error:', error);
            res.status(500).json({
                success: false,
                error: 'YouTube download failed',
                message: error.message,
                timestamp: new Date().toISOString(),
                responseTime: `${Date.now() - startTime}ms`
            });
        }
    });
};
