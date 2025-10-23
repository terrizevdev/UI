
const fg = require('api-dylux');

async function ttdl(url) {
    try {
        if (!/^https?:\/\/(www\.)?(tiktok\.com|vt\.tiktok\.com|vm\.tiktok\.com|m\.tiktok\.com)\/.+/i.test(url)) {
            throw new Error('Invalid TikTok URL');
        }
        
        const data = await fg.tiktok(url);
        
        if (!data || !data.result) {
            throw new Error('No data received from TikTok API');
        }
        
        return data.result;
    } catch (error) {
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
            
            // Format the response to match your existing structure
            const formattedResult = {
                id: result.id,
                author: {
                    nickname: result.author?.nickname || 'Unknown'
                },
                title: result.title || '',
                digg_count: result.digg_count || 0,
                comment_count: result.comment_count || 0,
                share_count: result.share_count || 0,
                play_count: result.play_count || 0,
                create_time: result.create_time || '',
                size: result.size || '',
                duration: result.duration || 0,
                play: result.play || '',
                music: result.music || '',
                images: result.images || null
            };
            
            res.json({
                status: 200,
                creator: "@Terri",
                data: formattedResult
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
