const express = require('express');
const tasksRoute = require('./routes/admin');
const authRoute = require('./routes/auth');
const app = express();
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./swagger.json');
require('dotenv').config();
require('dotenv').config({ path: path.join(__dirname, 'util', '.env') });

const mongoose = require('mongoose');
const port = process.env.PORT || 8080;

// ── Multer (memoryStorage works on both Render & Vercel) ──────────────────────
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

// ── Middleware ────────────────────────────────────────────────────────────────
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

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/tasks', tasksRoute);
app.use('/auth', authRoute);

// ── Global Error Handler ──────────────────────────────────────────────────────
app.use((error, req, res, next) => {
  console.error('Error:', error.message);
  const status = error.statusCode || 500;
  res.status(status).json({ message: error.message });
});

// ── DB Connection & Server Start ──────────────────────────────────────────────
mongoose
  .connect(process.env.MONGO_URL)
  .then(() => {
    console.log('DB Connected!!');
    app.listen(port, () => console.log(`Server running on port ${port}`));
  })
  .catch(err => {
    console.error('DB connection failed:', err.message);
    process.exit(1);
  });

// ── Export for Vercel (optional) ──────────────────────────────────────────────
module.exports = app;
