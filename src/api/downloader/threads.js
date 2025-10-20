const axios = require('axios');
const cheerio = require('cheerio');
const FormData = require('form-data');

async function threadsdl(url) {
    try {
        const form = new FormData();
        form.append('search', url);
        const { data } = await axios.post('https://threadsdownload.net/ms?fresh-partial=true', form, {
            headers: {
                accept: '*/*',
                'content-type': 'multipart/form-data',
                origin: 'https://threadsdownload.net',
                referer: 'https://threadsdownload.net/ms',
                'sec-ch-ua': '"Chromium";v="137", "Not/A)Brand";v="24"',
                'sec-ch-ua-mobile': '?1',
                'sec-ch-ua-platform': '"Android"',
                'sec-fetch-dest': 'empty',
                'sec-fetch-mode': 'cors',
                'sec-fetch-site': 'same-origin',
                'user-agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Mobile Safari/537.36',
            },
            timeout: 30000
        });
        const $ = cheerio.load(data);
        
        const jsonString = $(`script[type='application/json']`).text().trim();
        
        let braceCount = 0;
        let endIndex = -1;
        for (let i = 0; i < jsonString.length; i++) {
            if (jsonString[i] === '{') braceCount++;
            if (jsonString[i] === '}') braceCount--;
            if (braceCount === 0 && jsonString[i] === '}') {
                endIndex = i + 1;
                break;
            }
        }
        
        if (endIndex === -1) {
            throw new Error('Failed to parse Threads data');
        }
        
        const validJsonString = jsonString.slice(0, endIndex);
        const jsonData = JSON.parse(validJsonString);
        
        if (!jsonData.v || !jsonData.v[0] || !jsonData.v[0][1]) {
            throw new Error('No download URL found');
        }
        
        return jsonData.v[0][1];
    } catch (error) {
        throw new Error(`Threads download failed: ${error.message}`);
    }
}

module.exports = function(app) {
    app.get('/downloader/threads', async (req, res) => {
        try {
            const { url, apikey } = req.query;
            
            if (!url) {
                return res.status(400).json({
                    status: 400,
                    error: 'URL parameter required',
                    message: 'Please provide a Threads URL'
                });
            }

            const result = await threadsdl(url);
            
            res.json({
                status: 200,
                creator: "@Terri",
                data: {
                    download_url: result
                }
            });
            
        } catch (error) {
            console.error('Threads Downloader Error:', error);
            res.status(500).json({
                status: 500,
                error: 'Threads download failed',
                message: error.message
            });
        }
    });
};