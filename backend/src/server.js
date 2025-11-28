require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

require('./config/db');
const audioRoutes = require('./routes/audioRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure CORS based on environment
const corsOptions = {
  origin: process.env.CORS_ORIGINS 
    ? process.env.CORS_ORIGINS.split(',').map(origin => origin.trim())
    : '*',
  credentials: true
};

app.use(cors(corsOptions));
app.use(express.json());

app.use('/uploads', express.static(uploadsDir));
app.use('/api/audio', audioRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'Musicify backend is running' });
});

app.listen(PORT, () => {
  console.log(`Musicify backend listening on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});
