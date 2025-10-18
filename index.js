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

// API Key Validation Middleware
app.use((req, res, next) => {
  // Skip API key validation for static files and main pages
  if (req.path === '/' || 
      req.path.startsWith('/src/') || 
      req.path.startsWith('/api-page/') ||
      req.path === '/src/settings.json') {
    return next();
  }

  // Skip API key validation for maintenance page
  if (settings.maintenance && settings.maintenance.enabled) {
    return next();
  }

  // Check for API key in query parameters
  const apiKey = req.query.apikey;
  const validApiKeys = settings.apiSettings.apikey || [];

  if (!apiKey) {
    return res.status(401).json({
      status: 401,
      error: 'API key required',
      message: 'Please provide an API key using the apikey parameter',
      valid_keys: validApiKeys
    });
  }

  if (!validApiKeys.includes(apiKey)) {
    return res.status(403).json({
      status: 403,
      error: 'Invalid API key',
      message: 'The provided API key is invalid',
      valid_keys: validApiKeys
    });
  }

  next();
});

// Maintenance Middleware - Letakkan SEBELUM static files
app.use((req, res, next) => {
    if (settings.maintenance && settings.maintenance.enabled) {
        console.log(chalk.bgRed.white(' MAINTENANCE MODE ACTIVE '));
        return res.status(503).sendFile(path.join(__dirname, 'api-page', 'maintenance.html'));
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

// API Status endpoint (public, no API key required)
app.get('/api/status', (req, res) => {
    res.json({
        status: 200,
        message: 'API is running',
        maintenance: settings.maintenance?.enabled || false,
        total_routes: totalRoutes,
        server_time: new Date().toISOString(),
        creator: settings.apiSettings.creator
    });
});

// Settings endpoint (public, no API key required)
app.get('/src/settings.json', (req, res) => {
    res.json(settings);
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
    
    // Log API key info
    const validApiKeys = settings.apiSettings.apikey || [];
    console.log(chalk.bgHex('#FFFF99').hex('#333').bold(` Valid API Keys: ${validApiKeys.join(', ')} `));
    
    // Log maintenance status on startup
    if (settings.maintenance && settings.maintenance.enabled) {
        console.log(chalk.bgRed.white(' MAINTENANCE MODE ENABLED '));
        console.log(chalk.yellow(` Maintenance GIF: ${settings.maintenance.gifUrl} `));
    }
});

module.exports = app;