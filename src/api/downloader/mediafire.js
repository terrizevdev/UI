const axios = require('axios');
const cheerio = require('cheerio');
const { lookup } = require('mime-types');

async function mediafire(url) {
    try {
        if (!url.includes('www.mediafire.com')) throw new Error('Invalid MediaFire URL');
        
        const { data } = await axios.get(`https://px.nekolabs.my.id/${encodeURIComponent(url)}`, {
            timeout: 30000
        });
        const $ = cheerio.load(data.data.content);
        const raw = $('div.dl-info');
        
        const filename = $('.dl-btn-label').attr('title') || raw.find('div.intro div.filename').text().trim() || null;
        const ext = filename ? filename.split('.').pop() : null;
        const mimetype = ext ? lookup(ext.toLowerCase()) : null;
        
        const filesize = raw.find('ul.details li:nth-child(1) span').text().trim();
        const uploaded = raw.find('ul.details li:nth-child(2) span').text().trim();
        
        const dl = $('a#downloadButton').attr('href');
        if (!dl) throw new Error('File not found');
        
        return {
            filename,
            filesize,
            mimetype,
            uploaded,
            download_url: dl
        }
    } catch (error) {
        throw new Error(`MediaFire download failed: ${error.message}`);
    }
}

module.exports = function(app) {
    app.get('/downloader/mediafire', async (req, res) => {
        try {
            const { url, apikey } = req.query;
            
            if (!url) {
                return res.status(400).json({
                    status: 400,
                    error: 'URL parameter required',
                    message: 'Please provide a MediaFire URL'
                });
            }

            if (!url.includes('www.mediafire.com')) {
                return res.status(400).json({
                    status: 400,
                    error: 'Invalid MediaFire URL',
                    message: 'Please provide a valid MediaFire URL'
                });
            }

            const result = await mediafire(url);
            
            res.json({
                status: 200,
                creator: "@Terri",
                data: result
            });
            
        } catch (error) {
            console.error('MediaFire Downloader Error:', error);
            res.status(500).json({
                status: 500,
                error: 'MediaFire download failed',
                message: error.message
            });
        }
    });
};