const axios = require('axios');

// Function for direct URL download
async function spotifydl(url) {
    try {
        if (!url.includes('open.spotify.com')) throw new Error('Invalid Spotify URL');
        
        const apiUrl = `https://api.nekolabs.my.id/downloader/spotify/v1?url=${encodeURIComponent(url)}`;
        
        const response = await axios.get(apiUrl, {
            headers: {
                'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            },
            timeout: 30000
        });
        
        return response.data;
    } catch (error) {
        throw new Error(`Spotify download failed: ${error.message}`);
    }
}

// Function for search and download
async function spotifySearch(query) {
    try {
        if (!query || query.trim() === '') throw new Error('Search query required');
        
        const apiUrl = `https://api.nekolabs.my.id/downloader/spotify/play/v1?q=${encodeURIComponent(query)}`;
        
        const response = await axios.get(apiUrl, {
            headers: {
                'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            },
            timeout: 30000
        });
        
        return response.data;
    } catch (error) {
        throw new Error(`Spotify search failed: ${error.message}`);
    }
}

module.exports = function(app) {
    // Endpoint 1: Search and download (main endpoint)
    app.get('/downloader/spotify/v1', async (req, res) => {
        const startTime = Date.now();
        
        try {
            const { q, apikey } = req.query;
            
            if (!q) {
                return res.status(400).json({
                    success: false,
                    error: 'Query parameter required',
                    message: 'Please provide a search query',
                    timestamp: new Date().toISOString(),
                    responseTime: `${Date.now() - startTime}ms`
                });
            }

            const result = await spotifySearch(q);
            
            // Add response time to the result
            result.responseTime = `${Date.now() - startTime}ms`;
            
            res.json(result);
            
        } catch (error) {
            console.error('Spotify Search Error:', error);
            res.status(500).json({
                success: false,
                error: 'Spotify search failed',
                message: error.message,
                timestamp: new Date().toISOString(),
                responseTime: `${Date.now() - startTime}ms`
            });
        }
    });

    // Endpoint 2: Direct URL download (additional endpoint)
    app.get('/downloader/spotify', async (req, res) => {
        const startTime = Date.now();
        
        try {
            const { url, apikey } = req.query;
            
            if (!url) {
                return res.status(400).json({
                    success: false,
                    error: 'URL parameter required',
                    message: 'Please provide a Spotify URL',
                    timestamp: new Date().toISOString(),
                    responseTime: `${Date.now() - startTime}ms`
                });
            }

            if (!url.includes('open.spotify.com')) {
                return res.status(400).json({
                    success: false,
                    error: 'Invalid Spotify URL',
                    message: 'Please provide a valid Spotify track URL',
                    timestamp: new Date().toISOString(),
                    responseTime: `${Date.now() - startTime}ms`
                });
            }

            const result = await spotifydl(url);
            
            // Add response time to the result
            result.responseTime = `${Date.now() - startTime}ms`;
            
            res.json(result);
            
        } catch (error) {
            console.error('Spotify Downloader Error:', error);
            res.status(500).json({
                success: false,
                error: 'Spotify download failed',
                message: error.message,
                timestamp: new Date().toISOString(),
                responseTime: `${Date.now() - startTime}ms`
            });
        }
    });
};