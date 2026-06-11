const express = require('express');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./swagger.json');

// Load .env from both possible locations
require('dotenv').config();
require('dotenv').config({ path: path.join(__dirname, 'util', '.env') });

const tasksRoute = require('./routes/admin');
const authRoute = require('./routes/auth');

const app = express();

// Use memoryStorage — Vercel has a read-only filesystem
const fileStorage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  if (
    file.mimetype === 'image/png' ||
    file.mimetype === 'image/jpg' ||
    file.mimetype === 'image/jpeg'
  ) {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.use(bodyParser.json());
app.use(multer({ storage: fileStorage, fileFilter: fileFilter }).single('image'));

// CORS
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

app.use('/tasks', tasksRoute);
app.use('/auth', authRoute);

// Global error handler
app.use((error, req, res, next) => {
  console.error('Error:', error);
  const status = error.statusCode || 500;
  const message = error.message;
  res.status(status).json({ message: message });
});

// ── DB Connection (cached for serverless) ────────────────────────────────────
const mongoose = require('mongoose');
let isConnected = false;

const connectDB = async () => {
  if (isConnected) return;
  if (!process.env.MONGO_URL) {
    throw new Error('MONGO_URL environment variable is not set!');
  }
  await mongoose.connect(process.env.MONGO_URL);
  isConnected = true;
  console.log('DB Connected!!');
};

// ── Export for Vercel serverless ─────────────────────────────────────────────
module.exports = async (req, res) => {
  try {
    await connectDB();
  } catch (err) {
    console.error('DB connection failed:', err.message);
    return res.status(500).json({ message: 'Database connection failed: ' + err.message });
  }
  return app(req, res);
};

// ── Local development only ────────────────────────────────────────────────────
if (require.main === module) {
  const port = process.env.PORT || 8080;
  connectDB()
    .then(() => {
      app.listen(port, () => console.log(`Server running on port ${port}`));
    })
    .catch(err => {
      console.error('Failed to start server:', err);
      process.exit(1);
    });
}
