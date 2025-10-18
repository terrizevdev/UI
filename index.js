const express = require('express');
const chalk = require('chalk');
const fs = require('fs');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 4000;

app.enable("trust proxy");
app.set("json spaces", 2);

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cors());

// Load settings
const settingsPath = path.join(__dirname, './src/settings.json');
const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));

// Maintenance Middleware - Letakkan SEBELUM static files
app.use((req, res, next) => {
    if (settings.maintenance && settings.maintenance.enabled) {
        console.log(chalk.bgRed.white(' MAINTENANCE MODE ACTIVE '));
        return res.status(503).sendFile(path.join(__dirname, 'api-page', 'maintenance.html'));
    }
    next();
});

// API Key Middleware
app.use((req, res, next) => {
  // Skip API key check for certain routes
  if (req.path === '/' || 
      req.path.startsWith('/src') || 
      req.path === '/api/status' ||
      req.path.startsWith('/api-page')) {
    return next();
  }
  
  const apiKey = req.query.apikey || req.headers['x-api-key'];
  
  if (!apiKey) {
    return res.status(401).json({
      status: 401,
      message: "API key required",
      error: "Missing API key. Please provide an API key via query parameter ?apikey=YOUR_KEY or x-api-key header."
    });
  }
  
  if (!settings.apikey.includes(apiKey)) {
    return res.status(403).json({
      status: 403,
      message: "Invalid API key",
      error: "The provided API key is invalid or expired."
    });
  }
  
  next();
});

// Static files
app.use('/', express.static(path.join(__dirname, 'api-page')));
app.use('/src', express.static(path.join(__dirname, 'src')));

// Response formatter
app.use((req, res, next) => {
    const originalJson = res.json;
    res.json = function (data) {
        if (data && typeof data === 'object') {
            const responseData = {
                status: data.status,
                creator: settings.apiSettings.creator || "Created Using Rynn UI",
                ...data
            };
            return originalJson.call(this, responseData);
        }
        return originalJson.call(this, data);
    };
    next();
});

// Api Route
let totalRoutes = 0;
const apiFolder = path.join(__dirname, './src/api');
fs.readdirSync(apiFolder).forEach((subfolder) => {
    const subfolderPath = path.join(apiFolder, subfolder);
    if (fs.statSync(subfolderPath).isDirectory()) {
        fs.readdirSync(subfolderPath).forEach((file) => {
            const filePath = path.join(subfolderPath, file);
            if (path.extname(file) === '.js') {
                require(filePath)(app);
                totalRoutes++;
                console.log(chalk.bgHex('#FFFF99').hex('#333').bold(` Loaded Route: ${path.basename(file)} `));
            }
        });
    }
});
console.log(chalk.bgHex('#90EE90').hex('#333').bold(' Load Complete! ✓ '));
console.log(chalk.bgHex('#90EE90').hex('#333').bold(` Total Routes Loaded: ${totalRoutes} `));

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'api-page', 'index.html'));
});

// Error handlers
app.use((req, res, next) => {
    res.status(404).sendFile(path.join(__dirname, 'api-page', '404.html'));
});

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).sendFile(path.join(__dirname, 'api-page', '500.html'));
});

app.listen(PORT, () => {
    console.log(chalk.bgHex('#90EE90').hex('#333').bold(` Server is running on port ${PORT} `));
    
    // Log maintenance status on startup
    if (settings.maintenance && settings.maintenance.enabled) {
        console.log(chalk.bgRed.white(' MAINTENANCE MODE ENABLED '));
        console.log(chalk.yellow(` Maintenance GIF: ${settings.maintenance.gifUrl} `));
    }
    
    // Log API key status
    if (settings.apikey && settings.apikey.length > 0) {
        console.log(chalk.bgHex('#ADD8E6').hex('#333').bold(` API Key Protection: ENABLED `));
        console.log(chalk.blue(` Valid API Keys: ${settings.apikey.join(', ')} `));
    }
});

module.exports = app;