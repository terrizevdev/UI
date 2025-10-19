const axios = require('axios');
const qs = require('querystring');
const zlib = require('zlib');

async function kualatshort(url) {
  const res = await axios.post(
    'https://kua.lat/shorten',
    qs.stringify({ url }),
    {
      responseType: 'arraybuffer',
      headers: {
        'Accept': 'application/json, text/javascript, */*; q=0.01',
        'Accept-Encoding': 'gzip, deflate, br',
        'Accept-Language': 'id-ID,id;q=0.9,en-AU;q=0.8,en;q=0.7,en-US;q=0.6',
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'Origin': 'https://kua.lat',
        'Referer': 'https://kua.lat/',
        'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Mobile Safari/537.36',
        'X-Requested-With': 'XMLHttpRequest'
      },
      timeout: 30000
    }
  );

  let decoded;
  const encoding = res.headers['content-encoding'];

  if (encoding === 'br') {
    decoded = zlib.brotliDecompressSync(res.data);
  } else if (encoding === 'gzip') {
    decoded = zlib.gunzipSync(res.data);
  } else if (encoding === 'deflate') {
    decoded = zlib.inflateSync(res.data);
  } else {
    decoded = res.data;
  }

  return JSON.parse(decoded.toString());
}

module.exports = function(app) {
  app.get('/tools/shorturl', async (req, res) => {
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

      const result = await kualatshort(url);
      
      res.json({
        status: 200,
        creator: "@Terri",
        data: {
          original_url: url,
          short_url: result.data.shorturl,
          full_response: result
        }
      });
      
    } catch (error) {
      console.error('ShortURL Error:', error);
      
      if (error.response) {
        return res.status(error.response.status).json({
          status: error.response.status,
          error: 'Shortening failed',
          message: error.response.data?.message || error.message
        });
      }
      
      res.status(500).json({
        status: 500,
        error: 'Shortening failed',
        message: error.message
      });
    }
  });
};