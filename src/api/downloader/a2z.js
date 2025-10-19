const axios = require("axios");

async function downloadFromA2Z(url) {
  try {
    if (!url) throw new Error('URL is required.');

    const res = await axios.get("https://www.a2zconverter.com/api/files/new-proxy", {
      params: { url },
      headers: {
        "Accept": "application/json, text/plain, */*",
        "Accept-Language": "en-US,en;q=0.9",
        "Cache-Control": "no-cache",
        "Pragma": "no-cache",
        "Referer": "https://www.a2zconverter.com/",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
      },
      timeout: 30000
    });

    return res.data;
  } catch (err) {
    throw new Error(`Download failed: ${err.message}`);
  }
}

module.exports = function(app) {
  app.get('/downloader/a2z', async (req, res) => {
    try {
      const { url, apikey } = req.query;
      
      if (!url) {
        return res.status(400).json({
          status: 400,
          error: 'URL parameter required',
          message: 'Please provide a URL using the url parameter'
        });
      }

      // Validate URL format
      try {
        new URL(url);
      } catch (e) {
        return res.status(400).json({
          status: 400,
          error: 'Invalid URL',
          message: 'Please provide a valid URL'
        });
      }

      const result = await downloadFromA2Z(url);
      
      res.json({
        status: 200,
        creator: "@Terri",
        data: result
      });
      
    } catch (error) {
      console.error('A2Z Downloader Error:', error);
      res.status(500).json({
        status: 500,
        error: 'Download failed',
        message: error.message
      });
    }
  });
};