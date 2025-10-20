const axios = require('axios');
const crypto = require('crypto');

class AuthGenerator {
  static #PUBLIC_KEY = `-----BEGIN PUBLIC KEY-----\nMIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDa2oPxMZe71V4dw2r8rHWt59gH\nW5INRmlhepe6GUanrHykqKdlIB4kcJiu8dHC/FJeppOXVoKz82pvwZCmSUrF/1yr\nrnmUDjqUefDu8myjhcbio6CnG5TtQfwN2pz3g6yHkLgp8cFfyPSWwyOCMMMsTU9s\nsnOjvdDb4wiZI8x3UwIDAQAB\n-----END PUBLIC KEY-----`;
  static #S = 'NHGNy5YFz7HeFb'
  
  constructor(appId) {
    this.appId = appId;
  }

  aesEncrypt(data, key, iv) {
    const keyBuffer = Buffer.from(key, 'utf8');
    const ivBuffer = Buffer.from(iv, 'utf8');
    const cipher = crypto.createCipheriv('aes-128-cbc', keyBuffer, ivBuffer);

    let encrypted = cipher.update(data, 'utf8', 'base64');
    encrypted += cipher.final('base64');
    return encrypted;
  }

  generateRandomString(length) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    const randomBytes = crypto.randomBytes(length);
    for (let i = 0; i < length; i++) {
      result += chars.charAt(randomBytes[i] % chars.length);
    }
    return result;
  }

  generate() {
    const t = Math.floor(Date.now() / 1000).toString()
    const nonce = crypto.randomUUID();
    const tempAesKey = this.generateRandomString(16);

    const encryptedData = crypto.publicEncrypt({
      key: AuthGenerator.#PUBLIC_KEY,
      padding: crypto.constants.RSA_PKCS1_PADDING,
    }, Buffer.from(tempAesKey));
    const secret_key = encryptedData.toString('base64');

    const dataToSign = `${this.appId}:${AuthGenerator.#S}:${t}:${nonce}:${secret_key}`;
    const sign = this.aesEncrypt(dataToSign, tempAesKey, tempAesKey);
    
    return {
      app_id: this.appId,
      t: t,
      nonce: nonce,
      sign: sign,
      secret_key: secret_key,
    };
  }
}

async function convert(buffer, prompt) {
  try {
    const auth = new AuthGenerator('ai_df');
    const authData = auth.generate();
    const userId = auth.generateRandomString(64).toLowerCase();
    
    const headers = {
      'Access-Control-Allow-Credentials': 'true',
      'Content-Type': 'application/json',
      'User-Agent': 'Mozilla/5.0 (Android 15; Mobile; SM-F958; rv:130.0) Gecko/130.0 Firefox/130.0',
      'Referer': 'https://deepfakemaker.io/nano-banana-ai/'
    };
    
    const instance = axios.create({
      baseURL: 'https://apiv1.deepfakemaker.io/api',
      params: authData,
      headers
    });

    const file = await instance.post('/user/v2/upload-sign', {
      'filename': auth.generateRandomString(32) + '_' + Date.now() + '.jpg',
      'hash': crypto.createHash('sha256').update(buffer).digest('hex'),
      'user_id': userId
    }).then(i => i.data);

    await axios.put(file.data.url, buffer, {
      headers: {
        'content-type': 'image/jpeg',
        'content-length': buffer.length
      }
    });

    const taskData = await instance.post('/replicate/v1/free/nano/banana/task', {
      'prompt': prompt,
      'platform': 'nano_banana',
      'images': [ 'https://cdn.deepfakemaker.io/' + file.data.object_name ],
      'output_format': 'png',
      'user_id': userId
    }).then(i => i.data);

    const progress = await new Promise((resolve, reject) => {
      let retries = 20;
      const interval = setInterval(async () => {
        const xz = await instance.get('/replicate/v1/free/nano/banana/task', {
          params: {
            user_id: userId,
            ...taskData.data
          }
        }).then(i => i.data);

        if (xz.msg === 'success') {
          clearInterval(interval);
          resolve(xz.data.generate_url);
        }
        if (--retries <= 0) {
          clearInterval(interval);
          reject(new Error('Failed to get task.'));
        }
      }, 2500);
    });
    
    return progress;
  } catch (error) {
    throw new Error(error.message);
  }
}

module.exports = (app) => {
  app.get('/ai/tofigure', async (req, res) => {
    try {
      const { imageUrl, apikey } = req.query;

      // Validate API key (already handled by middleware, but double-check)
      if (!apikey) {
        return res.status(401).json({
          status: 401,
          error: 'API key required',
          message: 'Please provide an API key'
        });
      }

      // Validate required parameters
      if (!imageUrl) {
        return res.status(400).json({
          status: 400,
          error: 'Missing required parameter',
          message: 'Please provide imageUrl parameter'
        });
      }

      const defaultPrompt = `Create a 1/7 scale commercialized figurine of the characters in the picture, in a realistic style, in a real environment. The figurine is placed on a computer desk. The figurine has a round transparent acrylic base, with no text on the base. The content on the computer screen is the Zbrush modeling process of this figurine. Next to the computer screen is a BANDAI-style toy packaging box printed with the original artwork. The packaging features two-dimensional flat illustrations`;

      // Download image from URL
      const imageResponse = await axios.get(imageUrl, {
        responseType: 'arraybuffer'
      });

      const buffer = Buffer.from(imageResponse.data);

      // Process image with ToFigure AI using defaultPrompt
      const resultUrl = await convert(buffer, defaultPrompt);

      res.json({
        status: 200,
        creator: "@Terri",
        result: {
          url: resultUrl,
          prompt: defaultPrompt
        }
      });

    } catch (error) {
      console.error('ToFigure AI Error:', error);
      res.status(500).json({
        status: 500,
        error: 'Internal Server Error',
        message: error.message
      });
    }
  });
};