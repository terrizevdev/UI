const axios = require("axios")
const cheerio = require("cheerio")
 
async function npmstalk(packageName) {
  let stalk = await axios.get("https://registry.npmjs.org/"+packageName)
  let versions = stalk.data.versions
  let allver = Object.keys(versions)
  let verLatest = allver[allver.length-1]
  let verPublish = allver[0]
  let packageLatest = versions[verLatest]
  return {
    name: packageName,
    versionLatest: verLatest,
    versionPublish: verPublish,
    versionUpdate: allver.length,
    latestDependencies: Object.keys(packageLatest.dependencies || {}).length,
    publishDependencies: Object.keys(versions[verPublish].dependencies || {}).length,
    publishTime: stalk.data.time.created,
    latestPublishTime: stalk.data.time[verLatest],
    description: stalk.data.description || '',
    author: stalk.data.author?.name || stalk.data.author || 'Unknown',
    license: stalk.data.license || 'Unknown'
  }
}

module.exports = function (app) {
  app.get('/stalk/npm', async (req, res) => {
    const { name, apikey } = req.query
    
    if (!name) {
      return res.status(400).json({
        status: 400,
        error: 'Name parameter required',
        message: 'Please provide a package name using the name parameter'
      });
    }

    try {
      const results = await npmstalk(name);  
      res.json({
        status: 200,
        creator: "@Terri",
        data: results
      });
    } catch (error) {
      console.error('NPM Stalk Error:', error);
      
      if (error.response && error.response.status === 404) {
        return res.status(404).json({
          status: 404,
          error: 'Package not found',
          message: `Package "${name}" not found on NPM registry`
        });
      }
      
      res.status(500).json({
        status: 500,
        error: 'Stalk failed',
        message: error.message
      });
    }
  });
}
