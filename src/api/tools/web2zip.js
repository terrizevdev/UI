const axios = require('axios');

async function saveweb2zip(url, options = {}) {
    try {
        if (!url) throw new Error('Url is required');
        url = url.startsWith('https://') ? url : `https://${url}`;
        const {
            renameAssets = false,
            saveStructure = false,
            alternativeAlgorithm = false,
            mobileVersion = false
        } = options;
        
        const { data } = await axios.post('https://copier.saveweb2zip.com/api/copySite', {
            url,
            renameAssets,
            saveStructure,
            alternativeAlgorithm,
            mobileVersion
        }, {
            headers: {
                accept: '*/*',
                'content-type': 'application/json',
                origin: 'https://saveweb2zip.com',
                referer: 'https://saveweb2zip.com/',
                'user-agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Mobile Safari/537.36'
            },
            timeout: 30000
        });
        
        let attempts = 0;
        const maxAttempts = 60; // 60 seconds timeout
        
        while (attempts < maxAttempts) {
            const { data: process } = await axios.get(`https://copier.saveweb2zip.com/api/getStatus/${data.md5}`, {
                headers: {
                    accept: '*/*',
                    'content-type': 'application/json',
                    origin: 'https://saveweb2zip.com',
                    referer: 'https://saveweb2zip.com/',
                    'user-agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Mobile Safari/537.36'
                },
                timeout: 30000
            });
            
            if (process.isFinished) {
                return {
                    url,
                    error: {
                        text: process.errorText,
                        code: process.errorCode,
                    },
                    copiedFilesAmount: process.copiedFilesAmount,
                    downloadUrl: `https://copier.saveweb2zip.com/api/downloadArchive/${process.md5}`
                };
            }
            
            await new Promise(resolve => setTimeout(resolve, 1000));
            attempts++;
        }
        
        throw new Error('Website processing timeout');
    } catch (error) {
        throw new Error(`Web2ZIP failed: ${error.message}`);
    }
}

module.exports = function(app) {
    app.get('/tools/web2zip', async (req, res) => {
        try {
            const { url, renameAssets, saveStructure, alternativeAlgorithm, mobileVersion, apikey } = req.query;
            
            if (!url) {
                return res.status(400).json({
                    status: 400,
                    error: 'URL parameter required',
                    message: 'Please provide a website URL'
                });
            }

            const options = {
                renameAssets: renameAssets === 'true',
                saveStructure: saveStructure === 'true',
                alternativeAlgorithm: alternativeAlgorithm === 'true',
                mobileVersion: mobileVersion === 'true'
            };

            const result = await saveweb2zip(url, options);
            
            res.json({
                status: 200,
                creator: "@Terri",
                data: result
            });
            
        } catch (error) {
            console.error('Web2ZIP Error:', error);
            res.status(500).json({
                status: 500,
                error: 'Website to ZIP conversion failed',
                message: error.message
            });
        }
    });
};