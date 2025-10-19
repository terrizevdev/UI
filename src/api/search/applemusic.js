const axios = require("axios");
const cheerio = require("cheerio");

async function applemusic(query, region = "us") {
  try {
    const res = await axios.get(
      `https://music.apple.com/${region}/search?term=${encodeURIComponent(query)}`,
      {
        timeout: 30000,
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        },
      }
    );

    const $ = cheerio.load(res.data);
    const results = [];

    $(".top-search-lockup").each((_, el) => {
      const title = $(el).find(".top-search-lockup__primary__title").text().trim();
      const artist = $(el).find(".top-search-lockup__secondary").text().trim();
      const link = $(el).find(".click-action").attr("href");
      const image = $(el).find("picture source").attr("srcset")?.split(" ")[0];

      if (title && artist && link) {
        results.push({
          title,
          artist,
          link: link.startsWith("http")
            ? link
            : `https://music.apple.com${link}`,
          image: image || null,
        });
      }
    });

    return results;
  } catch (error) {
    console.error("error:", error.message);
    throw new Error("error njir");
  }
}

module.exports = function(app) {
  app.get('/search/applemusic', async (req, res) => {
    try {
      const { q, region = 'us', apikey } = req.query;
      
      if (!q) {
        return res.status(400).json({
          status: 400,
          error: 'Query parameter required',
          message: 'Please provide a search query using the q parameter'
        });
      }

      const results = await applemusic(q, region);
      
      res.json({
        status: 200,
        creator: "@Terri",
        data: results
      });
      
    } catch (error) {
      console.error('Apple Music Search Error:', error);
      res.status(500).json({
        status: 500,
        error: 'Search failed',
        message: error.message
      });
    }
  });
};