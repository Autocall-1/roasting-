require('dotenv').config();
const express = require('express');
const cors = require('cors');

const entertainmentRoutes = require('./routes/entertainment.routes');
const photosRoutes = require('./routes/photos.routes');

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.use('/api/entertainment', entertainmentRoutes);
app.use('/api/photos', photosRoutes);

app.get('/health', (req, res) => res.json({ status: 'ok' }));

// Central error handler (catches anything thrown outside try/catch in controllers)
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'internal_server_error' });
});

module.exports = app;
