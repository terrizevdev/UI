const WebSocket = require('ws');

async function ss2code(imageBuffer) {
    return new Promise((resolve, reject) => {
        const ws = new WebSocket('wss://imagetoappv2.ngrok.app/generate-code');
        let finalCode = '';
        let timeout = setTimeout(() => {
            ws.close();
            reject(new Error('WebSocket timeout'));
        }, 60000);
        
        ws.on('open', () => {
            console.log('Connected to WebSocket');
            ws.send(JSON.stringify({
                generationType: 'create',
                image: `data:image/jpeg;base64,${imageBuffer.toString('base64')}`,
                inputMode: 'image',
                openAiApiKey: null,
                openAiBaseURL: null,
                anthropicApiKey: null,
                screenshotOneApiKey: null,
                isImageGenerationEnabled: true,
                editorTheme: 'cobalt',
                generatedCodeConfig: 'html_tailwind',
                codeGenerationModel: 'gpt-4o-2024-05-13',
                isTermOfServiceAccepted: false
            }));
        });

        ws.on('message', (message) => {
            const response = JSON.parse(message.toString());
            if (response.type === 'setCode') {
                finalCode = response.value;
            } else if (response.type === 'status') {
                console.log('Status:', response.value);
            }
        });

        ws.on('close', () => {
            clearTimeout(timeout);
            console.log('WebSocket connection closed');
            resolve(finalCode.trim());
        });

        ws.on('error', (error) => {
            clearTimeout(timeout);
            reject(new Error(`WebSocket error: ${error.message}`));
        });
    });
}

module.exports = function(app) {
    app.post('/tools/ss2code', async (req, res) => {
        try {
            const { image, apikey } = req.body;
            
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

            const code = await ss2code(imageBuffer);
            
            res.json({
                status: 200,
                creator: "@Terri",
                data: {
                    code: code,
                    language: 'html_tailwind',
                    timestamp: new Date().toISOString()
                }
            });
            
        } catch (error) {
            console.error('SS2Code Error:', error);
            res.status(500).json({
                status: 500,
                error: 'Screenshot to code conversion failed',
                message: error.message
            });
        }
    });
};