
const express = require('express');
const app = express();
const PORT = process.env.PORT || 4000;

app.use(express.json());
app.use(cors());

// Basic test route
app.get('/api/status', (req, res) => {
  res.json({
    status: 200,
    message: 'API is running',
    server_time: new Date().toISOString()
  });
});

// Health check
app.get('/', (req, res) => {
  res.json({ message: 'Server is working!' });
});

// Export for Vercel
module.exports = app;
