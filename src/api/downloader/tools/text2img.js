const axios = require("axios");

function generateIP() {
  const x = (a) => (Math.random() * a).toFixed();
  return `${x(300)}.${x(300)}.${x(300)}.${x(300)}`;
}

async function txt2img(prompt) {
  try {
    if (!prompt) throw new Error("Missing prompt input");
    
    const response = await axios.post("https://internal.users.n8n.cloud/webhook/ai_image_generator", {
      prompt
    }, {
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Zanixon/1.0.0',
        'X-Client-Ip': generateIP()
      },
      timeout: 60000
    });
    
    const data = response.data;
    if (!data.result) throw new Error("Failed generating image");
    
    return {
      success: true,
      images: data.result
    };
  } catch (error) {
    throw new Error(`Image generation failed: ${error.message}`);
  }
}

module.exports = function(app) {
  app.get('/tools/text2img', async (req, res) => {
    try {
      const { prompt, apikey } = req.query;
      
      if (!prompt) {
        return res.status(400).json({
          status: 400,
          error: 'Prompt parameter required',
          message: 'Please provide a prompt using the prompt parameter'
        });
      }

      const result = await txt2img(prompt);
      
      res.json({
        status: 200,
        creator: "@Terri",
        data: result
      });
      
    } catch (error) {
      console.error('Text2Img Error:', error);
      res.status(500).json({
        status: 500,
        error: 'Image generation failed',
        message: error.message
      });
    }
  });
};
