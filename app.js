const express = require('express');
const tasksRoute = require("./routes/admin")
const authRoute = require("./routes/auth")
const app = express()
const bodyParser = require("body-parser")
const DBConcction = require('./util/database').DBConcction
const multer = require('multer')
const path = require("path")
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./swagger.json');
require("dotenv").config();

// Use memoryStorage for Vercel (read-only filesystem)
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
    
    app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
    app.use(bodyParser.json()); // application/json
  app.use(
    multer({ storage: fileStorage, fileFilter: fileFilter }).single('image')
  );

app.use((req , res , next) => {
    res.setHeader("Access-Control-Allow-Origin" , "*")
    res.setHeader("Access-Control-Allow-Methods" , "GET , POST , PUT , PATCH , DELETE")
    res.setHeader("Access-Control-Allow-Headers" , "Content-Type , Authorization") 
    next()
})
app.use('/tasks' , tasksRoute)
app.use('/auth' , authRoute)

app.use((error, req, res, next) => {
    const status = error.statusCode || 500;
    const message = error.message;
    res.status(status).json({ message: message });
  });

// Connect to DB once and export app for Vercel serverless
let isConnected = false;

const connectDB = async () => {
  if (isConnected) return;
  await require('mongoose').connect(process.env.MONGO_URL);
  isConnected = true;
  console.log("DB Connected!!");
};

// Wrap app to ensure DB connection before handling requests
const handler = async (req, res) => {
  await connectDB();
  return app(req, res);
};

// For local development
if (process.env.NODE_ENV !== 'production') {
  const port = process.env.PORT || 8080;
  DBConcction(() => {
    app.listen(port, () => console.log(`Server running on port ${port}`));
  });
}

module.exports = handler;
