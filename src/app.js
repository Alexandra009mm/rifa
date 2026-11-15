const express = require('express');
const path = require('path');
const cors = require('cors');
const ticketRoutes = require('./routes/ticketRoutes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static frontend assets
const publicPath = path.join(__dirname, '..', 'public');
const imgPath = path.join(__dirname, '..', 'img');

app.use(express.static(publicPath));
app.use('/img', express.static(imgPath));

// Healthcheck endpoint for docker container orchestrators
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Ticket API routes
app.use('/api/tickets', ticketRoutes);

// Centralized error handling middleware
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(`[Error] ${req.method} ${req.url}:`, err.message);
  const status = err.status || 400;
  res.status(status).json({
    success: false,
    error: err.message || 'Internal server error'
  });
});

module.exports = app;
