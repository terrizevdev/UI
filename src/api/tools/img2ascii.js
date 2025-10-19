const axios = require('axios');
const cheerio = require('cheerio');
const FormData = require('form-data');
const fileType = require('file-type');

async function img2ascii(buffer, { width = '100' } = {}) {
    try {
        if (!buffer || !Buffer.isBuffer(buffer)) throw new Error('Image buffer is required');
        const type = await fileType.fromBuffer(buffer);
        if (!type || !type.mime.startsWith('image/')) throw new Error('Buffer must be an image');
        
        const form = new FormData();
        form.append('art_type', 'mono');
        form.append('userfile', buffer, `${Date.now()}_terri.jpg`);
        form.append('width', width.toString());
        
        const { data: rynn } = await axios.post('https://www.ascii-art-generator.org/', form, {
            headers: form.getHeaders(),
            timeout: 30000
        });
        
        const match = rynn.match(/\/FW\/result\.php\?name=[a-f0-9]{32}/g);
        if (!match || !match[0]) throw new Error('Failed to process image');
        
        const { data } = await axios.get('https://www.ascii-art-generator.org' + match[0], {
            timeout: 30000
        });
        
        const $ = cheerio.load(data);
        const asciiArt = $('#result-preview-wrap').text().trim();
        
        if (!asciiArt) throw new Error('Failed to generate ASCII art');
        
        return asciiArt;
    } catch (error) {
        throw new Error(`ASCII conversion failed: ${error.message}`);
    }
}

module.exports = function(app) {
    app.post('/tools/img2ascii', async (req, res) => {
        try {
            const { image, width = '100', apikey } = req.body;
            
            if (!image) {
                return res.status(400).json({
                    status: 400,
                    error: 'Image required',
                    message: 'Please provide an image in base64 format'
                });
            }

            // Convert base64 to buffer
            let imageBuffer;
            try {
                const base64Image = image.replace(/^data:image\/\w+;base64,/, '');
                imageBuffer = Buffer.from(base64Image, 'base64');
            } catch (e) {
                return res.status(400).json({
                    status: 400,
                    error: 'Invalid image format',
                    message: 'Please provide valid base64 encoded image'
                });
            }

            const asciiArt = await img2ascii(imageBuffer, { width });
            
            res.json({
                status: 200,
                creator: "@Terri",
                data: {
                    ascii: asciiArt,
                    width: width,
                    timestamp: new Date().toISOString()
                }
            });
            
        } catch (error) {
            console.error('Img2ASCII Error:', error);
            res.status(500).json({
                status: 500,
                error: 'Image to ASCII conversion failed',
                message: error.message
            });
        }
    });

    // GET endpoint for URL-based images
    app.get('/tools/img2ascii', async (req, res) => {
        try {
            const { url, width = '100', apikey } = req.query;
            
            if (!url) {
                return res.status(400).json({
                    status: 400,
                    error: 'URL parameter required',
                    message: 'Please provide an image URL'
                });
            }

            // Download image from URL
            const response = await axios.get(url, {
                responseType: 'arraybuffer',
                timeout: 30000
            });
            
            const imageBuffer = Buffer.from(response.data);
            const asciiArt = await img2ascii(imageBuffer, { width });
            
            res.json({
                status: 200,
                creator: "@Terri",
                data: {
                    ascii: asciiArt,
                    width: width,
                    timestamp: new Date().toISOString()
                }
            });
            
        } catch (error) {
            console.error('Img2ASCII URL Error:', error);
            res.status(500).json({
                status: 500,
                error: 'Image to ASCII conversion failed',
                message: error.message
            });
        }
    });
};