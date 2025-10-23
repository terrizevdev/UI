const axios = require('axios');

module.exports = (app) => {
    /**
     * @api {get} /tools/pairing Get Pairing Code
     * @apiName GetPairingCode
     * @apiGroup Tools
     * @apiDescription Generate pairing code for a phone number
     * 
     * @apiParam {String} number Phone number without + sign (required)
     * @apiParam {String} apikey Your API key (required)
     * 
     * @apiSuccess {Number} status HTTP status code
     * @apiSuccess {String} creator API creator
     * @apiSuccess {String} number The phone number provided
     * @apiSuccess {String} pairing_code The generated pairing code
     * @apiSuccess {String} pairing_url The pairing URL
     * 
     * @apiError {Number} status Error status code
     * @apiError {String} error Error message
     * @apiError {String} message Detailed error description
     */
    app.get('/tools/pairing', async (req, res) => {
        try {
            const { number } = req.query;

            // Validate required parameters
            if (!number) {
                return res.status(400).json({
                    status: 400,
                    error: 'Missing required parameter',
                    message: 'Phone number (number) is required'
                });
            }

            // Validate number format (digits only, no +)
            if (!/^\d+$/.test(number)) {
                return res.status(400).json({
                    status: 400,
                    error: 'Invalid phone number format',
                    message: 'Phone number should contain only digits without + sign'
                });
            }

            // Make request to the pairing service
            const pairingUrl = `https://vinic-xmd-pairing-site-n57t.onrender.com/code?number=${number}`;
            
            const response = await axios.get(pairingUrl, {
                timeout: 30000 // 30 seconds timeout
            });

            // If the external service returns successful response
            if (response.status === 200) {
                return res.json({
                    status: 200,
                    creator: "Terri API",
                    number: number,
                    pairing_code: response.data.code || "Generated successfully",
                    pairing_url: pairingUrl,
                    message: "Pairing code generated successfully"
                });
            } else {
                return res.status(response.status).json({
                    status: response.status,
                    error: 'External service error',
                    message: 'Failed to generate pairing code from external service'
                });
            }

        } catch (error) {
            console.error('Pairing code error:', error.message);
            
            // Handle different types of errors
            if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
                return res.status(503).json({
                    status: 503,
                    error: 'Service unavailable',
                    message: 'Pairing service is currently unavailable'
                });
            }
            
            if (error.response) {
                // The external service responded with an error status
                return res.status(error.response.status).json({
                    status: error.response.status,
                    error: 'External service error',
                    message: error.response.data?.message || 'Error from pairing service'
                });
            }
            
            if (error.request) {
                // The request was made but no response was received
                return res.status(504).json({
                    status: 504,
                    error: 'Gateway timeout',
                    message: 'No response received from pairing service'
                });
            }
            
            // Other errors
            return res.status(500).json({
                status: 500,
                error: 'Internal server error',
                message: 'Failed to generate pairing code'
            });
        }
    });
};
