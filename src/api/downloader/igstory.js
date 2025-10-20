const axios = require('axios');
const cheerio = require('cheerio');
const FormData = require('form-data');

async function igstory(url) {
    try {
        if (!/^https:\/\/www\.instagram\.com\/stories\/[a-zA-Z0-9_.]+\/?/.test(url)) {
            throw new Error('Invalid Instagram story URL');
        }
        
        const rynn = new FormData();
        rynn.append('url', url);
        const { data: a } = await axios.post('https://savevid.net/api/userverify', rynn, {
            headers: rynn.getHeaders(),
            timeout: 30000
        });
        
        const form = new FormData();
        form.append('q', url);
        form.append('t', 'media');
        form.append('lang', 'en');
        form.append('v', 'v2');
        form.append('cftoken', a.token);
        const { data } = await axios.post('https://v3.savevid.net/api/ajaxSearch', form, {
            headers: form.getHeaders(),
            timeout: 30000
        });
        
        const $ = cheerio.load(data.data);
        const stories = [];
    
        $('ul.download-box > li').each((_, rynn) => {
            const dl_url = $(rynn).find('.download-items__btn:not(.dl-thumb) a').attr('href');
            if (dl_url) stories.push(dl_url);
        });
    
        if (stories.length === 0) {
            throw new Error('No stories found');
        }
        
        return stories;
    } catch (error) {
        throw new Error(`Instagram story download failed: ${error.message}`);
    }
}

module.exports = function(app) {
    app.get('/downloader/igstory', async (req, res) => {
        try {
            const { url, apikey } = req.query;
            
            if (!url) {
                return res.status(400).json({
                    status: 400,
                    error: 'URL parameter required',
                    message: 'Please provide an Instagram story URL'
                });
            }

            if (!/^https:\/\/www\.instagram\.com\/stories\/[a-zA-Z0-9_.]+\/?/.test(url)) {
                return res.status(400).json({
                    status: 400,
                    error: 'Invalid Instagram story URL',
                    message: 'Please provide a valid Instagram story URL'
                });
            }

            const result = await igstory(url);
            
            res.json({
                status: 200,
                creator: "@Terri",
                data: {
                    story_urls: result,
                    count: result.length
                }
            });
            
        } catch (error) {
            console.error('Instagram Story Downloader Error:', error);
            res.status(500).json({
                status: 500,
                error: 'Instagram story download failed',
                message: error.message
            });
        }
    });
};