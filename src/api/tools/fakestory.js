const axios = require('axios');
const FormData = require('form-data');
const moment = require('moment-timezone');

async function downloadImage(url) {
  try {
    const response = await axios.get(url, {
      responseType: 'arraybuffer',
      timeout: 30000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    return Buffer.from(response.data);
  } catch (error) {
    throw new Error(`Failed to download image from URL: ${error.message}`);
  }
}

async function createFakeStory(imageBuffer, avatarBuffer, username) {
  const jam = moment().tz('Asia/Jakarta').format('HH:mm') + ' WIB';

  const form = new FormData();
  form.append('username', username);
  form.append('jam', jam);
  form.append('image', imageBuffer, { filename: 'image.jpg' });
  form.append('avatar', avatarBuffer, { filename: 'avatar.jpg' });

  const res = await axios.post('https://fathurweb.qzz.io/api/canvas/fakestory', form, {
    headers: form.getHeaders(),
    responseType: 'arraybuffer',
    maxContentLength: Infinity,
    maxBodyLength: Infinity,
    timeout: 30000
  });

  return Buffer.from(res.data);
}

module.exports = function(app) {
  app.get('/tools/fakestory', async (req, res) => {
    try {
      const { image, avatar, username, apikey } = req.query;
      
      if (!image) {
        return res.status(400).json({
          status: 400,
          error: 'Image URL required',
          message: 'Please provide an image URL using the image parameter'
        });
      }

      if (!username) {
        return res.status(400).json({
          status: 400,
          error: 'Username required',
          message: 'Please provide a username'
        });
      }

      // Validate URL format
      try {
        new URL(image);
        if (avatar) new URL(avatar);
      } catch (e) {
        return res.status(400).json({
          status: 400,
          error: 'Invalid URL',
          message: 'Please provide valid image URLs'
        });
      }

      // Download images
      let imageBuffer, avatarBuffer;
      
      try {
        imageBuffer = await downloadImage(image);
        
        if (avatar) {
          avatarBuffer = await downloadImage(avatar);
        } else {
          // Use default avatar or the same image
          avatarBuffer = imageBuffer;
        }
      } catch (error) {
        return res.status(400).json({
          status: 400,
          error: 'Image download failed',
          message: error.message
        });
      }

      const result = await createFakeStory(imageBuffer, avatarBuffer, username);
      
      // Convert result to base64 for JSON response
      const base64Result = result.toString('base64');
      const dataUrl = `data:image/jpeg;base64,${base64Result}`;
      
      res.json({
        status: 200,
        creator: "@Terri",
        data: {
          image: dataUrl,
          username: username,
          timestamp: new Date().toISOString(),
          message: 'Fake story created successfully'
        }
      });
      
    } catch (error) {
      console.error('Fake Story Error:', error);
      res.status(500).json({
        status: 500,
        error: 'Fake story creation failed',
        message: error.message
      });
    }
  });

  // Endpoint that returns the image directly
  app.get('/tools/fakestory/image', async (req, res) => {
    try {
      const { image, avatar, username, apikey } = req.query;
      
      if (!image) {
        return res.status(400).send('Image URL parameter required');
      }

      if (!username) {
        return res.status(400).send('Username parameter required');
      }

      // Validate URL format
      try {
        new URL(image);
        if (avatar) new URL(avatar);
      } catch (e) {
        return res.status(400).send('Invalid image URL');
      }

      // Download images
      let imageBuffer, avatarBuffer;
      
      try {
        imageBuffer = await downloadImage(image);
        
        if (avatar) {
          avatarBuffer = await downloadImage(avatar);
        } else {
          avatarBuffer = imageBuffer;
        }
      } catch (error) {
        return res.status(400).send(`Failed to download image: ${error.message}`);
      }

      const result = await createFakeStory(imageBuffer, avatarBuffer, username);
      
      // Return image directly
      res.set('Content-Type', 'image/jpeg');
      res.set('Content-Disposition', 'attachment; filename="fakestory.jpg"');
      res.send(result);
      
    } catch (error) {
      console.error('Fake Story Image Error:', error);
      res.status(500).send('Fake story creation failed');
    }
  });
};